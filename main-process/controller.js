let {ipcMain, dialog, app} = require('electron')
let robot = require('./../class/Robot');
let system = require('./../config/system')
let Robot = new robot();
let binance = require('node-binance-api');
let api_data = {};
let updating = false;
let first_status = true;
let path = require('path')


ipcMain.on('read-file', (event, data) => {
    let file_path = path.join(system['define']['root_path'], system['define']['release_path'], data['path']);
    let type = data['type'];
    let view = data['view'];
    try{
        let dt = Robot.readFileSync(file_path);
        if (dt == ''){
            dt = '{}';
            console.log(JSON.parse(dt));
        }
        event.sender.send(`read-file-return-${view}`, {status: 'success', data: dt, type: type, view: view})
    }
    catch(err){
        let options = {
            type: 'info',
            title: 'Renderer Process Crashed',
            message: err+' '+system['define']['release_path'],
            buttons: ['Close']
        }
        dialog.showMessageBox(options, (index) => {})
    }
});

ipcMain.on('change-property', (event, data) => {
    let file_path = path.join(system['define']['root_path'], system['define']['release_path'], data['path']);
    let property = data['property'];
    let key_path = data['key_path'];
    let view = data['view'];
    let msg = 'Successfully change!';
    try{
        let dt = Robot.readFileSync(file_path);
        dt = JSON.parse(dt);
        if (!changeProperty(key_path, property, dt)){
            msg = "Key path is invalid!";
            event.sender.send(`change-property-return-${view}`, {status: 'error', msg: msg})
        }
        else{
            
            Robot.writeFile(file_path, JSON.stringify(dt), null, (err)=>{
                if (err){
                    console.log(err);
                }
    
                event.sender.send(`change-property-return-${view}`, {status: 'success', msg: msg})
            });
        }
    }
    catch(err){
        let options = {
            type: 'info',
            title: 'Renderer Process Crashed',
            message: err+' '+file_path,
            buttons: ['Close']
        }
        dialog.showMessageBox(options, (index) => {})
    }

    function changeProperty(chain, val, obj) {
        var propChain = chain.split(".");
        if (propChain.length === 1) {
            Object.keys(val).map((k)=>{
                obj[propChain[0]][k] = val[k];
            })
            return true;
        }
        var first = propChain.shift();
        if (!obj[first]) {
            return false;
        }
        this.changeProperty(propChain.join("."), val, obj[first]);
    }
});


ipcMain.on('delete-property', (event, data) => {
    let file_path = path.join(system['define']['root_path'], system['define']['release_path'], data['path']);
    let key_path = data['key_path'];
    let view = data['view'];
    let dt = Robot.readFileSync(file_path);
    let msg = 'Successfully change!';
    dt = JSON.parse(dt);
    if (!deleteProperty(key_path, dt)){
        msg = "Key path is invalid!";
        event.sender.send(`delete-property-return-${view}`, {status: 'error', msg: msg})
    }
    else{
        Robot.writeFile(file_path, JSON.stringify(dt), null, (err)=>{
            if (err){
                console.log(err);
            }
            event.sender.send(`delete-property-return-${view}`, {status: 'success', msg: msg})
        });
    }

    function deleteProperty(chain, obj) {
        var propChain = chain.split(".");
        if (propChain.length === 1) {
            delete dt[propChain];
            return true;
        }
        var first = propChain.shift();
        if (!obj[first]) {
            return false;
        }
        this.deleteProperty(propChain.join("."), obj[first]);
    }
});

// get balance
ipcMain.on('get-balance', (event, data)=>{
    let path_save_api = path.join(system['define']['root_path'], system['define']['release_path'], 'public/themes/electron/assets/data/user_api_config/user_api.txt');
    Robot.readFile(path_save_api).then((file_api)=>{
        if (file_api != ''){
            console.log(file_api);
            file_api = JSON.parse(file_api);
            let first = true;
            let key_id = data['_id'];
            let view = data['view'];
            api = file_api[key_id]['key'];
            sec = file_api[key_id]['secret'];
            binance.options({
                APIKEY: api,
                APISECRET: sec,
                useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
                test: true // If you want to use sandbox mode where orders are simulated
            });
            if (first){
                first = false;
                binance.balance((error, balances) => {
                    if (!error){
                        let msg = {'status': 'success','msg':'Valid API', 'data': balances};
                        event.sender.send(`get-balance-return-${view}`, msg);
                    }
                    else{
                        event.sender.send(`get-balance-return-${view}`, {'status': 'error','msg':'Invalid API (You can only trade test with this)'});
                    }
                });
            }
        }
    });
})