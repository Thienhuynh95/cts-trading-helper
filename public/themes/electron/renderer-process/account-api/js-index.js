
var account_api = 2;
var countAll = 0;
var first_load = true;
var tableObj = {};
const {ipcRenderer} = require('electron');
const helper = require('./renderer-process/partial/helper');
console.log(first[area_action]);
first[area_action] = (first[area_action] != undefined) ? first[area_action] : true;

console.log('load load');
$(document).ready(function () {
    load_table();
    //tool tip
    tooltip('.tooltip-view', "value");
    checkAll();
    console.log(first[area_action]);
    deleteAction();
    if (first[area_action]){
        changeProp();
        init_action();
    }
    first[area_action] = false;

    
    function init_action(){
        ipcRenderer.on(`read-file-return-${area_action}`, (event, data)=>{
            let html = '';
            if (data['type'] == 'api'){
                let dt = JSON.parse(data['data']);
                if (Object.keys(dt).length > 0){
                    Object.keys(dt).some((e, i)=>{
                        let api_item = dt[e];
                        let status = api_item['status'];
                        let btc_using = api_item['btc_using'] ? api_item['btc_using'] : 0;
                        let eth_using = api_item['eth_using'] ? api_item['eth_using'] : 0;
                        let bnb_using = api_item['bnb_using'] ? api_item['bnb_using'] : 0;
                        let usdt_using = api_item['usdt_using'] ? api_item['usdt_using'] : 0;
                        html += `
                        <tr data-id="${e}">
                            <td><input type="checkbox" name="cb[]" class="cbx" value="${e}"></td>
                            <td>${api_item['acc_name']}</td>
                            <td>
                                <span class="tooltip-view" data-value="${api_item['key']}">${(api_item['key'].length > 10 ?  (api_item['key'].substring(0, 10) + ' ...') : api_item['key'])}</span>
                            </td>
                            <td class="center">
                            <span class="tooltip-view" data-value="${api_item['secret']}">${(api_item['secret'].length > 10 ?  (api_item['secret'].substring(0, 10) + ' ...') : api_item['secret'])}</span>
                            </td>
                            <td class="center">${api_item['exchange']}</td>
                            <td class="center status">${api_item['status'].capitalize()}</td>
                            <td class="center">
                                <div class="icon-status">
                                    <a title="Edit" data-key-id="${e}" id="button-${area}-edit" data-section="${area}-edit" class="nav-button btn btn-success edit btn-circle status-action info inline ver-top" type="button">
                                        <i class="fa fa-pencil inline ver-top"></i>
                                    </a>
                                    <div class="dis-inblock status-button">
                                    ${
                                        (status != 'trash') ? `${status == 'active' ? helper['status_html'](e, 'inactive') : helper['status_html'](e, 'active')}` : ''
                                    }
                                    </div>
                                    <div class="dis-inblock trash-button">
                                        ${status == 'trash' ? (helper['status_html'](e, 'delete') + ' ' +  helper['status_html'](e, 'restore')) : helper['status_html'](e, 'trash')}
                                    </div>
                                </div>
                            </td>
                            <td class="center">${i+1}</td>
                        </tr>
                        `;
                    })
                }
                $('.dataTables-example tbody').html(html);
                dataTable();
                first_load = false;
            }
        })
        
        ipcRenderer.on(`change-property-return-${area_action}`, (event, data)=>{
            let status = data['status'];
            let msg = data['msg'];
            
            console.log(data['event']);
            if (status == 'success'){
                show_notification(msg, "Notification");
            }
            else{
                show_notification(msg, "Warning", 'error');
            }
        
        })
    } 

    function deleteAction(){
        $('.delete').on('click', function(e){
            e.preventDefault();
            let $this = $(this);
            let path = './public/themes/electron/assets/data/user_api_config/user_api.txt';
            let key_id = $this.data('key-id');
            let key_path = `${key_id}`;
            ipcRenderer.send("delete-property", {path: path, key_path: `${key_path}`});
            $this.closest('tr').remove();
            $('#button-account-api-index').click();
            show_notification("Delete successfully!","Notification","error");
        })
    }

    //load list api index
    function load_table(){
        ipcRenderer.send("read-file", {'type': 'api',path: './public/themes/electron/assets/data/user_api_config/user_api.txt', view: area_action});
    }

    function changeProp(){
        $('body').on('click', '.change-status', function(){
            let $this = $(this);
            let status = $this.data('status');
            let path = './public/themes/electron/assets/data/user_api_config/user_api.txt';
            let key_id = $this.data('key-id');
            let key_path = `${$this.data('key-id')}`;
            let statusTmp = ['active', 'inactive'];
            let $status_button = $this.closest('.icon-status').find('.status-button');
            let $trash_button = $this.closest('.icon-status').find('.trash-button');
            let $status = $this.closest('tr').find('.status');
            if (statusTmp.includes(status) && $this.closest('.status-button').length > 0){
                $status_button.html(`${status == 'active' ? helper['status_html'](key_id, 'inactive') : helper['status_html'](key_id, 'active')}`);
            }
            else{
                if (status == 'trash'){
                    $status_button.empty();
                }
                else{
                    $status_button.html(`${helper['status_html'](key_id, 'inactive')}`);
                }
                $trash_button.closest('.trash-button').html(`${status == 'trash' ? (helper['status_html'](key_id, 'delete') + ' ' +  helper['status_html'](key_id, 'restore')) : helper['status_html'](key_id, 'trash')}`)
                .find('.status-action').attr('disabled','');
                deleteAction();
            }
            $status.html(status.capitalize());
            $('.status-button').find('.status-action').attr('disabled', '');
            $('.trash-button').find('.status-action').attr('disabled', '');
            setTimeout(()=>{
                $('.status-button').find('.status-action').removeAttr('disabled');
                $('.trash-button').find('.status-action').removeAttr('disabled');
            }, 1000);
            ipcRenderer.send("change-property", {path: path, property: {'status': status}, key_path: `${key_path}`, view: area_action});
        })
    }

    function checkAll(){
        $('body').on('change', 'input[type="checkbox"]', function(){
            let $this = $(this);
            if ($this.hasClass('cbAll')){
                if ($('.cbAll:checked').length > 0){
                    $('input[type="checkbox"]').prop('checked', true);
                }
                else{
                    $('input[type="checkbox"]').prop('checked', false);
                }
            }
            else{
                $('.cbAll').prop('checked', false);
                if ($('input[type="checkbox"]:checked').length == $('input[type="checkbox"]').length - 1){
                    $('.cbAll').prop('checked', true);
                }
            }
        })
    }

    function dataTable() {
        $('.dataTables-example').DataTable({
            dom: '<"html5buttons"B>lTfgitp',
            buttons: [],
            "iDisplayLength": -1,
            "order": [[5, "desc"]],
            lengthMenu: [[-1,15,30,50], ["All","15","30","50"]],
            "columnDefs": [ {
                "targets": 0,
                "orderable": false
            } ]
        });
    }

    //show_notification
    function show_notification(text_1 = '', text_2 = '', type = '') {
        setTimeout(function () {
            toastr.options = {
                closeButton: true,
                progressBar: true,
                showMetdod: 'slideDown',
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


    //tooltip
    function tooltip($class, type) {
        $('body').on('mouseenter', $class, function () {
            console.log('abc');
            if (!$(this).hasClass('tooltipstered')) {
                $(this).tooltipster({
                    contentAsHTML: true,
                    functionInit: function (instance, helper) {

                        var $origin = $(helper.origin);
                        switch (type) {
                            case "value":
                                var value = $origin.data('value');
                                instance.content(`<p>${value}</p>`);
                                break;
                        }
                    }
                }).tooltipster('show');
            }
        });
    }

    String.prototype.capitalize = function() {
        return this.trim().charAt(0).toUpperCase() + this.slice(1);
    }
});
