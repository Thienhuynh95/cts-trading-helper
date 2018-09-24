let {ipcMain, app} = require('electron')
var fs = require('fs');
let robot = require('./../class/Robot');
let system = require('./../config/system')
let Robot = new robot();
let path = require('path');


// pouch db init
let PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
let db = new PouchDB('db', {auto_compaction: true});
db.createIndex({
    index: {fields: ['id', 'collection']},
});
let Model = require('./../model/history-trade');
let history_model = new Model(db, PouchDB);

ipcMain.on('history-trade-edit', (event, data) => {
    let path_api = path.join(system['define']['root_path'], `${system['define']['release_path']}/public/themes/electron/assets/data/user_api_config/user_api.txt`);
    let dt = Robot.readFileSync(path_api);
    dt = JSON.parse(dt);
    dt = JSON.stringify(dt);
    event.sender.send('history-trade-edit-return', {status: 'success', data: dt})
});

ipcMain.on('history-trade-get', async (event, data_post) => {
    let type = data_post['type'];
    let sent_view = data_post['view'];
    
    let history = '';
    let account_api = '';
    let data = '';
    let path_api = path.join(system['define']['root_path'], `${system['define']['release_path']}/public/themes/electron/assets/data/user_api_config/user_api.txt`);
    account_api = Robot.readFileSync(path_api);
    
    switch(type){
        case 'analyze':{
            let params = data_post['data'];
            params = JSON.parse('{"' + params.replace(/&/g, '","').replace(/=/g,'":"').replace(/\+/g, ' ') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
            let symbol = ((params['symbol']) && !empty(params['symbol'])) ? params['symbol'] : 'ADA/BTC';
            let fromToDate = (params['fromToDate']) ? params['fromToDate'] : '';
            let date = fromToDate.split(/\-/);
            let fromDate = (date[0] && date[0] != '') ? Robot.getTimestamp(date[0].trim()) : '';
            let currentTime = (date[1] && date[1] != '') ? Robot.getTimestamp(date[1].trim()) : Date.now();
            let query = {
                'user_id' : 'u_100001'
            };
            if (fromToDate != ''){
                query['from'] = fromDate;
                query['to'] = currentTime;
            }
            if (params['symbol']){
                query['symbol']= symbol;
            }
            history = await history_model.find(query);
            data = {history: history, account: account_api};
            break;
        }
        default:{
            history = await history_model.getAll();
            data = {history: history, account: account_api};
            break;
        } 
    } 
    
    event.sender.send(`history-trade-get-return-${sent_view}`, {status: 'success', data: data});
})

ipcMain.on('history-trade-delete', async (event, data_post) => {
    let sent_view = data_post['view'];
    let data = '';
    let params = {};
    // {"foo e": ["a a",  "c",  "[x]":"b"]}
    // params = JSON.parse('{"' + params.replace(/&/g, '","').replace(/=/g,'":"').replace(/\+/g, ' ') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
    
    Object.keys(data_post['data']).map((k, i) => {
        let tmp = data_post['data'];
        let k_name = tmp[k]['name'];
        let v_name = tmp[k]['value'];
        let isDelete = /delete\[([0-9])*\]/.exec(k_name);
        if (isDelete){
            params['delete'] = params['delete'] ? params['delete'] : [];
            params['delete'].push(isDelete[1]);
        }
        else{
            params[k_name] = v_name;
        }
    })

    typeDelete = (params['typeDelete']) ? params['typeDelete']: '';
    deleteList = (params['delete']) ? params['delete']: '';;

    symbol = ((params['symbol']) && params['symbol'] != '') ? params['symbol'] : 'ADA/BTC';
    symbol = symbol.replace('/', '');

    filter = false;

    checkAll = (params['checkAll']) ? true : false;
    query = query_display = {'user_id' : 'u_100001'};
    if (typeDelete == 'multi'){
        query['id'] = query['id'] ? query['id'] : {};
        query['id']['$in'] = [];
        for (k in deleteList){
            let v = deleteList[k];
            query['id']['$in'].push(parseInt(v));
        }
    }
    switch(typeDelete){
        case 'multi':{
            history = await history_model.delete(query);
            break;
        }
        case 'all':{
            query['id'] = {$gt : null};
            history = await history_model.delete(query);
            break;
        } 
    } 

    event.sender.send(`history-trade-delete-return-${sent_view}`, {});
    
})

ipcMain.on('history-trade-analyze', async (event, data_post)=>{
    let type = data_post['type'];
    let sent_view = data_post['view'];
    let params = data_post['data'];
    params = JSON.parse('{"' + params.replace(/&/g, '","').replace(/=/g,'":"').replace(/\+/g, ' ') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });

    let symbol = ((params['symbol']) && !empty(params['symbol'])) ? params['symbol'] : 'ADA/BTC';
    let fromToDate = (params['fromToDate']) ? params['fromToDate'] : '';
    let date = fromToDate.split(/[\s+-\s+]/);
    let fromDate = (date[0] && date[0] != '')? Robot.getTimestamp([date[0], date[1]].join(' ')) : '';
    let currentTime = (date[1] && date[1] != '')? Robot.getTimestamp([date[4], date[5]].join(' ')) : Date.now();
    
    let query = {
        'user_id' : 'u_100001'
    };
    if (fromToDate != ''){
        query['from'] = fromDate;
        query['to'] = currentTime;
    }
    if (params['symbol']){
        query['symbol']= symbol;
    }
    data = await history_model.find(query);
    res = [];
    if (Object.keys(data).length > 0){
        profit = 0;
        for (k in data){
            let v = data[k];
            if (Object.keys(v['sell_log']).length > 1 && Object.keys(v['buy_log']).length > 1){
                Object.keys(v['buy_log']).map((k, i)=>{
                    sell_price = (v['sell_log'][k]) ? parseFloat(v['sell_log'][k]['price']) : '';
                    buy_price = (v['buy_log'][k]) ? parseFloat(v['buy_log'][k]['price']) : '';
                    if (sell_price != '' && buy_price != ''){
                        profit += parseFloat((sell_price - buy_price) / buy_price * 100);
                    }
                })
            }
        }
        res.push({
            'name' : 'profit',
            'data' : profit
        });
    }
    console.log(res);
    event.sender.send(`history-trade-analyze-return-${sent_view}`, JSON.stringify(res));
})
