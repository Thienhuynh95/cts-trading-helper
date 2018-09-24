let {ipcRenderer} = require('electron');

$(function(){
    load();
    init_action();

    function load(){
        ipcRenderer.send('get_app_notify', {});
        // $('#update').click(()=>{
        //     autoUpdater.checkForUpdates();
        // })
    }
    
    function init_action(){
        ipcRenderer.on('get_app_notify_return', (event, data)=>{
            let dt = JSON.parse(data);
            let data_info = dt['data'];
            if (dt['status'] == 'success'){
                let app_info = data_info['app_information']['data'];
                let app_notify = data_info['app_notify']['data'];
                let app_setting = data_info['app_setting']['data'];
    
                // load app info
                let $information_area = $('.information-area');
                let $table = $information_area.find('tbody');
                let info_html = '';
                app_info.map((e, i)=>{
                    let title = e['title'];
                    let content = e['content'];
                    info_html += 
                    `<tr>
                        <td class="text-12 text-left color-white">${title}</td>
                        <td class="text-12 text-left"><span class="color-white">:</span> <span class="text-yellow">${content}</span></td>
                    </tr>`;
                })
                $table.html(info_html);
    
                // load app notify
                let $noti_div = $('.about-sections .notification');
                let noti_html = '';
                app_notify.map((e, i)=>{
                    let title = e['title'];
                    let content = e['content'];
                    console.log(title);
                    noti_html += 
                    `${title != 'No' ? `<h4 class="text-left">${title}</h4>` : ''}<p>
                        ${content}
                    </p>${(i < app_notify.length - 1) ? `<div class="hr-line m-btm-30"></div>` : ''}`;
                })
                $noti_div.html(noti_html);
    
                setTimeout(()=>{
                    $('#get-started').removeClass('hidden');
                }, parseInt(app_setting['dashboard_wait']) * 1000);
            }
        });
    }
})
