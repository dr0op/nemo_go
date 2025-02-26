package onlineapi

import (
	"encoding/json"
	"fmt"
	"github.com/hanc00l/nemo_go/pkg/conf"
	"github.com/hanc00l/nemo_go/pkg/logging"
	"github.com/hanc00l/nemo_go/pkg/task/domainscan"
	"github.com/hanc00l/nemo_go/pkg/task/portscan"
	"github.com/hanc00l/nemo_go/pkg/utils"
	"strconv"
	"strings"
)

type FofaConfig struct {
	Target           string `json:"target"`
	OrgId            *int   `json:"orgId"`
	IsIPLocation     bool   `json:"ipLocation"`
	IsHttpx          bool   `json:"httpx"`
	IsWhatWeb        bool   `json:"whatweb"`
	IsScreenshot     bool   `json:"screenshot"`
	IsWappalyzer     bool   `json:"wappalyzer"`
	IsFingerprintHub bool   `json:"fingerprinthub"`
	IsIconHash       bool   `json:"iconhash"`
}

type QuakeConfig struct {
	FofaConfig
}

type ICPQueryConfig struct {
	Target string `json:"target"`
}

type fofaSearchResult struct {
	Domain  string
	Host    string
	IP      string
	Port    string
	Title   string
	Country string
	City    string
	Server  string
	Banner  string
}

type fofaQueryResult struct {
	Results [][]string `json:"results"`
}

type icpQueryResult struct {
	StateCode int     `json:"StateCode"`
	Reason    string  `json:"Reason"`
	Result    ICPInfo `json:"Result"`
}

type ICPInfo struct {
	Domain      string `json:"Domain"`
	Owner       string `json:"Owner"`
	CompanyName string `json:"CompanyName"`
	CompanyType string `json:"CompanyType"`
	SiteLicense string `json:"SiteLicense"`
	SiteName    string `json:"SiteName"`
	MainPage    string `json:"MainPage"`
	VerifyTime  string `json:"VerifyTime"`
}

// parseFofaSearchResult 转换FOFA搜索结果
func (ff *Fofa) parseFofaSearchResult(queryResult []byte) (result []fofaSearchResult) {
	r := fofaQueryResult{}
	err := json.Unmarshal(queryResult, &r)
	if err != nil {
		logging.RuntimeLog.Error(err.Error())
		return result
	}
	for _, line := range r.Results {
		fsr := fofaSearchResult{
			Domain: line[0], Host: line[1], IP: line[2], Port: line[3], Title: line[4],
			Country: line[5], City: line[6], Server: line[7], Banner: line[8],
		}
		if strings.HasPrefix(fsr.Banner, "HTTP/1") {
			fsr.Banner = ""
		}
		result = append(result, fsr)
	}

	return result
}

// parseResult 解析搜索结果
func (ff *Fofa) parseResult() {
	ff.IpResult = portscan.Result{IPResult: make(map[string]*portscan.IPResult)}
	ff.DomainResult = domainscan.Result{DomainResult: make(map[string]*domainscan.DomainResult)}

	for _, fsr := range ff.Result {
		parseIpPort(ff.IpResult, fsr, "fofa")
		parseDomainIP(ff.DomainResult, fsr, "fofa")
	}
}

// SaveResult 保存搜索的结果
func (ff *Fofa) SaveResult() string {
	if conf.GlobalWorkerConfig().API.Fofa.Key == "" || conf.GlobalWorkerConfig().API.Fofa.Name == "" {
		return "no fofa api"
	}
	ips := ff.IpResult.SaveResult(portscan.Config{OrgId: ff.Config.OrgId})
	domains := ff.DomainResult.SaveResult(domainscan.Config{OrgId: ff.Config.OrgId})

	return fmt.Sprintf("%s,%s", ips, domains)
}

