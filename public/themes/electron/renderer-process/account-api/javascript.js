

const {ipcRenderer} = require('electron');
first[area_action] = (first[area_action] != undefined) ? first[area_action] : true;

$(function(){
    // fix input type number can press 'e' character
    $('input[type="number"]').keypress(function(e) {
        if(e.keyCode == 101 || e.keyCode == 69)
        {
          return false;
        }
    });
    init();
    if (first[area_action]){
        init_action();
        first[area_action] = false;
    }
    loadEditData();

    function init_action(){
        ipcRenderer.on("account-api-edit-return", function(event, data){
            let dt = JSON.parse(data['data']);
            $('input').each(function(){
                $this = $(this);
                let name = $this.attr('name');
                if (dt[user_key_id][name]){
                    $this.val(dt[user_key_id][name]);
                }
            });
        });
        
        
        ipcRenderer.on(`check-api-return-${area_action}`, function(event, data){
            first_api = false;
            if (data['status'] == 'success'){
                show_notification(data['msg'], "Notification");
            }
            else{
                show_notification(data['msg'], "Warning", 'error');
            }
            first_api = true;
        });
        
        ipcRenderer.on(`account-api-submit-return-${area_action}`, function(event, data){
            let status = data['status'];
            let msg_data = data['msg'];
            $('.error').removeClass('dis-block');
            if (status == 'error'){
                msg_data.map((e, i)=>{
                    let key = e['key'];
                    let msg = e['msg'];
                    let $error = $(`.${key}-error`);
                    $error.html(msg).addClass('dis-block');
                })
                show_notification('Fail to create API', 'Error', 'error');
            }
            else{
                console.log($(`#button-${area}-index`));
                $(`#button-${area}-index`).click();
                show_notification(msg_data, 'Notification', 'success');
            }
        });
    }
    
    function loadEditData(){
        if (action == 'edit'){
            ipcRenderer.send("account-api-edit", {});
        }
    }
    
    function init(){
        $('.save-change').on('click', ()=> {
            let data = {type: action, data : $('form').serialize(), view: area_action};
            if (action == 'edit'){
                console.log(user_key_id);
                data['user_key_id'] = user_key_id;
            }
            console.log(data);
            ipcRenderer.send("account-api-submit", data);
        })
        $('.check-api').on('click',()=> {
            let api = $('input[name = "key"]').val();
            let secret = $('input[name = "secret"]').val();
            ipcRenderer.send("check-api", {"api": api, "sec" : secret, "_id": user_key_id, "user_id": 'u_100001', "type": action, view: area_action});
        });
    }
    
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
})
