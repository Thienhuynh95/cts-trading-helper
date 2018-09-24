let {ipcMain} = require('electron')
const date = require('date-and-time');
const func = require("./../class/func");
var robot = require("./../class/Robot");
var Robot = new robot();
//client socket.io
var io_client = require("socket.io-client");
var socket_client = io_client.connect("http://bot01.laptrinhaz.com:6972", {
    reconnection: true
});

socket_client_init();

function socket_client_init(){
    let data_loaded = {};
    let first = {};

    socket_client.emit('get_app_notify', {});
    socket_client.on('get_app_notify_return', (data)=>{
        first['notify'] = first['notify'] ? first['notify'] : true;
        data_loaded['notify'] = JSON.stringify(data);
        if (first['notify']){
            send_notify(data_loaded['notify']);
            first['notify'] = false;
        }
    })

    socket_client.emit('get_candle_data', {name: 'candle'});
    socket_client.on('get_candle_data_return', (data)=>{
        first['candle'] = first['candle'] ? first['candle'] : true;
        data_loaded['candle'] = JSON.stringify(data);
        if (first['candle']){
            send_candle(data_loaded['candle']);
            first['candle'] = false;
        }
    })
}
function send_notify(data_loaded){

    ipcMain.on('get_app_notify', (event, data)=>{
        event.sender.send('get_app_notify_return', data_loaded);
    })
}

function send_candle(data_loaded){

    ipcMain.on('get_candle', (event, data)=>{
        event.sender.send('get_candle_return', data_loaded);
    })
}