try{
const {ipcRenderer} = require('electron');
const func = require('./../../../class/func');
first[area_action] = (first[area_action] != undefined) ? first[area_action] : true;

$(document).ready(function () {

    checkAll();
    init();
    loadInfo();
    if (first[area_action]){
        init_action();
    }
    first[area_action] = false;

    function init(){

        $('.filter-option input[type="radio"]').on('click',  function(){
            let $this = $(this);
            $('.input-symbol input, .date-filter input').attr('disabled','');
            if ($this.val() == 'all_time'){
                $('.date-filter input').removeAttr('disabled');
            }
            if ($this.val() == 'single_time'){
                $('.input-symbol input, .date-filter input').removeAttr('disabled');
            }
        })
        $('.filter-btn').on('click', function(){
            ipcRenderer.send('history-trade-analyze', {view: area_action, data: $('#filter-form').serialize()})
        })
        $('.delete').on('click', function(){
            let $this = $(this);
            ipcRenderer.send('history-trade-delete', {view: area_action, data: $('#table-form').serializeArray()})
        });
        $('input.datepicker').daterangepicker(
        {
            'timePicker': true,
            'timePicker24Hour': true,
            'timePickerSeconds': true,
            'timePickerIncrement': 1,
            'locale': {
                'format': 'MM/DD/YYYY HH:mm:ss',
                'cancelLabel': 'Clear'
            }
        }).val('');
    }
    
    function init_action(){
        ipcRenderer.on(`history-trade-get-return-${area_action}`, (event, dt)=>{
            let data = dt['data'];
            console.log(data);
            $('.table-block').html(loadTable(data));
            dataTable();
        })
    
        ipcRenderer.on(`history-trade-analyze-return-${area_action}`, (event, dt)=>{
            dt = $.parseJSON(dt);
            $('.result').html('');
            Object.keys(dt).some(function(e) {
                $('.result').append(filterBlock(dt[e]));
            })
            
            ipcRenderer.send('history-trade-get', {view: area_action, type: 'analyze', data: $('#filter-form').serialize()});
        })
    
        ipcRenderer.on(`history-trade-delete-return-${area_action}`, (event, dt)=>{
            show_notification('Delete successfully!', 'Notification', 'success');
            ipcRenderer.send('history-trade-get', {view: area_action});
        })
    }
    
    function loadTable(data){
        let history = data['history'];
        let user_key = JSON.parse(data['account']);
        let total_plus = 0;
        let total_minus = 0;
        let html = 
        `<table class="table table-striped table-bordered table-hover dataTables-example">
            <thead>
                <tr>
                    <th class="text-center sorting_disabled" rowspan="1" colspan="1" aria-label="  "
                        style="width: 25px;">
                        <input type="checkbox" name="checkAll" id="checkAll">
                    </th>
                    <th class="text-center">#</th>
                    <th class="text-center">Coin</th>
                    <th class="text-center">Type</th>
                    <th class="text-center">Account</th>
                    <th class="text-center">Budget Buy</th>
                    <th class="text-center">Amount</th>
                    <th class="text-center">Price Buy</th>
                    <th class="text-center">Price Sell</th>
                    <th class="text-center">Time Buy</th>
                    <th class="text-center">Time Sell</th>
                    <th class="text-center">status</th>
                    <th class="text-center">Profit</th>
                    <th class="text-center">%</th>
                </tr>
            </thead>
            <tbody>
            <!-- TR TABLE - START -->
            ${
                Object.keys(history).map((k, i)=>{
                    let row_tmp = '';
                    let item = history[k];
                    let id = (item['id']) ? item['id'] : '';
                    let symbol = (item['symbol']) ? item['symbol'] : '';
                    let account = (user_key[item['user_key_id']]) ? user_key[item['user_key_id']]['acc_name'] : '';
    
                    let buy_budget = (item['budget_buy']) ? item['budget_buy'] : '';
                    let amount = (item['buy_amount']) ? item['buy_amount'] : '';
                    let status = (item['status']) ? item['status'] : '';
                    let trade_type = (item['trade_test'] && item['trade_test'] == 'inactive') ? 'Real' : 'Test';
    
                    let buy_log = (item['buy_log']) ? item['buy_log'] : [];
                    let sell_log = (item['sell_log']) ? item['sell_log'] : [];
                    let type = 'hand_trade';
    
                    // log config
                    let actArr = ['buy', 'sell', 'buy-again', 'sell'];
                    let buylog_count = Object.keys(buy_log).length;
                    let selllog_count = Object.keys(sell_log).length;
                    if (item['cancel_time']){
                        actArr = ['cancel'];
                    }
                    let type_selling = (item['trade_alg_info'] && item['trade_alg_info']['type_sell']) ? item['trade_alg_info']['type_sell'] : [];
                    let sell_instant = (item['trade_alg_info'] && item['trade_alg_info']['sell_instant']) ? item['trade_alg_info']['sell_instant'] : 0;
                    let ind_buy = 0;
                    let ind_sell = 0;
                    let index = 1;
                    let index_tmp = ++i;
                    let log = '';
                    let buy_timestamp = sell_timestamp = '';
                    let last_act = '';
                    let actMove = '';
                    let class_profit = '';
                    let buy_price_dis = sell_price_dis = buy_time = sell_time = '__';
                    let type_sell = '';
                    for ( key in actArr ){
                        let v = actArr[key];
                        let profit = 0;
                        let selling_type = '';
                        let done = false;
                        if (v != 'sell'){
                            if (ind_buy < buylog_count){
                                if (item[v]){
                                    buy_price = parseFloat(item[v]['price']);
                                    buy_percent = parseFloat(item[v]['percent']);
                                    buy_price_dis = parseFloat(buy_log[ind_buy]['price']);
                                    name = v.replace('-', ' ');
                                    buy_time = func.show_time_utc(parseInt(buy_log[ind_buy]['time']) * 1000);
                                    buy_timestamp = buy_log[buylog_count-1]['time'];
                                    actMove += v + ' ';
                                    last_act = v;
                                    if (!(item['sell']) && !(item['stoploss'])){
                                        done = true;
                                        amount = buy_log[ind_buy]['amount'];
                                        buy_timestamp = buy_log[buylog_count-1]['time'];
                                    }
                                    buy_budget = item[v]['total'];
                                    ind_buy++;
                                }
                            }
                        }
                        else{
                            if (ind_sell < selllog_count){
                                if ((item[v])){
                                    selling_type = ' / ' + (sell_instant != 0 ? 'sell_instant' : type_selling[ind_sell]);
                                    sell_price_dis = parseFloat(sell_log[ind_sell]['price']);
                                    sell_time = func.show_time_utc(parseInt(sell_log[ind_sell]['time']) * 1000);
                                    sell_timestamp = sell_log[selllog_count-1]['time'];
                                    actMove += v + ' ';
                                    last_act = v;
                                    if (!(item['buy'])){
                                        sell_timestamp = sell_log[selllog_count-1]['time'];
                                    }
                                    amount = sell_log[ind_sell]['amount'];
                                    if (item['buy'] || item['buy-again']){
                                        done = true;
                                    }
                                    ind_sell++;
                                    profit = (buy_price_dis == '__' || sell_price_dis == '__') ? 0 : parseFloat((sell_price_dis - buy_price_dis) / buy_price_dis * 100).toFixed(2);
                                    class_profit = parseFloat(profit) > 0 ? "text-info" : "text-danger";
    
                                    if (parseFloat(profit) > 0) {
                                        total_plus += parseFloat(profit);
                                    } else if (parseFloat(profit) < 0){
                                        total_minus += parseFloat(profit);
                                    }
                                }
                            }
                        }
                        if (v == 'cancel'){
                            done = true;
                            amount = (item['buy']) ? item['buy']['amount'] : ((item['sell']) ? item['sell']['amount'] : item['stoploss']['amount']);
                            buy_budget = (item['buy']) ? item['buy']['total'] : ((item['sell']) ? item['sell']['total'] : item['stoploss']['total']);
                            buy_timestamp = item['cancel_time'];
                            sell_timestamp = item['cancel_time'];
                        }
                        
                        if (done){
                            row_tmp += `<tr>
                                <td class="check_multi text-center">
                                    ${index == 1 ? `<input type="checkbox" name='delete[${id}]'>` : ''}
                                </td>
                                <td class=" text-center">${index_tmp}-${index++}</td>
                                <td>${symbol}</td>
                                <td>${trade_type}${type == 'hand_trade' ? '_hand' : ''}</td>
                                <td class="account">${account}</td>
                                <td class="budget text-right">${buy_budget}</td>
                                <td class="amount text-right">${amount}</td>
                                <td class="buy_price text-right">${isNaN(parseFloat(buy_price_dis)) ? buy_price_dis : parseFloat(buy_price_dis).toFixed(8)}</td>
                                <td class="sell_price text-right">${isNaN(parseFloat(sell_price_dis)) ? sell_price_dis : parseFloat(sell_price_dis).toFixed(8)}</td>
                                <td class="buy_time text-right"><span class="hidden">${buy_timestamp ? buy_timestamp : ''}</span>${buy_time}</td>
                                <td class="sell_time text-right"><span class="hidden">${sell_timestamp ? sell_timestamp : (buy_timestamp ? buy_timestamp : '')}</span>${sell_time}</td>
                                <td class="status text-right"><span
                                            class="badge bg-${status != 'finish' ? 'danger' : 'info'}">${status}${selling_type}</span></td>
                                <td class="profit text-right ${class_profit}">
                                    <b>${profit}</b>
                                </td>
                                <td class="text-right">
                                    <b class="text-danger">${total_minus}</b> /
                                    <b class="text-info">${total_plus}</b>
                                </td>
                            </tr>`;
                        }
                    }
                    return row_tmp;
                }).join('')
            }
            </tbody>
        </table>`;
        return html;
    }
    
    function loadInfo(){
        ipcRenderer.send('history-trade-get', {view: area_action})
    }
    
    function html(literalSections, ...substs) {
        // Use raw literal sections: we don’t want
        // backslashes (\n etc.) to be interpreted
        let raw = literalSections.raw;
    
        let result = '';
    
        substs.forEach((subst, i) => {
            // Retrieve the literal section preceding
            // the current substitution
            let lit = raw[i];
    
            // In the example, map() returns an array:
            // If substitution is an array (and not a string),
            // we turn it into a string
            if (Array.isArray(subst)) {
                subst = subst.join('');
            }
    
            // If the substitution is preceded by a dollar sign,
            // we escape special characters in it
            if (lit.endsWith('$')) {
                subst = htmlEscape(subst);
                lit = lit.slice(0, -1);
            }
            result += lit;
            result += subst;
        });
        // Take care of last literal section
        // (Never fails, because an empty template string
        // produces one literal section, an empty string)
        result += raw[raw.length-1]; // (A)
    
        return result;
    }
    
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    function checkAll(){
        $('body').on('click' ,'#checkAll', function () {
            var numberOfChecked = $('.check_multi input').length;
            $('.check_multi input:checkbox').prop('checked', this.checked);
        });
    }
    
    function filterBlock(data){
        console.log(data);
        let detail = parseFloat(Math.round(data.data * 1000) / 1000).toFixed(3);
        let name = capitalizeFirstLetter(data.name);
        let text_class= (detail > 0) ? 'color-light-blue' : ((detail < 0) ? 'color-danger' : '');
        return html`
            <div class="dis-inblock p-lr-5 p-tb-5 m-l-15 text-left text-14" style="border: 2px solid darkgray !important;">
                <span class="detail dis-inblock">${name}: <span class="data text-w600 ${text_class}">${detail}%</span></span>
            </div>
        `;
    }
    
    //call datatable onload
    function dataTable() {
        $('.dataTables-example').DataTable({
            destroy:true,
            dom: '<"html5buttons"B>lTfgitp',
            buttons: [],
            responsive: true,
            autoWidth: false,
            scrollX: true,
            "iDisplayLength": -1,
            orderFixed: [[8, 'desc']],
            order: [[1, 'asc'],[0, 'desc'],[8, 'desc']],
            lengthMenu: [[-1,15,30,50], ["All","15","30","50"]],
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
});
}
catch(err){
    console.log(err);
}