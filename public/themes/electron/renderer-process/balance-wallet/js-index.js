
first[area_action] = (first[area_action] != undefined) ? first[area_action] : true;
const {ipcRenderer} = require('electron');
var data_reader = {};
var first_load = true;
var tableObj = {};

$(()=>{
    load();

    function load(){
        $('.i-checks').iCheck({
            checkboxClass: 'icheckbox_square-green',
            radioClass: 'iradio_square-green',
        });
        loadApi();
        init();
    }
    function init(){
        getBalanceClick();
        hideClick();
    }

    function hideClick(){
        $('.i-checks').on('ifChanged', function(){
            let $this = $(this);
    
            let $active_cbx = $this.closest('.icheckbox_square-green');
    
            let active = !$active_cbx.hasClass('checked');
            if (active){
                $('tbody tr').each(function(){
                    let $this = $(this);
                    let qty = parseFloat($this.data('avai'));
                    if (!isNaN(qty) && qty < 0.001){
                        $this.addClass('hidden');
                    }
                })
            }
            else{
                $('tbody tr').removeClass('hidden');
            }
        })
    }

    function getBalanceClick() {
        $('.get-balance').on('click', function(){
            let $this = $(this);
            if ($this.hasClass('add-api')){
                $('#button-account-api-index').click();
            }
            else{
                $this.attr('disabled', '');
            
                client_send_send('get-balance', {"_id": $('select[name="user_key_id"]').val(), view: area_action});
            }
        });
        if (first[area_action]){
            getBalance();
        }
    }

    function getBalance(){
        let first_balance = true;
        ipcRenderer.on(`get-balance-return-${area_action}`, (event, balance)=>{
            if (balance['status'] == 'error'){
                show_notification('Please input valid Account API!', "Notification", 'error');
            }
            else{
                if (balance['data']){
                    setTimeout(()=>{
                        $('.get-balance').removeAttr('disabled')
                    }, 2000);
                    if (balance['status'] == 'success'){
                        show_notification('Get Balance Successfully',"Notification");
                    }
                    else{
                        show_notification('Invalid Balance',"Notification", 'error');
                    }   
                    let html = `<table class="table table-striped table-bordered table-hover dataTables-example">
                        <thead>
                            <tr>
                                <th class="text-center">Symbol</th>
                                <th class="text-right">Available</th>
                                <th class="text-right">On order</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                Object.keys(balance['data']).map((k, i)=>{
                                    if (k != '123' && k != '456'){
                                        let coin_avai = balance['data'][k]['available'];
                                        let coin_onOrder = balance['data'][k]['onOrder'];     
                                        return `<tr data-avai="${coin_avai}">
                                            <td>${k}</td>
                                            <td class="text-right">${coin_avai}</td>
                                            <td class="text-right">${coin_onOrder}</td>                                            
                                        </tr>`;   

                                    } 
                                }).join('')
                            }
                        </tbody>
                    </table>`;    
                    $(`.table-block`).html(html);
                    $('.small-balance').removeClass('hidden');
                    dataTable();
                    first_load = false;
                }
                else{
                    show_notification('Invalid Symbol Or Invalid Balance',"Notification", 'error');
                }
            }
        });
    }

    function dataTable() {
        if (first_load){
            tableObj = $('.dataTables-example').DataTable({
                retrive:true,
                dom: '<"html5buttons"B>lTfgitp',
                buttons: [],
                "iDisplayLength": -1,
                orderFixed: [[1, 'desc']],
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
                orderFixed: [[1, 'desc']],
                lengthMenu: [[-1,15,30,50], ["All","15","30","50"]],
            });
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
                            let acc_name = v['acc_name'];
                            accountData[k] = acc_name; 
                        })
                        if (Object.keys(dt).length == 0){
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

    //client sent send
    function client_send_send(key = '', data = {}) {
        ipcRenderer.send(key, data);
    }
})