// parseQuakeSearchResult 解析Quake搜索结果
func (q *Quake) parseQuakeSearchResult(queryResult []byte) (result []fofaSearchResult, finish bool) {
	var serviceInfo ServiceInfo
	err := json.Unmarshal(queryResult, &serviceInfo)
	if err != nil {
		//json数据反序列化失败
		//如果是json: cannot unmarshal object into Go struct field ServiceInfo.data of type []struct { Time time.Time "json:\"time\""; Transport string "json:\"transport\""; Service struct { HTTP struct
		//则基本上是API的key失效，或积分不足无法读取
		logging.CLILog.Println(err)
		return
	}
	if strings.HasPrefix(serviceInfo.Message, "Successful") == false {
		logging.CLILog.Printf("Quake Search Error:%s", serviceInfo.Message)
		return
	}
	for _, data := range serviceInfo.Data {
		qsr := fofaSearchResult{
			Host:   data.Service.HTTP.Host,
			IP:     data.IP,
			Port:   fmt.Sprintf("%d", data.Port),
			Title:  data.Service.HTTP.Title,
			Server: data.Service.HTTP.Server,
		}
		result = append(result, qsr)
	}
	// 如果是API有效、正确获取到数据，count为0，表示已是最后一页了
	if serviceInfo.Meta.Pagination.Count == 0 {
		finish = true
	}
	return
}

// parseResult 解析搜索结果
func (q *Quake) parseResult() {
	q.IpResult = portscan.Result{IPResult: make(map[string]*portscan.IPResult)}
	q.DomainResult = domainscan.Result{DomainResult: make(map[string]*domainscan.DomainResult)}

	for _, fsr := range q.Result {
		parseIpPort(q.IpResult, fsr, "quake")
		parseDomainIP(q.DomainResult, fsr, "quake")
	}
}

// SaveResult 保存搜索结果
func (q *Quake) SaveResult() string {
	if conf.GlobalWorkerConfig().API.Quake.Key == "" {
		return "no quake api"
	}
	ips := q.IpResult.SaveResult(portscan.Config{OrgId: q.Config.OrgId})
	domains := q.DomainResult.SaveResult(domainscan.Config{OrgId: q.Config.OrgId})

	return fmt.Sprintf("%s,%s", ips, domains)
}

// parseIpPort 解析搜索结果中的IP记录
func parseIpPort(ipResult portscan.Result, fsr fofaSearchResult, source string) {
	if fsr.IP == "" || !utils.CheckIPV4(fsr.IP) {
		return
	}

	if !ipResult.HasIP(fsr.IP) {
		ipResult.SetIP(fsr.IP)
	}
	portNumber, _ := strconv.Atoi(fsr.Port)
	if !ipResult.HasPort(fsr.IP, portNumber) {
		ipResult.SetPort(fsr.IP, portNumber)
	}
	if fsr.Title != "" {
		ipResult.SetPortAttr(fsr.IP, portNumber, portscan.PortAttrResult{
			Source:  source,
			Tag:     "title",
			Content: fsr.Title,
		})
	}
	if fsr.Server != "" {
		ipResult.SetPortAttr(fsr.IP, portNumber, portscan.PortAttrResult{
			Source:  source,
			Tag:     "server",
			Content: fsr.Server,
		})
	}
	if fsr.Banner != "" {
		ipResult.SetPortAttr(fsr.IP, portNumber, portscan.PortAttrResult{
			Source:  source,
			Tag:     "banner",
			Content: fsr.Banner,
		})
	}
}

// parseDomainIP 解析搜索结果中的域名记录
func parseDomainIP(domainResult domainscan.Result, fsr fofaSearchResult, source string) {
	host := strings.Replace(fsr.Host, "https://", "", -1)
	host = strings.Replace(host, "http://", "", -1)
	host = strings.Replace(host, "/", "", -1)
	domain := strings.Split(host, ":")[0]
	if domain == "" || utils.CheckIPV4(domain) || utils.CheckDomain(domain) == false {
		return
	}

	if !domainResult.HasDomain(domain) {
		domainResult.SetDomain(domain)
	}
	domainResult.SetDomainAttr(domain, domainscan.DomainAttrResult{
		Source:  source,
		Tag:     "A",
		Content: fsr.IP,
	})
	if fsr.Title != "" {
		domainResult.SetDomainAttr(domain, domainscan.DomainAttrResult{
			Source:  source,
			Tag:     "title",
			Content: fsr.Title,
		})
	}
	if fsr.Server != "" {
		domainResult.SetDomainAttr(domain, domainscan.DomainAttrResult{
			Source:  source,
			Tag:     "server",
			Content: fsr.Server,
		})
	}
	if fsr.Banner != "" {
		domainResult.SetDomainAttr(domain, domainscan.DomainAttrResult{
			Source:  source,
			Tag:     "banner",
			Content: fsr.Banner,
		})
	}
}
