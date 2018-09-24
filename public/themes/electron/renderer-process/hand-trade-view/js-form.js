var user_id = "u_100001";
var tableObj = {};
var first_load = true;
const {ipcRenderer} = require('electron');
first[area_action] = (first[area_action] != undefined) ? first[area_action] : true;

var change = {};
var data_reader = {};

$(document).ready(function () {
    // read_change_data();
    // setInterval(()=>{
    //     read_change_data();
    // }, 8000);
    $('.i-checks').iCheck({
        checkboxClass: 'icheckbox_square-green',
        radioClass: 'iradio_square-green',
    });
    init();
    getInfoClick();
    getSymbolList();
    loadApi();
    if (action == 'edit'){
        init_data();
    }
    first[area_action] = false;
    first_load = false;

    function get_price(cb = null){
        if (first[area_action]){
            if (typeof cb === 'function'){
                ipcRenderer.on(`server-send-price-return-${area_action}`, cb);
            }
            else{
                ipcRenderer.on(`server-send-price-return-${area_action}`, function (event, data) {
                    let symbol = data.s;
                    let $status = $(`tr.${symbol}`).find(".status.selling");
                    let $price_list = $status.closest('tr');
                    $price_list.find(".price").text(data.p);
                    $price_list.map((i, e)=>{
                        let price_buy =  $(e).find(".buy_price").text().trim().split("/")[0];
                        let profit = (data.p-price_buy)/price_buy*100;
                        let class_profit = profit>0?"text-info":"text-danger";
        
                        $(e).find(".profit").html(`<span class="${class_profit}">${profit.toFixed(2)}</span>`);
                    });
                })
            }
        }
    }
    
    function init_data(){
        client_send_send('hand-trade-edit', {symbol: symbol_edit, order_id : order_id, view: area_action});
        if (first[area_action]){
            ipcRenderer.on(`hand-trade-edit-return-${area_action}`, (event, data)=>{
                if (data['status'] == 'success'){
                    let order = JSON.parse(data['data']);
                    data_reader['order'] = order;
                    // option trade
                    let trade_test = order['trade_test'];
                    if (trade_test == 'inactive'){
                        $('input[name="trade_test"]').prop('checked', (trade_test == 'active' ? true : false)).attr('checked', '');
                        $('input[name="trade_test"]').closest('.icheckbox_square-green').removeClass('checked');
                    }
                    actArr = ['buy', 'sell', 'stoploss', 'buy-again'];
                    actArr.forEach((v)=>{
                        let check_html = $(`.active-${v}`).find('.icheckbox_square-green');
                        let input_check = $(`.active-${v}`).find('input');
                        if (order[v]){
                            let down = parseFloat(order[v]['percent']) * parseFloat(order[v]['price']) / 100 + parseFloat(order[v]['price']);
    
                            $('.' + v + '-price').val(order[v]['price']);
                            $('.' + v + '-percent').val(order[v]['percent']);
                            $('.' + v + '-down').val(down);
                            $('.' + v + '-amount').val(order[v]['amount']);
                            $('.' + v + '-total').val(order[v]['total']);
                            $('.' + v + '-total').val(order[v]['total']);
    
                            check_html.addClass('checked');
                            input_check.prop('checked', true).attr('checked', '');
    
                        }
                        else{
                            check_html.removeClass('checked');
                            input_check.prop('checked', false).removeAttr('checked');
                        }
                    })
                    setTimeout(()=>{
                        editable();
                    }, 1000);
                }
                else{
                    show_notification(data['msg'], 'Notification', 'error');
                }
            })
        }
    }
    
    function init(){
        activeAllRow();
        disableBuyagain();
        if (action == "edit"){
            client_send_send('get-balance', {"_id": user_key_id, view: area_action});
        }
        if ($('.coin-qty').html() == '_'){
            disableAllRow(false);
        }
        else{
            disableAllRow(true);
        }
    
        // do action when input change
        $('.input-label input:not(.symbol)').on('keyup change', function(){
            let $this = $(this);
            if ($this.val() == ''){
                $this.val(0);
            }
            let $parent = $this.closest('.form-group');
            let $input_price = $parent.find('.input-price');
            let $input_percent = $parent.find('.input-percent');
            let $help_block = $parent.find('.help-block');
            let $input_amount = $parent.find('.input-amount');
            let $input_total = $parent.find('.input-total');
    
            let $buy_price = $('.buy-price');
            let $buy_percent = $('.buy-percent');
            let $buy_help_block = $('.buy-help');
            let $buy_amount = $('.buy-amount');
            let $buy_total = $('.buy-total');
    
            let $sell_price = $('.sell-price');
            let $sell_percent = $('.sell-percent');
            let $sell_help_block = $('.sell-help');
            let $sell_amount = $('.sell-amount');
            let $sell_total = $('.sell-total');
    
            let $stoploss_price = $('.stoploss-price');
            let $stoploss_percent = $('.stoploss-percent');
            let $stoploss_help_block = $('.stoploss-help');
            let $stoploss_amount = $('.stoploss-amount');
            let $stoploss_total = $('.stoploss-total');
    
            let $buy_again_price = $('.buy-again-price');
            let $buy_again_percent = $('.buy-again-percent');
            let $buy_again_help_block = $('.buy-again-help');
            let $buy_again_amount = $('.buy-again-amount');
            let $buy_again_total = $('.buy-again-total');
    
    
            let name_attr = $this.attr('name');
            let tmp_arr = name_attr.split('-');
    
            calc($input_price, $input_percent, $help_block, $input_amount, $input_total, $this);
            // test if it's input of sell
            if (tmp_arr[0] == 'buy' && tmp_arr.length == 2){
                let buy_percent_price = parseFloat($buy_price.val()) + parseFloat($buy_price.val()) * parseFloat($buy_percent.val()) / 100;
    
                // sell
                let sell_price = (change['sell']) ? parseFloat($sell_price.val()) : buy_percent_price;
                let sell_percent = sell_price * parseFloat($sell_percent.val()) / 100 + sell_price;
                let sell_total = sell_percent * parseFloat($sell_amount.val());
                $sell_price.val(decimalNumber(parseFloat(sell_price), 8));
                $sell_total.val(decimalNumber(parseFloat(sell_total), 8));
                $sell_help_block.html(decimalNumber(parseFloat(sell_percent), 8) + ' BTC');
    
                // stoploss
                let stoploss_price = (change['stoploss']) ? parseFloat($stoploss_price.val()) : buy_percent_price;
                let stoploss_percent = stoploss_price * parseFloat($stoploss_percent.val()) / 100 + stoploss_price;
                let stoploss_total = stoploss_percent * parseFloat($stoploss_amount.val());
                $stoploss_price.val(decimalNumber(parseFloat(stoploss_price), 8));
                $stoploss_total.val(decimalNumber(parseFloat(stoploss_total), 8));
                $stoploss_help_block.html(decimalNumber(parseFloat(stoploss_percent), 8) + ' BTC');
    
                // buy_again
                let buy_again_price = (change['buy_again']) ? parseFloat($buy_again_price.val()) : buy_percent_price;
                let buy_again_percent = buy_again_price * parseFloat($buy_again_percent.val()) / 100 + buy_again_price;
                let buy_again_total = buy_again_percent * parseFloat($buy_again_amount.val());
                $buy_again_price.val(decimalNumber(parseFloat(buy_again_price), 8));
                $buy_again_total.val(decimalNumber(parseFloat(buy_again_total), 8));
                $buy_again_help_block.html(decimalNumber(parseFloat(buy_again_percent), 8) + ' BTC');
    
            }
    
        })
    
        $('.i-checks').on('ifChanged', function(){
            let $this = $(this);
    
            let $parent = $this.closest('.form-group');
            let $input_price = $parent.find('.input-price');
            let $input_percent = $parent.find('.input-percent');
            let $help_block = $parent.find('.help-block');
            let $input_amount = $parent.find('.input-amount');
            let $input_total = $parent.find('.input-total');
            let $active_cbx = $parent.find('.active .icheckbox_square-green');
    
            let active = !$active_cbx.hasClass('checked');
            let count = 0;
            if (!$this.hasClass('active-buy-again')){
                if (!active){
                    count--;
                }
                else{
                    count++;
                }
            }
            disableBuyagain(count);
            disableRow($input_price, $input_percent, $help_block, $input_amount, $input_total, active);
        })
        $('.save-change').on('click', function(){
            let symbol = ($('.input-label .symbol').val() == '') ? 'ADABTC' : $('.input-label .symbol').val().split('/').join('');
            let main = (symbol.substr(symbol.length-4, symbol.length) == 'USDT' ? 'USDT' : symbol.substr(symbol.length-3, symbol.length));
            let valid = true;
            if (action == 'edit'){
                symbol = symbol_edit;
            }
            let data = {
                'symbol': symbol,
                'main' : main,
                'data': $('.z-form-input').serialize(),
                'type' : action
            };
            if (action == 'edit'){
                data['order_id'] = order_id;
            }
            $('.active .icheckbox_square-green.checked').each((i, e)=>{
                let $this = $(e);
                let $parent = $this.closest('.form-group');
                let $input_amount = $parent.find('.input-amount');
                let $input_total = $parent.find('.input-total');
                let amount = parseFloat($input_amount.val());
                let total = parseFloat($input_total.val());
                if (amount <= 0){
                    valid = false;
                    show_notification('Amount must greater than 0!', 'Warning', 'error');
                    return false;
                }
                if (total < 0.0012){
                    valid = false;
                    show_notification('BTC minimum to buy/sell is 0.0012!', 'Warning', 'error');
                    return false;
                }
            })
            if (valid){
                client_send_send(`check-file-status`, {type: action, data:data, view: area_action});
            }
            // $('.save-change').attr('disabled', '');
            // $('.save-change').removeAttr('disabled');
        });
    
        if (first[area_action]){
            ipcRenderer.on(`check-file-status-return-${area_action}`, (event, data)=>{
                client_send_send('hand-trade-submit', data);
            });
        
            ipcRenderer.on(`hand-trade-submit-return-${area_action}`, (event, data)=>{
                console.log(data);
                if (data['status'] == 'success'){
                    show_notification('Update successfully!', 'Notification', 'success');
                }
                else{
                    show_notification(data['msg'], 'Notification', 'error');
                }
                $(`#button-${area}-index`).click();
            })
        }
    }
    
    function calc($input_price, $input_percent, $help_block, $input_amount, $input_total, $this){
        let price = parseFloat($input_price.val());
        let percent = parseFloat($input_percent.val());
        let amount = parseFloat($input_amount.val());
        let total = parseFloat($input_total.val());
    
        let price_percent = decimalNumber(parseFloat(price + price * percent / 100), 8);
        let total_val = decimalNumber(parseFloat(price_percent * amount), 8);
        let amount_val = decimalNumber(parseFloat(total / price_percent), 2);
    
        let name_attr = $this.attr('name');
        let tmp_arr = name_attr.split('-');
        // check if $this is input-price to do calculate for price
        if ($this.hasClass('input-price') || $this.hasClass('input-percent')){
            $help_block.html(price_percent + ' BTC');
            $input_total.val(total_val);
            if ($this.hasClass('input-price')){
                change[tmp_arr[0]] = true;
            }
        }
        else if ($this.hasClass('input-amount')){
            $input_total.val(total_val);
        }
        else{
            $input_amount.val(amount_val);
        }
    }
    
    function loadApi(){
        client_send_send(`read-file`, {type: 'api', path: './public/themes/electron/assets/data/user_api_config/user_api.txt', view: area_action})
        if (first[area_action]){
            ipcRenderer.on(`read-file-return-${area_action}`, (event, data)=>{
                let type = data['type'];
                let dt = JSON.parse(data['data']);
                data_reader[type] = dt;
                switch(type){
                    case 'api':{
                        let accountData = {};
                        Object.keys(dt).map((k, i)=>{
                            let v = dt[k];
                            if (v['status'] == 'active'){
                                let acc_name = v['acc_name'];
                                accountData[k] = acc_name; 
                            }
                        })
                        if (Object.keys(dt).length == 0 || Object.keys(accountData).length == 0){
                            accountData['empty'] = "Empty Account!!!";
                            $('.get-info').removeClass('btn-primary get-info').addClass('btn-danger add-api').text('Create New Api');
                        }
        
                        let account = 
                        `${
                                Object.keys(accountData).map((e, i)=>{
                                    return `<option value="${e}">${accountData[e]}</option>`;
                                })
                        }`;
                        $('.account').html(account);
                        break;
                    }
                }
            })
        }
    }
    
    function editable(){
        if (action == "edit"){
            let status = data_reader['order']['status'];
            let $active_buy = $('.active.active-buy');
            if (status == 'selling'){
                if ($active_buy.find('.icheckbox_square-green').hasClass('checked')){
                    $active_buy.closest('.form-group').find('.input-price, .input-percent, .input-amount, .input-total').each(function(){
                        let $this = $(this);
                        $this.prop('disabled', true).attr('disabled', '');
                    });
                    $active_buy.find('.icheckbox_square-green').addClass('disabled');
                }
            }
            else if (status == 'buying-again'){
                $('.active.i-checks').map((i, e)=>{
                    if (!$(e).hasClass('active-buy-again')){
                        $parent = $(e).closest('.form-group');
                        $parent.find('.input-price').attr('disabled', '');
                        $parent.find('.input-amount').attr('disabled', '');
                        $parent.find('.input-percent').attr('disabled', '');
                        $parent.find('.input-total').attr('disabled', '');
                        $parent.find('.input-total').attr('disabled', '');
                        $parent.find('.icheckbox_square-green').addClass('disabled');
                        $parent.find('.icheckbox_square-green input').attr('disabled', '');
                        $parent.find('.icheckbox_square-green input').prop('disabled', true);
                    }
                });
            }
        }
    }
    
    function disableBuyagain(count=0){
        $('.active.i-checks').map((i, e)=>{
            if (!$(e).hasClass('active-buy-again')){
                if ($(e).find('.icheckbox_square-green').hasClass('checked')){
                    count++;
                }
            }
        });
        console.log(count);
        if (count == 0){
            $('.active-buy-again').closest('.form-group').addClass('hidden');
            $('.save-change').attr('disabled', '');
        }
        else{
            $('.active-buy-again').closest('.form-group').removeClass('hidden');
            $('.save-change').removeAttr('disabled');
        }
    }
    
    function activeAllRow(){
        let $active = $('.active .icheckbox_square-green');
        let $active_cbx = $active.find('input');
        $active.map((i, e)=>{
            let $this = $(e);
            let $parent = $this.closest('.form-group');
            let $input_price = $parent.find('.input-price');
            let $input_percent = $parent.find('.input-percent');
            let $help_block = $parent.find('.help-block');
            let $input_amount = $parent.find('.input-amount');
            let $input_total = $parent.find('.input-total');
            let active = $this.hasClass('checked');
            if (active){
                $input_price.removeAttr('disabled');
                $input_percent.removeAttr('disabled');
                $input_amount.removeAttr('disabled');
                $input_total.removeAttr('disabled');
            }
            else{
                $input_price.attr('disabled', '');
                $input_percent.attr('disabled', '');
                $input_amount.attr('disabled', '');
                $input_total.attr('disabled', '');
            }
        });
    }
    
    function disableRow($input_price, $input_percent, $help_block, $input_amount, $input_total, active = true){
        if (active){
            $input_price.removeAttr('disabled');
            $input_percent.removeAttr('disabled');
            $input_amount.removeAttr('disabled');
            $input_total.removeAttr('disabled');
        }
        else{
            $input_price.attr('disabled', '');
            $input_percent.attr('disabled', '');
            $input_amount.attr('disabled', '');
            $input_total.attr('disabled', '');
        }
    }
    
    function disableAllRow(active = true){
        let $input_price = $('.input-price');
        let $input_percent = $('.input-percent');
        let $input_amount = $('.input-amount');
        let $input_total = $('.input-total');
        let $active = $('.active .icheckbox_square-green');
        let $active_cbx = $active.find('input');
        let $btn_save = $('.save-change');
    
        if (active){
            $('.error').html('').addClass('m-t-15');
            activeAllRow();
            $active_cbx.prop('disabled',false);
            $active_cbx.removeClass('disabled');
            $active.removeClass('disabled');
    
            $btn_save.removeAttr('disabled');
        }
        else{
            let msg = 'Click get info first to enable hand trade!';
            if (action == "edit"){
                msg = 'Please wait to get Info wallet!';
            }
            $('.error').html(msg).removeClass('m-t-15');
    
            $input_price.attr('disabled', '');
            $input_percent.attr('disabled', '');
            $input_amount.attr('disabled', '');
            $input_total.attr('disabled', '');
            $active_cbx.prop('disabled', true);
            $active_cbx.attr('disabled', '');
            $active.addClass('disabled');
            $btn_save.attr('disabled', '');
        }
    }
    
    function decimalNumber(number, dec, type = 'round') {
        return (type == 'floor') ? Math.floor(parseFloat(number) * Math.pow(10, dec)) / Math.pow(10, dec) :
            (type == 'ceil') ? Math.ceil(parseFloat(number) * Math.pow(10, dec)) / Math.pow(10, dec) :
                Math.round(parseFloat(number) * Math.pow(10, dec)) / Math.pow(10, dec);
    }
    
    function getBalance(cb = null){
        if (typeof cb == 'function'){
            ipcRenderer.on(`get-balance-return-${area_action}`, cb);
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
                            case "symbol":
                                var time = $origin.data('time');
                                var target_down = $origin.data('target_down');
                                var target_di = $origin.data('target_di');
                                var target_price = $origin.data('target_price');
                                var target_stock = $origin.data('target_stock');
                                instance.content(`
                                                    <p>Watch time: ${time}</p>
                                                    <p>Target down lb: ${target_down}</p>
                                                    <p>Target DI: ${target_di}</p>
                                                    <p>Target stock: ${target_stock}</p>
                                                    <p>Target price: ${target_price}</p>
                                                `);
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
    
    function readTextFile()
    {
        let path = "<?php echo $option['readFilePath']?>";
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", path, true);
        rawFile.onreadystatechange = function ()
        {
            if(rawFile.readyState === 4)
            {
                if(rawFile.status === 200 || rawFile.status == 0)
                {
                    var allText = rawFile.responseText;
                }
            }
        }
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
    
    
    // on click button cancel
    function getInfoClick() {
        $('.get-info').on('click', function(){
            let $this = $(this);
            if ($this.hasClass('add-api')){
                $('#button-account-api-index').click();
            }
            else{
                $this.attr('disabled', '');
            
                client_send_send('get-balance', {"_id": $('select[name="user_key_id"]').val(), view: area_action});
                client_send_send('server-send-price', {view: area_action});
                setTimeout(()=>{
                    $this.removeAttr('disabled');
                }, 5000);
            }
        });
        if (first[area_action]){
            getInfo();
        }
    }
    
    function getSymbolList(){
        client_send_send('send_symbol_list', {});
        ipcRenderer.on('send_symbol_list_return', (event, data)=>{
            console.log(data);
            $('.symbol').typeahead({
                source: data['data'],
                autoSelect: true
            });
        })
    }
    
    function getInfo(){
        let count = 0;
        getBalance((event, balance)=>{
            if (balance['status'] == 'error'){
                show_notification('Please input valid Account API!', "Notification", 'error');
            }
            else{
                let input_symbol = $('.symbol').val().split('/').join('');
                if (input_symbol == ''){
                    input_symbol = 'ADABTC';
                }
                let sub_symbol = (input_symbol == 'ADABTC') ? 'ADA' : $('.symbol').val().split('/')[0];
                if (balance['data'][sub_symbol]){
                    let coin_avai = balance['data'][sub_symbol]['available'];
                    let btc_avai = balance['data']['BTC']['available'];       
                    if (balance['status'] == 'success'){
                        $('.coin-qty').html(coin_avai);
                        $('.balance').html(btc_avai);    
                        client_send_send('server-send-price', {view: area_action});
                        show_notification('Get Info Successfully',"Notification");
                        disableAllRow(true);
                    }
                    else{
                        show_notification('Invalid Balance',"Notification", 'error');
                        disableAllRow(false);
                    }         
                }
                else{
                    show_notification('Invalid Symbol Or Invalid Balance',"Notification", 'error');
                }
            }
        });
        get_price((event, data)=>{
            let input_symbol = $('.symbol').val().split('/').join('');
            if (input_symbol == ''){
                input_symbol = 'ADABTC';
            }
            console.log(data);
            Object.keys(data['data']).some((e, i)=>{
                let item = data['data'][e];
                let price = item.a;
                if (e == input_symbol){
                    console.log(input_symbol, data['data'][e]);
                    $('.current-price').html(price + ' BTC');
                    let $buy_price = $('.buy-price');
    
                    let $sell_price = $('.sell-price');
    
                    let $stoploss_price = $('.stoploss-price');
    
                    let $buy_again_price = $('.buy-again-price');
                    if (action == 'add'){
                        $buy_price.val(price);
                        $sell_price.val(price);
                        $stoploss_price.val(price);
                        $buy_again_price.val(price);
                    }
                }
            });
        });
    }
    
    //client sent send
    function client_send_send(key = '', data = {}) {
        ipcRenderer.send(key, data);
    }
    
    function dataTable() {
        if (first_load){
            tableObj = $('.dataTables-example').DataTable({
                retrive:true,
                dom: '<"html5buttons"B>lTfgitp',
                buttons: [],
                "iDisplayLength": -1,
                orderFixed: [[11, 'desc']],
                order: [[1, 'asc'],[0, 'desc'],[10, 'desc']],
                rowGroup: {
                    dataSrc: 1
                },
                lengthMenu: [[-1,15,30,50], ["All","15","30","50"]],
            });
        }
        else{
            tableObj.destroy();
            tableObj = $('.dataTables-example').DataTable({
                destroy:true,
                dom: '<"html5buttons"B>lTfgitp',
                buttons: [],
                "iDisplayLength": -1,
                orderFixed: [[11, 'desc']],
                order: [[1, 'asc'],[0, 'desc'],[10, 'desc']],
                rowGroup: {
                    dataSrc: 1
                },
                lengthMenu: [[-1,15,30,50], ["All","15","30","50"]],
            });
        }
    }
});