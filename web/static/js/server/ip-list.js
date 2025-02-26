$(function () {
    load_portscan_config();
    //搜索
    $("#search").click(function () {
        $("#hidden_org_id").val($("#select_org_id_search").val())
        $("#ip_table").DataTable().draw(true);
    });
    //新建任务窗口
    $("#create_task").click(function () {
        var checkIP = [];
        $('#ip_table').DataTable().$('input[type=checkbox]:checked').each(function (i) {
            checkIP[i] = $(this).val().split("|")[1];
        });
        $('#text_target').val(checkIP.join("\n"));
        $('#newTask').modal('toggle');
    });
    //导入本地扫描结果窗口
    $("#import_portscan").click(function () {
        $('#importPortscan').modal('toggle');
    });
    $("#start_import").click(function () {
        var formData = new FormData();
        formData.append('file', $('#file')[0].files[0]);
        formData.append('bin', $('#select_portscan_bin').val());
        formData.append("org_id", $('#select_import_org_id_task').val());
        $.ajax({
            url: '/ip-import-portscan',
            type: 'POST',
            cache: false,
            data: formData,
            processData: false,
            contentType: false
        }).done(function (res) {
            if (res['status'] == "success") {
                swal({
                        title: "导入成功！",
                        text: res['msg'],
                        type: "success",
                        confirmButtonText: "确定",
                        confirmButtonColor: "#41b883",
                        closeOnConfirm: true,
                    },
                    function () {
                        $('#importPortscan').modal('hide');
                    });
            } else {
                swal('Warning', '导入失败！' + res['msg'], 'error');
            }
        }).fail(function (res) {
            swal('Warning', '导入失败！' + res['msg'], 'error');
        });
    })
    //执行新建任务Button
    $("#start_task").click(function () {
        const target = $('#text_target').val();
        if (!target) {
            swal('Warning', '请至少输入一个Target', 'error');
            return;
        }
        if (getCurrentTabIndex() == 0) {
            const port = $('#input_port').val();
            const rate = $('#input_rate').val();
            let exclude_ip = "";
            if ($('#checkbox_exclude').is(":checked")) {
                exclude_ip = $('#input_exclude').val();
            }
            $.post("/task-start-portscan",
                {
                    "target": target,
                    "port": port,
                    'rate': rate,
                    'portscan': $('#checkbox_portscan').is(":checked"),
                    'nmap_tech': $('#select_tech').val(),
                    'bin': $('#select_bin').val(),
                    'org_id': $('#select_org_id_task').val(),
                    'iplocation': $('#checkbox_iplocation').is(":checked"),
                    'whatweb': false,
                    'ping': $('#checkbox_ping').is(":checked"),
                    'fofasearch': $('#checkbox_fofasearch').is(":checked"),
                    'quakesearch': $('#checkbox_quakesearch').is(":checked"),
                    'taskmode': $('#select_taskmode').val(),
                    'httpx': $('#checkbox_httpx').is(":checked"),
                    'exclude': exclude_ip,
                    'screenshot': $('#checkbox_screenshot').is(":checked"),
                    'wappalyzer': $('#checkbox_wappalyzer').is(":checked"),
                    'fingerprinthub': $('#checkbox_fingerprinthub').is(":checked"),
                    'iconhash': $('#checkbox_iconhash').is(":checked"),
                }, function (data, e) {
                    if (e === "success" && data['status'] == 'success') {
                        swal({
                                title: "新建任务成功！",
                                text: "TaskId:" + data['msg'],
                                type: "success",
                                confirmButtonText: "确定",
                                confirmButtonColor: "#41b883",
                                closeOnConfirm: true,
                            },
                            function () {
                                $('#newTask').modal('hide');
                            });
                    } else {
                        swal('Warning', "添加任务失败! " + data['msg'], 'error');
                    }
                });
        }
        if (getCurrentTabIndex() == 1) {
            if ($('#checkbox_pocsuite3').is(":checked") == false && $('#checkbox_xray').is(":checked") == false &&  $('#checkbox_dirsearch').is(":checked") == false) {
                swal('Warning', '请选择要使用的验证工具！', 'error');
                return;
            }
            if ($('#checkbox_pocsuite3').is(":checked")) {
                if ($('#input_pocsuite3_poc_file').val() == '') {
                    swal('Warning', '请选择poc file', 'error');
                    return;
                }
            }
            if ($('#checkbox_xray').is(":checked")) {
                if ($('#input_xray_poc_file').val() == '') {
                    swal('Warning', '请选择poc file', 'error');
                    return;
                }
            }
            if ($('#checkbox_dirsearch').is(":checked")) {
                if ($('#input_dirsearch_ext').val() == '') {
                    swal('Warning', '请选择EXTENSIONS', 'error');
                    return;
                }
            }
            $.post("/task-start-vulnerability",
                {
                    "target": target,
                    'pocsuite3verify': $('#checkbox_pocsuite3').is(":checked"),
                    'pocsuite3_poc_file': $('#input_pocsuite3_poc_file').val(),
                    'xrayverify': $('#checkbox_xray').is(":checked"),
                    'xray_poc_file': $('#input_xray_poc_file').val(),
                    'dirsearch': $('#checkbox_dirsearch').is(":checked"),
                    'ext': $('#input_dirsearch_ext').val(),
                }, function (data, e) {
                    if (e === "success" && data['status'] == 'success') {
                        swal({
                                title: "新建任务成功！",
                                text: "TaskId:" + data['msg'],
                                type: "success",
                                confirmButtonText: "确定",
                                confirmButtonColor: "#41b883",
                                closeOnConfirm: true,
                            },
                            function () {
                                $('#newTask').modal('hide');
                            });
                    } else {
                        swal('Warning', "添加任务失败! " + data['msg'], 'error');
                    }
                });
        }
        if (getCurrentTabIndex() == 2) {
            const port1 = $('#input_batchscan_port1').val();
            const port2 = $('#input_batchscan_port2').val();
            const rate = $('#input_batchscan_rate').val();
            let exclude_ip = "";
            if ($('#checkbox_batchscan_exclude').is(":checked")) {
                exclude_ip = $('#input_batchscan_exclude').val();
            }
            $.post("/task-start-batchscan",
                {
                    "target": target,
                    "port": port1 + "|" + port2,
                    'rate': rate,
                    'portscan': true,
                    'nmap_tech': $('#select_batchscan_tech').val(),
                    'bin': $('#select_batchscan_bin').val(),
                    'org_id': $('#select_batchscan_org_id_task').val(),
                    'iplocation': true,
                    'whatweb': false,
                    'ping': $('#checkbox_batchscan_ping').is(":checked"),
                    'fofasearch': false,
                    'quakesearch': false,
                    'taskmode': $('#select_batchscan_taskmode').val(),
                    'httpx': $('#checkbox_batchscan_httpx').is(":checked"),
                    'exclude': exclude_ip,
                    'screenshot': $('#checkbox_batchscan_screenshot').is(":checked"),
                    'wappalyzer': false,
                    'fingerprinthub': $('#checkbox_batchscan_fingerprinthub').is(":checked"),
                    'iconhash': $('#checkbox_batchscan_iconhash').is(":checked"),
                }, function (data, e) {
                    if (e === "success" && data['status'] == 'success') {
                        swal({
                                title: "新建任务成功！",
                                text: "TaskId:" + data['msg'],
                                type: "success",
                                confirmButtonText: "确定",
                                confirmButtonColor: "#41b883",
                                closeOnConfirm: true,
                            },
                            function () {
                                $('#newTask').modal('hide');
                            });
                    } else {
                        swal('Warning', "添加任务失败! " + data['msg'], 'error');
                    }
                });
        }
    });
    $("#checkbox_portscan").click(function () {
        if (this.checked) {
            $("#input_port").prop("disabled", false);
            $("#select_tech").prop("disabled", false);
            $("#select_bin").prop("disabled", false);
            $("#input_rate").prop("disabled", false);
            $("#checkbox_whatweb").prop("disabled", false);
            $("#checkbox_httpx").prop("disabled", false);
            $("#checkbox_ping").prop("disabled", false);
            $("#checkbox_exclude").prop("disabled", false);
            $("#input_exclude").prop("disabled", false);
            $("#checkbox_screenshot").prop("disabled", false);
            $("#checkbox_wappalyzer").prop("disabled", false);
            $("#checkbox_fingerprinthub").prop("disabled", false);
            $("#checkbox_iconhash").prop("disabled", false);
        } else {
            $("#input_port").prop("disabled", true);
            $("#select_tech").prop("disabled", true);
            $("#select_bin").prop("disabled", true);
            $("#input_rate").prop("disabled", true);
            $("#checkbox_whatweb").prop("disabled", true);
            $("#checkbox_httpx").prop("disabled", true);
            $("#checkbox_ping").prop("disabled", true);
            $("#checkbox_exclude").prop("disabled", true);
            $("#input_exclude").prop("disabled", true);
            $("#checkbox_screenshot").prop("disabled", true);
            $("#checkbox_wappalyzer").prop("disabled", true);
            $("#checkbox_fingerprinthub").prop("disabled", true);
            $("#checkbox_iconhash").prop("disabled", true);
        }
    })

    $("#ip_statistics").click(function () {
        let url = 'ip-statistics?';
        url += get_export_options();

        window.open(url);
    });

    $("#ip_memo_export").click(function () {
        let url = 'ip-memo-export?';
        url += get_export_options();

        window.open(url);
    });

    //批量删除
    $("#batch_delete").click(function () {
        batch_delete('#ip_table', '/ip-delete');
    });

    //IP列表
    $('#ip_table').DataTable(
        {
            "paging": true,
            "serverSide": true,
            "autowidth": false,
            "sort": false,
            "pagingType": "full_numbers",//分页样式
            'iDisplayLength': 50,
            "dom": '<i><t><"bottom"lp>',
            "ajax": {
                "url": "/ip-list",
                "type": "post",
                "data": function (d) {
                    init_dataTables_defaultParam(d);
                    return $.extend({}, d, {
                        "org_id": $('#hidden_org_id').val(),
                        "domain_address": $('#domain_address').val(),
                        "ip_address": $('#ip_address').val(),
                        "port": $('#port').val(),
                        "content": $('#content').val(),
                        "iplocation": $('#iplocation').val(),
                        "port_status": $('#port_status').val(),
                        "color_tag": $('#select_color_tag').val(),
                        "memo_content": $('#memo_content').val(),
                        "date_delta": $('#date_delta').val(),
                        "create_date_delta": $('#create_date_delta').val(),
                        'disable_fofa': $('#checkbox_disable_fofa').is(":checked"),
                    });
                }
            },
            columns: [
                {
                    data: "id",
                    width: "5%",
                    className: "dt-body-center",
                    title: '<input  type="checkbox" class="checkall" />',
                    "render": function (data, type, row) {
                        var strData = '<input type="checkbox" class="checkchild" value="' + row['id'] + "|" + row['ip'] + '"/>';
                        if (row['memo_content']) {
                            strData += '&nbsp;<span class="badge badge-primary" data-toggle="tooltip" data-html="true" title="' + html2Escape(row['memo_content']) + '"><i class="fa fa-flag"></span>';
                        }
                        return strData;
                    }
                },
                {
                    data: "index", title: "序号", width: "5%",
                    "render": function (data, type, row, meta) {
                        let strData = data;
                        if (row["honeypot"].length > 0) strData = "<span style='color:red;font-weight:bold' title='" + row["honeypot"] + "'>蜜罐</span>";
                        return strData;
                    }
                },
                {
                    data: "ip",
                    title: "IP地址",
                    width: "10%",
                    render: function (data, type, row, meta) {
                        let strData = "";
                        let disable_fofa = $('#checkbox_disable_fofa').is(":checked");
                        if (row['color_tag']) {
                            strData += '<h5><a href="/ip-info?ip=' + data + '&&disable_fofa=' + disable_fofa + '" target="_blank" class="badge ' + row['color_tag'] + '">' + data + '</a></h5>';
                        } else {
                            strData += '<a href="/ip-info?ip=' + data + '&&disable_fofa=' + disable_fofa + '" target="_blank">' + data + '</a>';
                        }
                        if (row['vulnerability']) {
                            strData += '&nbsp;<span class="badge badge-danger" data-toggle="tooltip" data-html="true" title="' + html2Escape(row['vulnerability']) + '"><i class="fa fa-bolt"></span>';
                        }
                        return strData;
                    }
                },
                {
                    data: "location", title: "归属地", width: "12%",
                    render: function (data, type, row, meta) {
                        let strData = data;
                        if(row["cdn"]){
                            strData += "&nbsp;<span class=\"badge badge-pill badge-warning\" title=\"IP可能使用了CDN\">CDN</span>\n";
                        }
                        return strData;
                    }
                },
                {
                    data: "port", title: "开放端口", width: "15%",
                    "render": function (data, type, row, meta) {
                        var strData = '<div style="width:100%;white-space:normal;word-wrap:break-word;word-break:break-all;">';
                        var pre_link = "";
                        for (var j = 0, len = data.length; j < len; j++) {
                            //提取出端口和状态
                            var port = data[j].replace(/\[.+?\]/g, "");
                            var status = data[j].replace(/^.+?\[/g, "");
                            strData += pre_link;
                            strData += '<a href="';
                            if (port == 443 || port == 8443) strData += "https";
                            else strData += 'http';
                            // 快速链接地址
                            strData += '://' + row['ip'] + ':' + port + '" target="_blank">' + port + '</a>';
                            // 端口状态
                            if (status != port) strData += "[" + status;

                            pre_link = ",";
                        }
                        strData += '</div>'
                        return strData;
                    }
                },
                {
                    data: "banner", title: "Title && Banner", width: "25%",
                    "render": function (data, type, row, meta) {
                        let title = data.substr(0, 300);
                        if (data.length > 300) title += '......';
                        const strData = '<div style="width:100%;white-space:normal;word-wrap:break-word;word-break:break-all;">' + title + '</div>';
                        return strData;
                    }
                },
                {
                    data: "screenshot", title: "ScreenShot", width: "20%",
                    "render": function (data, type, row, meta) {
                        let title = '';
                        for (let i in data) {
                            let thumbnailFile = data[i].replace('.png', '_thumbnail.png');
                            let imgTitle = data[i].replace(".png", "").replace("_", ":");
                            title += '<img src="screenshot/' + row['ip'] + '/' + thumbnailFile + '" class="img"  style="margin-bottom: 5px;margin-left: 5px;" title="' + imgTitle + '" onclick="show_bigpic(\'screenshot/' + row['ip'] + '/' + data[i] + '\')"/>'
                        }
                        const strData = '<div style="width:100%;white-space:normal;word-wrap:break-word;word-break:break-all;">' + title + '</div>';
                        return strData;
                    }
                },
            ],
            infoCallback: function (settings, start, end, max, total, pre) {
                return "共<b>" + total + "</b>条记录，当前显示" + start + "到" + end + "记录";
            },
            drawCallback: function (setting) {
                var _this = $(this);
                var tableId = _this.attr('id');
                var pageDiv = $('#' + tableId + '_paginate');
                pageDiv.append(
                    '<i class="fa fa-arrow-circle-o-right fa-lg" aria-hidden="true"></i><input id="' + tableId + '_gotoPage" type="text" style="height:20px;line-height:20px;width:40px;"/>' +
                    '<a class="paginate_button" aria-controls="' + tableId + '" tabindex="0" id="' + tableId + '_goto">Go</a>')
                $('#' + tableId + '_goto').click(function (obj) {
                    var page = $('#' + tableId + '_gotoPage').val();
                    var thisDataTable = $('#' + tableId).DataTable();
                    var pageInfo = thisDataTable.page.info();
                    if (isNaN(page)) {
                        $('#' + tableId + '_gotoPage').val('');
                        return;
                    } else {
                        var maxPage = pageInfo.pages;
                        var page = Number(page) - 1;
                        if (page < 0) {
                            page = 0;
                        } else if (page >= maxPage) {
                            page = maxPage - 1;
                        }
                        $('#' + tableId + '_gotoPage').val(page + 1);
                        thisDataTable.page(page).draw('page');
                    }
                })
            }
        }
    );//end datatable
});

function get_export_options() {
    var url = '';
    url += 'org_id=' + encodeURI($('#select_org_id_search').val());
    url += '&domain_address=' + encodeURI($('#domain_address').val());
    url += '&ip_address=' + encodeURI($('#ip_address').val());
    url += '&port=' + encodeURI($('#port').val());
    url += '&content=' + encodeURI($('#content').val());
    url += '&iplocation=' + encodeURI($('#iplocation').val());
    url += '&port_status=' + encodeURI($('#port_status').val());
    url += '&color_tag=' + encodeURI($('#select_color_tag').val());
    url += '&memo_content=' + encodeURI($('#memo_content').val());
    url += '&date_delta=' + encodeURI($('#date_delta').val());
    url += '&disable_fofa=' + encodeURI($('#checkbox_disable_fofa').is(":checked"));

    return url;
}

function load_portscan_config() {
    $.post("/config-list", function (data) {
        $('#select_bin').val(data['cmdbin']);
        $('#input_port').val(data['port']);
        $('#select_tech').val(data['tech']);
        $('#input_rate').val(data['rate']);
        $('#checkbox_ping').prop("checked", data['ping']);
        $('#select_batchscan_bin').val(data['cmdbin']);
        $('#input_batchscan_port2').val(data['port']);
        $('#select_batchscan_tech').val(data['tech']);
        $('#input_batchscan_rate').val(data['rate']);
        $('#checkbox_batchscan_ping').prop("checked", data['ping']);
    });
}

