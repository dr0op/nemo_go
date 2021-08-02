package logging

import (
	"github.com/hanc00l/nemo_go/pkg/conf"
	"github.com/sirupsen/logrus"
	"os"
	"path"
)

var (
	//RuntimeLog 系统运行时日志，记录发生的异常和错误
	RuntimeLog = logrus.New()
	// CLILog 控制台日志
	CLILog = logrus.New()
)

func init() {
	RuntimeLog.SetLevel(logrus.InfoLevel)
	RuntimeLog.SetFormatter(&logrus.JSONFormatter{})
	if file, err := os.OpenFile(path.Join(conf.GetRootPath(), "log/runtime.log"),
		os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0666); err == nil {
		RuntimeLog.SetOutput(file)
	}
	CLILog.SetFormatter(GetCustomLoggerFormatter())
}

func GetCustomLoggerFormatter() logrus.Formatter {
	customFormatter := new(logrus.TextFormatter)
	customFormatter.FullTimestamp = true                    // 显示完整时间
	customFormatter.TimestampFormat = "2006-01-02 15:04:05" // 时间格式
	customFormatter.DisableTimestamp = false                // 禁止显示时间
	customFormatter.DisableColors = false                   // 禁止颜色显示

	return customFormatter
}