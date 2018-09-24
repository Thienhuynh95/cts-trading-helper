const {ipcRenderer} = require('electron');
const func = require('./../../../class/func');
first[area_action] = (first[area_action] != undefined) ? first[area_action] : true;

var data_file = {};
var tableObj = {};
var first_load = true;
var selling = 0;
var buy_again = 0;
var last_selling = 0;
var last_buy_again = 0;
let first_table = true;

String.prototype.capitalize = function() {
    return this.trim().charAt(0).toUpperCase() + this.slice(1);
}

$(document).ready(function () {
    // read_change_data();
    // setInterval(()=>{
    //     read_change_data();
    // }, 8000);
    if (first[area_action]){
        init_event();
        soundConfig();
    }
    load();

    // soundConfig();
    //tooltip
    tooltip('.tooltip-view-log', "log");
    tooltip('.tooltip-time_current', "time_current");
    first[area_action] = false;
    setInterval(()=>{
        load();
    }, 20000)

    function load(){
        client_send_send(`read-file`, {path: 'public/themes/electron/assets/data/user_hand_trading/u_100001.txt', type: 'user_hand_trading', view: area_action});
        setTimeout(()=>{ 
            client_send_send('server-send-price', {view: area_action});
        }, 100);
        if (first[area_action]){
            setInterval(()=>{
                if (area_action == `${area}-index`){
                    console.log(area_action);
                    client_send_send('server-send-price', {view: area_action});
                }
            },6000);
        }
    }

    function init_event(){
        ipcRenderer.on(`read-file-return-${area_action}`, (event, data)=>{
            let type = data['type'];
            let dt = JSON.parse(data['data']);
            switch(type){
                case 'user_hand_trading':{
                    data_file[type] = dt;
                    client_send_send('read-file', {path: 'public/themes/electron/assets/data/user_api_config/user_api.txt', type: 'api', view: area_action});
                    break;
                }
                case 'api':{
                    data_file[type] = dt;
                    loadTable(data_file);
                    break;
                }
            }
        })

        // real time current price
        ipcRenderer.on(`server-send-price-return-${area_action}`, function (event, data) {
            Object.keys(data['data']).some((k, i) => {
                let price_obj = data['data'][k];
                let $price_list = $(`tr.${k}`);
                $price_span = $price_list.find(".price span");
                $price_list.map((i, e)=>{
                    let price_target =  parseFloat($(e).find(".target").text().trim());
                    let price = 0;
                    let $status = $(e).find(".status.selling");
                    let class_meet = '';
                    if ($status.length > 0){
                        price = parseFloat(price_obj.b);
                        class_meet = price > price_target ? "text-info" : "text-danger";
                    }
                    else{
                        price = parseFloat(price_obj.a);
                        class_meet = price < price_target ? "text-info" : "text-danger";
                    }
                    $(e).find(".price").html(`<span class="${class_meet} text-w600">${price.toFixed(8)}</span>`);
                });
            })
        })

        ipcRenderer.on(`check-file-status-return-${area_action}`, (event, data)=>{
            let type = data['type'];
            client_send_send('hand-trade-submit', data);
        });

        ipcRenderer.on(`hand-trade-submit-return-${area_action}`, (event, data)=>{
            setTimeout(()=>{
                if (data['status'] == 'success'){
                    show_notification(data['msg'], 'Notification', 'success');
                }
                else{
                    show_notification(data['msg'], 'Notification', 'error');
                }
                load();
            }, 500);
        })

        ipcRenderer.on(`reload-page-return`, (event, data) => {
            load();
        })
    }

    function loadTable(data_params){
        // only create data for BTC
        let account_api = data_params['api'];
        let data = data_params['user_hand_trading'];
        if (data['BTC']){
            // reset selling + buy_again value
            selling = 0;
            buy_again = 0;

            let html = 
            `<table class="table table-striped table-bordered table-hover dataTables-example">
                <thead>
                    <tr>
                        <th class="text-center">#</th>
                        <th class="text-center">Coin</th>
                        <th class="text-center">Account</th>
                        <th class="text-center">Budget</th>
                        <th class="text-center">Amount</th>
                        <th class="text-center">Created (hours)</th>
                        <th class="text-center">Last Action</th>
                        <th class="text-center">Log</th>
                        <th class="text-center">Target</th>
                        <th class="text-center">Price</th>
                        <th class="text-center">Status</th>
                        <th class="text-center" width="12%">Action</th>
                    </tr>
                </thead>

                <tbody>
                    ${
                        Object.keys(data['BTC']).map((symbol, i) => {
                            let item = data['BTC'][symbol];
                            // BTC - ADABTC 
                            return `${
                                Object.keys(item).map((order_id)=>{
                                    let order = item[order_id];
                                    let acc_name = account_api[order['user_key_id']]['acc_name']; // load later at next request to read file api
                                    let budget_buy = (order['buy'] && order['buy']['total']) ? parseFloat(order['buy']['total']).toFixed(8)
                                    : (order['sell'] && order['sell']['total'] ? parseFloat(order['sell']['total']).toFixed(8) :
                                        (order['stoploss'] && order['stoploss']['total'] ? parseFloat(order['stoploss']['total']).toFixed(8) : ''));
                                    let buy_log = order['buy_log'] ? order['buy_log'] : [];
                                    let sell_log = order['sell_log'] ? order['sell_log'] : [];
                    
                                    let status = order['status'] ? order['status'] : '';
                    
                                    let status_tmp = /pause/.exec(order['status']);
                                    status = status_tmp ? 'pause' : status;
                                    if (status == 'selling'){
                                        if (first[area_action]){
                                            last_selling++;
                                        }
                                        selling++;
                                    }
                                    else if (status == 'buying-again'){
                                        if (first[area_action]){
                                            last_buy_again++;
                                        }
                                        buy_again++;
                                    }
                                    let sell_instant = (order['trade_alg_info'] && order['trade_alg_info']['sell_instant']) ? parseFloat(order['trade_alg_info']['sell_instant']) : 0;
                                    sell_instant = (sell_instant != 0) ? true : false;
                                    id = order['order_id'];
                    
                                    let text_button_trade = "Start";
                                    let class_button_trade = "btn-success";
                    
                                    let buy_exist = order['buy'] ? true : false;
                                    let buy_again_exist = order['buy-again']? true : false;
                    
                                    // log config
                                    let actArr = ['buy', 'sell', 'buy-again'];
                                    let buylog_count = Object.keys(buy_log).length;
                                    let selllog_count = Object.keys(sell_log).length;
                                    let last_amount = order['buy'] ? order['buy']['amount'] : order['sell']['amount'];
                                    let createAt = order['createAt'] != ''? func.show_time_utc(order['createAt']) : '';
                                    //Tổng thời gian đã mua
                                    let hour_buy = createAt != '' ? (Date.now() - order['createAt']) : '';
                                    hour_buy = createAt != '' ? Math.round(hour_buy / 3600000) : '';
                                    let time_current = func.show_time_utc(Date.now());
                    
                                    let type_selling = order['trade_alg_info'] && order['trade_alg_info']['type_sell'] ? order['trade_alg_info']['type_sell'] : [];
                                    let ind_buy = 0;
                                    let ind_sell = 0;
                                    let index = 1;
                                    let log = '';
                                    let last_act_log = '';
                                    let last_act = '';
                                    let actMove = '';
                                    let dataTmp = [];
                                    actArr.map((v, i) => {
                                        if (v != 'sell'){
                                            if (ind_buy < buylog_count){
                                                if (order[v]){
                                                    buy_price = parseFloat(order[v]['price']);
                                                    buy_percent = parseFloat(order[v]['percent']);
                                                    name = v.replace('-', '');
                                                    dataTmp[index-1] = `data-${v}= "${func.show_time_utc(buy_log[ind_buy]['time'] * 1000)}- ${name}: ${parseFloat(buy_log[ind_buy]['price']).toFixed(8)} target: ${parseFloat(buy_price + buy_price * buy_percent / 100).toFixed(8)}" `;
                                                    last_act_log = `${func.show_time_utc(buy_log[ind_buy]['time'] * 1000)}- ${name.capitalize()}: ${parseFloat(buy_log[ind_buy]['price']).toFixed(8)} target: ${parseFloat(buy_price + buy_price * buy_percent / 100).toFixed(8)}`;
                                                    last_amount = buy_log[ind_buy]['amount'];
                                                    actMove += v + ' ';
                                                    last_act = v;
                                                    ind_buy++;
                                                    index++;
                                                }
                                            }
                                        }
                                        else{
                                            if (ind_sell < selllog_count){
                                                if (order[v]){
                    
                                                    type_sell = (type_selling[ind_sell] == 'target') ? 'sell' : 'stoploss';
                                                    name = type_sell;
                                                    sell_price = parseFloat(order[type_sell]['price']);
                                                    sell_percent = parseFloat(order[type_sell]['percent']);
                                                    dataTmp[index-1] = `data-${v}= "${func.show_time_utc(sell_log[ind_sell]['time'] * 1000)}- ${name}: ${parseFloat(sell_log[ind_sell]['price']).toFixed(8)} target: ${parseFloat(sell_price + sell_price * sell_percent / 100).toFixed(8)}" `;
                                                    last_act_log = `${func.show_time_utc(sell_log[ind_sell]['time'] * 1000)}- ${name.capitalize()}: ${parseFloat(sell_log[ind_sell]['price']).toFixed(8)} target: ${parseFloat(sell_price + sell_price * sell_percent / 100).toFixed(8)}`;
                                                    last_amount = sell_log[ind_sell]['amount'];
                                                    actMove += v + ' ';
                                                    last_act = v;
                                                    ind_sell++;
                                                    index++;
                                                }
                                            }
                                        }
                                    });
                                    let tmp = (status == 'buying') ? 'buy' : (status == 'buying-again' ? 'buy-again' : 'sell');
                                    let current_act_price = parseFloat(order[tmp]['price'] + order[tmp]['price'] * order[tmp]['percent'] / 100).toFixed(8);
                                    
                                    if (['buying', "selling", "finish", "watch", "buying-again"].includes(status)) {
                                        text_button_trade = "Pause";
                                        class_button_trade = "btn-primary";
                                    }
                                    let buttons_html = `<span class="btn ${class_button_trade} m-r-5 btn-outline btn-rounded btn-xs start-stop" onclick="funcStarStop(this)">${text_button_trade}</span>`;
                                    buttons_html += `<span class="btn btn-danger m-r-5 btn-outline btn-rounded btn-xs cancel-trade" onclick="funcCancel(this)">Cancel</span>`;
                                    if (status == 'selling'){
                                        if (!sell_instant){
                                            buttons_html += `<span class="btn btn-primary m-r-5 btn-rounded btn-xs sell-trade" onclick="funcSell(this)">Sell</span>`;
                                        }
                                        else{
                                            buttons_html += `<span class="btn btn-danger m-r-5 btn-rounded btn-xs restore" onclick="funcSell(this)">Back</span>`;
                                        }
                                    }
                                    return `<tr class="${symbol} odd" role="row">
                                        <td class="text-left id sorting_3">
                                            <a id="button-${area}-edit" data-section="${area}-edit" data-order-id="${order_id}" data-symbol-edit="${symbol}" data-key-id="${order['user_key_id']}" class="nav-button p-l-0 text-left color-navy-light">${order_id}</a>
                                        </td>
                                        <td class="symbol sorting_2">${symbol}</td>
                                        <td class="account" data-key-id="${order['user_key_id']}">${acc_name}</td>
                                        <td class="budget text-right">${budget_buy}</td>
                                        <td class="amount text-right">${last_amount}</td>
                                        <td class="created text-right time_current ${createAt != '' ? `tooltip-time_current" data-time_current="${time_current}"` : ''}>${createAt} (${hour_buy})</td>
                                        <td class="last-action text-right">${last_act_log}</td>
                                        <td class="log tooltip-view-log text-center" ${dataTmp.map((e, i)=> e).join('')} ${last_act_log != '' ? `data-act="${actMove}"`:''}>${last_act_log != '' ? '[ ... ]' : ''}</td>
                                        <td class="target text-right sorting_1 sorting_3">${current_act_price}</td>
                                        <td class="price text-right"><span class="text-w600"></span></td>
                                        <td class="status ${status == 'selling' ? 'selling' : (status == 'buying' ? 'buying' : '')}">${status}</td>
                                        <td class="action text-center" width="12%">${buttons_html}</td>
                                    </tr>`;
                                }).join('')
                            }`
                        })
                    }
                </tbody>
            </table>`;
            console.log(last_selling, selling);
            if (selling != last_selling || buy_again != last_buy_again){
                let sell_tmp = selling;
                let buy_tmp = buy_again;
                last_selling = sell_tmp;
                last_buy_again = buy_tmp;

                ion.sound.play("Short-ascending-bell-gliss");
            }

            $('.table-block').html(html);
        }
        
        dataTable();
        first_load = false;    
    }

    function numberWithCommas(x){
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }


    function soundConfig(){
        ion.sound({
            sounds: [
                {
                    name: "Short-ascending-bell-gliss"
                }
            ],
            volume: 1,
            path: "./assets/js/ion.sound/",
            preload: true
        });
    }

    function checkFileStatus(cb = null){
        if (typeof cb == 'function'){
            ipcRenderer.on('check-file-status-return', cb);
        }
    }

    //tooltip
    function tooltip($class, type) {
        $('body').on('mouseenter', $class, function () {
            if (!$(this).hasClass('tooltipstered')) {
                $(this).tooltipster({
                    contentAsHTML: true,
                    functionInit: function (instance, helper) {

                        var $origin = $(helper.origin);
                        switch (type) {
                            case "log":
                                if ($origin.data('act')){
                                    var act = $origin.data('act').trim();
                                    act = act.split(' ');
                                    var content = '';

                                    for(var i=0; i < act.length; i++){
                                        var current_act = act[i];
                                        var data_act = $origin.data(current_act);
                                        content += `<p>${data_act}</p>`;
                                    }
                                    instance.content(content);
                                }
                                break;
                            case "time_current":
                                var time = $origin.data('time_current');
                                if(time!="") {
                                    instance.content(`
                                                    <p>${time}</p>
                                                `);
                                }
                                break;


                        }
                    }
                }).tooltipster('show');
            }
        });
    }

    //show_notification
    function show_notification(text_1 = '', text_2 = '', type = '') {
        setTimeout(function () {
            toastr.options = {
                closeButton: true,
                progressBar: true,
                showMethod: 'slideDown',
                timeOut: 2000
            };
            switch (type) {
                case "error":
                    toastr.error(text_1, text_2);
                    break;
                default:
                    toastr.success(text_1, text_2);
                    break;
            }
        }, 100);
    }

    function dataTable() {
        console.log($('.dataTables-example'));
        if (first_load){
            
            console.log('first_load...');
            tableObj = $('.dataTables-example').DataTable({
                retrive:true,
                dom: '<"html5buttons"B>lTfgitp',
                buttons: [],
                "iDisplayLength": -1,
                orderFixed: [[8, 'desc']],
                order: [[1, 'asc'],[0, 'desc'],[8, 'desc']],
                rowGroup: {
                    dataSrc: 1
                },
                lengthMenu: [[-1,15,30,50], ["All","15","30","50"]],
            });
        }
        else{
            console.log('second_load...');
            tableObj.destroy();
            tableObj = $('.dataTables-example').DataTable({
                destroy:true,
                dom: '<"html5buttons"B>lTfgitp',
                buttons: [],
                "iDisplayLength": -1,
                orderFixed: [[8, 'desc']],
                order: [[1, 'asc'],[0, 'desc'],[8, 'desc']],
                rowGroup: {
                    dataSrc: 1
                },
                lengthMenu: [[-1,15,30,50], ["All","15","30","50"]],
            });
        }
    }

});

// on click button start/stop
function funcStarStop(ele) {
    let text = $(ele).text().toLowerCase();
    let symbol = $(ele).closest("tr").find(".symbol").text().trim();
    let order_id = $(ele).closest("tr").find(".id").text().trim();
    let status = $(ele).closest("tr").find(".status").text().trim();
    let main = symbol.substr(symbol.length - 4, symbol.length) == 'USDT' ? 'USDT' : symbol.substr(symbol.length - 3, symbol.length);
    let buy_price = $(ele).parents("tr").find(".buy_time").text().trim();

    let data = {
        text: text,
        symbol: symbol,
        main: main,
        type: "update",
        status: status,
        order_id: order_id
    };
    setTimeout(()=>{
        switch (text){
            case "start":
                $(ele).text("Pause");
                if(buy_price != 0){
                    $(ele).parents("tr").find(".status").text("selling");
                }else{
                    $(ele).parents("tr").find(".status").text("buying");
                }
                break;
            case "pause":
                $(ele).text("Start");
                $(ele).parents("tr").find(".status").text("pause");
                break;
        }
    }, 500);
    $('.start-stop').removeClass('btn-outline').attr('disabled','disabled');
    $('.cancel-trade').removeClass('btn-outline').attr('disabled','disabled');
    $('.sell-trade').removeClass('btn-outline').attr('disabled','disabled');
    client_send_send('check-file-status', {"path": `user_hand_trading`, 'type': "cancel", data: data, view: area_action});
}

// on click button cancel
function funcCancel(ele) {
    let text = $(ele).text().toLowerCase();
    let symbol = $(ele).closest("tr").find(".symbol").text().trim();
    let order_id = $(ele).closest("tr").find(".id").text().trim();
    let status = $(ele).closest("tr").find(".status").text().trim();
    let main = symbol.substr(symbol.length - 4, symbol.length) == 'USDT' ? 'USDT' : symbol.substr(symbol.length - 3, symbol.length);
    let data = {
        text: text,
        symbol: symbol,
        main: main,
        type: "cancel",
        status: status,
        order_id: order_id
    };
    $('.start-stop').removeClass('btn-outline').attr('disabled','disabled');
    $('.cancel-trade').removeClass('btn-outline').attr('disabled','disabled');
    $('.sell-trade').removeClass('btn-outline').attr('disabled','disabled');
    
    client_send_send('check-file-status', {"path": `user_hand_trading`, 'type': "cancel", data: data, view: area_action});
}

// on click button sell
function funcSell(ele) {
    let text = $(ele).text().toLowerCase();
    let symbol = $(ele).closest("tr").find(".symbol").text().trim();
    let status = $(ele).closest("tr").find(".status").text().trim();
    let price  = $(ele).closest("tr").find(".price").text().trim();
    let order_id  = $(ele).closest("tr").find(".id").text().trim();
    let main = symbol.substr(symbol.length - 4, symbol.length) == 'USDT' ? 'USDT' : symbol.substr(symbol.length - 3, symbol.length);
    let type = 'sell';
    if ($(ele).hasClass('restore')){
        type = 'restore';
    }
    let data = {
        text: text,
        symbol: symbol,
        price: price,
        main : main,
        type: type,
        order_id: order_id,
        status: status,
    };
    $('.start-stop').removeClass('btn-outline').attr('disabled','disabled');
    $('.cancel-trade').removeClass('btn-outline').attr('disabled','disabled');
    $('.sell-trade').addClass('btn-outline').attr('disabled','disabled');
    setTimeout(()=>{
        //update status
        let text = (type == 'sell') ? 'Back' : 'Sell';
        let class_btn = (type != 'sell') ? 'btn-primary' : 'btn-danger restore';
        $(ele).removeClass("btn-primary btn-danger restore").addClass(class_btn).text(text);
    }, 500);
    client_send_send('check-file-status', {"path": `user_hand_trading`, "type": "sell", data: data, view: area_action});
}

//client sent emit
function client_send_send(key = '', data = {}) {
    ipcRenderer.send(key, data);
}