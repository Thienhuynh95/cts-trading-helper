let {ipcMain, dialog} = require('electron')
const binance = require('node-binance-api');
const date = require('date-and-time');
const func = require("./../class/func");
const os = require("os");
const fs = require("fs");
const path = require('path')
var robot = require("./../class/Robot");
let system = require('./../config/system')
var Robot = new robot();

var trade = require('./robot_trade_hand/main');


let path_save_api = path.join(system['define']['root_path'], system['define']['release_path'], 'public/themes/electron/assets/data/user_api_config/user_api.txt');

let hasError = false;
let sec_to_reset = 6;
let current_sec = func.get_date().secondsUTC;
let current_mili = func.get_date().millisecondsUTC;
console.log(func.func_get_time_UTC());
let time_reset = sec_to_reset - (current_sec - Math.floor(current_sec / 10) * 10) + (1000 - current_mili);

main_action();
function main_action(){
    var obj_data = {};
    var api_data = {};
    obj_data['price'] = {};
    obj_data['symbol'] = [];
    obj_data['updating'] = false;

    start_bot(api_data, obj_data);

    ipcMain.on('send_symbol_list', (event, data)=>{
        event.sender.send('send_symbol_list_return', {status: 'success', data: obj_data['symbol']});
    });

    ipcMain.on('check-file-status', (event, data)=>{
        let type = data['type'];
        let dt = data['data'];
        let view = data['view'];
        console.log('here ========> ', obj_data['updating']);
    
        if (!obj_data['updating']){
            event.sender.send(`check-file-status-return-${view}`, {"updating": obj_data['updating'], type: type, data: dt, view: view});
        }
        else{
            let loop_check = (updating)=>{
                if (!updating){
                    console.log('here ========> ', updating);
                    event.sender.send(`check-file-status-return-${view}`, {"updating": obj_data['updating'], type: type, data: dt, view: view});
                }
                else{
                    setTimeout(()=>{
                        loop_check(updating);
                    }, 500);
                }
            };
            loop_check(obj_data['updating']);
        }
    });

    ipcMain.on('server-send-price', (event, data)=>{
        let view = data['view'];
        event.sender.send(`server-send-price-return-${view}`, {status: 'success', data: obj_data['price']});
    });

    ipcMain.on('check-api', (event, data) => {
        let view = data['view'];
        binance.options({
            APIKEY: data['api'],
            APISECRET: data['sec'],
            useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
            test: true // If you want to use sandbox mode where orders are simulated
        });
        binance.balance((error, balances) => {
            let path_api = path_save_api;
            if (data['type'] == 'add'){
                event.sender.send(`check-api-return-${view}`, {'status': 'error','msg':'Save API first then "Check API"!'});
            }
            if (!error){
                Robot.readFile(path_api).then((dt)=>{
                    if (dt != ''){
                        dt = JSON.parse(dt);
                        dt[data['_id']]['api_check'] = true;
                        api_data[data['_id']] = dt[data['_id']];
                        delete dt['api_balance'];
                        dt = JSON.stringify(dt);
                        Robot.writeFile(path_api, dt);
                    }
                });
                let msg = {'status': 'success','msg':'Valid API'};
                event.sender.send(`check-api-return-${view}`, msg);
            }
            else{
                Robot.readFile(path_api).then((dt)=>{
                    if (dt != ''){
                        dt = JSON.parse(dt);
                        dt[data['_id']]['api_check'] = false;
                        api_data[data['_id']] = dt[data['_id']];
                        delete dt['api_balance'];
                        dt = JSON.stringify(api_data);
                        Robot.writeFile(path_api, dt);
                    }
                });
                event.sender.send(`check-api-return-${view}`, {'status': 'error','msg':'Invalid API'});
            }
        });
    });
}

function start_bot(api_data, obj_data){
    try{
        Robot.readFile(path_save_api).then((data)=>{
            api_data = JSON.parse(data);

            robo_run(api_data, sec_to_reset, obj_data, hasError);
        });
    }
    catch(err){
        let options = {
            type: 'info',
            title: 'Renderer Process Crashed',
            message: err + '',
            buttons: ['Close']
        }
        dialog.showMessageBox(options, (index) => {})
    }
    
}


function robo_run(api_data,sec_to_reset, obj_data, hasError){
    if (!hasError) {
        try{
            Robot.getAllBalanceBinance(api_data).then(() => {

                binance.bookTickers(async (error, ticker) => {
                    if (error) {
                        let time_error = date.format(new Date(), 'YYYY/MM/DD HH:mm:ss UTC+7');
                        console.log(error);
                        console.log(error['body']);
                        let new_error = /502 Bad Gateway/.exec(error);
                        let error_ENOTFOUND = /ENOTFOUND/.exec(error);
                        let error_REFUSED = /ECONNREFUSED/.exec(error);
                        let error_RESET = /ECONNRESET/.exec(error);
                        let error_ERR_TLS_CERT_ALTNAME_INVALID = /ERR_TLS_CERT_ALTNAME_INVALID/.exec(error);
                        if (!new_error && !error_ENOTFOUND && !error_REFUSED && !error_RESET && !error_ERR_TLS_CERT_ALTNAME_INVALID) {
                            hasError = true;
                        }
                        
                        await robo_run(api_data, sec_to_reset, obj_data, hasError);
                        console.log(time_error);
                    }
                    else if (!error) {
                        let list_symbol = ['BTC'];
                        let index = 0;
                        obj_data['price'] = {};
                        obj_data['symbol'] = [];
                        obj_data['updating'] = true;

                        ticker.some((e, i)=>{
                            let symbol = e['symbol'];
                            let askPrice = e['askPrice'];
                            let bidPrice = e['bidPrice'];
                            let main_symbol = (symbol.substr(symbol.length - 4, symbol.length) == 'USDT' ? 'USDT' : symbol.substr(symbol.length - 3, symbol.length));
                            let core_symbol = (main_symbol == 'BTC' ? symbol.substr(0, symbol.length - 3) : symbol.substr(0, symbol.length - 4))
                            let isBTC = list_symbol.includes(main_symbol);
                            if (isBTC){
                                Robot.addPropertyChain(`price.${symbol}`, {a: askPrice, b: bidPrice}, obj_data);
                                if (parseFloat(askPrice) != 0){
                                    
                                    obj_data['symbol'][index] = [core_symbol, main_symbol].join('/');
                                    index++;
                                }
                            }
                            
                        });

                        console.log(func.func_get_time_UTC());
                        //robot rn
                        await trade.run(ticker, api_data['api_balance'], obj_data);
                        obj_data['updating'] = false;
                        setTimeout(() => {
                            robo_run(api_data, sec_to_reset, obj_data, hasError);        
                        }, sec_to_reset * 1000);
                    }
                });
            });
        }
        catch(err){
            let options = {
                type: 'info',
                title: 'Renderer Process Crashed',
                message: err + '',
                buttons: ['Close']
            }
            dialog.showMessageBox(options, (index) => {})
        }
    }
}

