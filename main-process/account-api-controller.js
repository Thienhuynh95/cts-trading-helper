let {ipcMain, app} = require('electron')
var fs = require('fs');
let robot = require('./../class/Robot');
let system = require('./../config/system')
let Robot = new robot();
const path = require('path')

let binance = require('node-binance-api');
let account_api_id = '';
let first_submit = true;

ipcMain.on('account-api-edit', (event, data) => {
    let path_api = path.join(system['define']['root_path'], system['define']['release_path'], 'public/themes/electron/assets/data/user_api_config/user_api.txt');
    let dt = Robot.readFileSync(path_api);
    dt = JSON.parse(dt);
    dt = JSON.stringify(dt);
    event.sender.send('account-api-edit-return', {status: 'success', data: dt})
});

ipcMain.on('account-api-submit', (event, data_post) => {
    let sent_view = data_post['view'];

    let data = data_post['data'];
    let type = data_post['type'];
    let error = false;
    let k_arr = [];
    let index = 0;
    let user_key_id = '';
    if (type == 'edit'){
        user_key_id = data_post['user_key_id'];
    }
    let dt = JSON.parse('{"' + data.replace(/&/g, '","').replace(/=/g,'":"').replace(/\+/g, ' ') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
    Object.keys(dt).some((k, i)=>{
        let v = dt[k];
        if (v.trim() == ''){
            k_arr[index] = {key: k, msg: 'This field is required!'};
            error = true;
            index++;
        }
        // else if ( !isNaN(parseFloat(v)) && parseFloat(v) <= 0){
        //     k_arr[index] = {key: k, msg: 'This field must be number and more than 0!'};
        //     error = true;
        //     index++;
        // }
    });
    if (error){
        event.sender.send(`account-api-submit-return-${sent_view}`, {status: 'error', msg: k_arr})
    }
    else{
        console.log(user_key_id, data);
        let path_api = path.join(system['define']['root_path'], system['define']['release_path'], 'public/themes/electron/assets/data/user_api_config/user_api.txt');
        let data_tmp = {};
        let randomString = Robot.randomString(8);
        if (user_key_id == '' || type == 'add'){
            user_key_id = 'acc_'+randomString;
        }
        data_tmp[user_key_id] = data_tmp[user_key_id] ? data_tmp[user_key_id] : {};
        if (fs.existsSync(path_api)) {
            try{
                let data_file = Robot.readFileSync(path_api);
                data_tmp = JSON.parse(data_file);
                data_tmp[user_key_id] = data_tmp[user_key_id] ? data_tmp[user_key_id] : {};
                Object.keys(dt).map((k)=>{
                    let value = dt[k];
                    value = !isNaN(parseFloat(value)) ? parseFloat(value) : value;
                    data_tmp[user_key_id][k] = value;
                })
            }
            catch(err){
                data_tmp = {};
                data_tmp[user_key_id] = {};
                Object.keys(dt).map((k)=>{
                    let value = dt[k];
                    value = !isNaN(parseFloat(value)) ? parseFloat(value) : value;
                    data_tmp[user_key_id][k] = value;
                })
            }
        }
        else{
            data_tmp[`acc_${randomString}`] = data_tmp[`acc_${randomString}`] ? data_tmp[`acc_${randomString}`] : {};
            Object.keys(dt).map((k)=>{
                let value = dt[k];
                value = !isNaN(parseFloat(value)) ? parseFloat(value) : value;
                data_tmp[`acc_${randomString}`][k] = value;
            })
        }
        data_tmp[user_key_id]['user_id'] = 100001;
        data_tmp[user_key_id]['api_check'] = false;
        Robot.writeFile(path_api, JSON.stringify(data_tmp), { flag: 'w' });
        event.sender.send(`account-api-submit-return-${sent_view}`, {status: 'success', msg: `${type == 'add' ? "Add" : "Edit"} Successfully`})
    }
})