let {ipcMain} = require('electron')
var fs = require('fs');
let robot = require('./../class/Robot');
let Robot = new robot();
let first = {};

//client socket.io
var io_client = require("socket.io-client");
var socket_client = io_client.connect("http://bot01.laptrinhaz.com:6972", {
    reconnection: true
});

// load dashboard table
ipcMain.on('dashboard_table_load', (event, data) => {
    // only load 1 time
    first['candle'] = first['candle'] ? first['candle'] : true;
    
    // request get candle from server
    socket_client.emit('get_candle_data', {name: 'candle'});

    // get candle and filter table
    if (first['candle']){
        first['candle'] = false;
        socket_client.on('get_candle_data_return', (data)=>{
            let table_data = filterTable(data['data']);
            
            event.sender.send('dashboard_table_load_return', {status: 'success', data: table_data})
        })
    }
    // gen table html
    function filterTable(data){
        let candle_3m = data['candle_3m'];
        let candle_15m = data['candle_15m'];
        let candle_30m = data['candle_30m'];
        let candle_1h = data['candle_1h'];
        let candle_2h = data['candle_2h'];
        let candle_4h = data['candle_4h'];
        let candle_1d = data['candle_1d'];
        let candle_1w = data['candle_1w'];
        let candle_1M = data['candle_1M'];

        // obj_data
        let obj_data = {};
        obj_data['table_down'] = {};
        obj_data['table_up'] = {};

        Object.keys(candle_3m).map((k, i)=>{
            let isBTC = k.substr(k.length-3, k.length) == 'btc';
            if (candle_1d[k] && candle_30m[k] && candle_1h[k] && candle_4h[k] && candle_1w[k] && isBTC){
                let item_3m = candle_3m[k];
                let item_30m = candle_30m[k];
                let item_1h = candle_1h[k];
                let item_4h = candle_4h[k];
                let item_1d = candle_1d[k];
                let item_1w = candle_1w[k];
                // tmp data
                let tmp = {};
                tmp[k] = {};
                // today => close 3p - close 1d (%)
                tmp[k]['today'] = ( item_3m['close'] - item_1d['close'] ) / item_1d['close'] * 100;
                // vol24 => vol24 30p
                tmp[k]['vol_24h'] = item_30m['vol_24h'];
                // trade => hiển thị 1d ( 4h, 1h, 30p) 
                tmp[k]['trade_1d'] = item_1d['people_trades'];
                tmp[k]['trade_4h'] = item_4h['people_trades'];
                tmp[k]['trade_1h'] = item_1h['people_trades'];
                tmp[k]['trade_30m'] = item_30m['people_trades'];
                // yesterday => percent 1d
                tmp[k]['yesterday'] = item_1d['percent'];
                // this week => close 1w - close 3p
                tmp[k]['this_week'] = ( item_3m['close'] - item_1w['close'] ) / item_1w['close'] * 100;
                // pre week => percent 1w
                tmp[k]['pre_week'] = item_1w['percent'];
                if (tmp[k]['today'] > 0){
                    obj_data['table_up'][k] = tmp[k];
                }
                else{
                    
                    obj_data['table_down'][k] = tmp[k];
                }
            }
        });
        return obj_data;
    }
});