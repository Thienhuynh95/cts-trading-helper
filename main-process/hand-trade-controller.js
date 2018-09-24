let {ipcMain, app} = require('electron')
var fs = require('fs');
let robot = require('./../class/Robot');
let system = require('./../config/system')
let Robot = new robot();
let path = require('path')

let PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
let db = new PouchDB('db', {auto_compaction: true});
db.createIndex({
    index: {fields: ['id', 'collection']},
});

async function abc(){
    let dt = await db.find({
        selector: {collection: {$eq: 'history'}, id: {$eq : 1}},
        sort: [{id: 'desc'}]
    })
    // dt = await db.getIndexes();
    console.log(dt['docs']);
}
// abc();

ipcMain.on('hand-trade-edit', (event, data) => {
    let file_path = path.join(system['define']['root_path'], `${system['define']['release_path']}/public/themes/electron/assets/data/user_hand_trading/u_100001.txt`);
    let dt = Robot.readFileSync(file_path);
    let view = data['view'];
    let symbol = data['symbol'];
    let order_id = data['order_id'];
    let main_coin = symbol.substr(symbol.length - 4, symbol.length) == 'USDT' ? 'USDT' : symbol.substr(symbol.length - 3, symbol.length);
    
    try {
        dt = JSON.parse(dt);
        event.sender.send(`hand-trade-edit-return-${view}`, {status: 'success', data: JSON.stringify(dt[main_coin][symbol][order_id])})
    } catch (error) {
        event.sender.send(`hand-trade-edit-return-${view}`, {status: 'error', msg: 'Data is invalid!'})
    }
    
});

ipcMain.on('hand-trade-submit', (event, dt) => {
    let sent_view = dt['view'];

    let data = dt['data'];
    let type = data['type'];
    let main = data['main'];
    let symbol = data['symbol'];
    let error = false;
    let write = false;
    let k_arr = [];
    let index = 0;
    let order_id = data['order_id'] ? data['order_id'] : '';
    let text = "";
    let price = "";
    if (type != 'add'){
        order_id = data['order_id'];
        text = data['text'];
        price = data['price'];
    }
    let data_post = data
    if (type == 'add' || type == 'edit'){
        data_post = JSON.parse('{"' + data['data'].replace(/&/g, '","').replace(/=/g,'":"').replace(/\+/g, ' ') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
    }

    // event.sender.send('hand-trade-submit-return', {status: 'error', msg: dt});
    
    if (error){
        event.sender.send(`hand-trade-submit-return-${sent_view}`, {status: 'error', msg: k_arr})
    }
    else{
        try{
            let file_path = path.join(system['define']['root_path'], `${system['define']['release_path']}/public/themes/electron/assets/data/user_hand_trading/u_100001.txt`);
            let data_tmp = {};
            let randomString = Robot.randomString(8);
            let msg = '';
            if (type == 'add'){
                order_id = 'o_'+randomString;
            }
            if (fs.existsSync(file_path)) {
                let data_file = Robot.readFileSync(file_path);
                let unique = false;
                data_tmp = JSON.parse(data_file);

                let status = (type != 'add') ? data_tmp[main][symbol][order_id]['status'] : '';

                if (type == 'add' || type == 'edit'){
                    // đổi mới nếu orderid trùng
                    if (type == 'add'){
                        while(!unique){
                            randomString = Robot.randomString(8);
                            order_id = 'o_'+randomString;
                            if (!Robot.testPropertyChain(`${main}.${symbol}.${order_id}`, data_tmp)){
                                unique = true;
                            }
                        }
                    }
                    actArr = ['buy', 'sell', 'stoploss', 'buy-again'];
                    // kiểm tra nếu đang selling mà buy có active, thì disable buy đi
                    if (status == 'selling'){
                        if (data_post['active-buy']){
                            actArr.slice(0, 1);
                        }
                    }
                    // kiểm tra nếu đang buying-again mà sell có active, thì disable toàn bộ đi
                    else if (status == 'buying-again'){
                        if (data_post['active-sell']){
                            actArr.slice(0, 3);
                        }
                    }
                    for (k in actArr){
                        let v = actArr[k];
                        if(!data_post['active-' + v] && action == 'add'){
                            if (status == 'buying' && v == 'buy'){
                                status = 'selling';
                                if (Robot.testPropertyChain(`${main}.${symbol}.${order_id}.${v}`, data_tmp) && action == 'add'){
                                    delete data_tmp[main][symbol][order_id][v];
                                }
                            }
                        }
                        else if (data_post['active-' + v]){
                            console.log(data_post);
                            Robot.addPropertyChain(`${main}.${symbol}.${order_id}.${v}.price`, data_post[v + '-price'], data_tmp);
                            Robot.addPropertyChain(`${main}.${symbol}.${order_id}.${v}.percent`, data_post[v + '-percent'], data_tmp);
                            Robot.addPropertyChain(`${main}.${symbol}.${order_id}.${v}.amount`, data_post[v + '-amount'], data_tmp);
                            Robot.addPropertyChain(`${main}.${symbol}.${order_id}.${v}.total`, data_post[v + '-total'], data_tmp);
                            // nếu status = buying-again thì không cho sửa check
                            
                            if (v == 'buy-again' && status != 'buying-again' && status != ''){
                                data_tmp[main][symbol][order_id][v]['active-'+v] = (data_tmp[main][symbol][order_id][v]['active-'+v] ? data_tmp[main][symbol][order_id][v]['active-'+v] : false);
                            }

                        }
                    }
                    data_tmp[main][symbol][order_id]['trade_test'] = data_post['trade_test'] == '' ? 'active' : 'inactive';
                    data_tmp[main][symbol][order_id]['user_key_id'] = data_post['user_key_id'];
                    data_tmp[main][symbol][order_id]['trade_type'] = 'hand_trade';
                    data_tmp[main][symbol][order_id]['status'] = (status != '') ? status :
                        (Robot.testPropertyChain(`${main}.${symbol}.${order_id}.buy`, data_tmp) ? 'buying' : 'selling');
                    
                    if (type == 'add'){
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.user_id`, "u_100001", data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.symbol`, symbol, data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.buy_log`, [], data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.sell_log`, [], data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.sell_time`, 0, data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.buy_time`, 0, data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.trade_alg_info.sell_instant`, 0, data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.order_id`, {}, data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.createAt`, Date.now(), data_tmp);
                    }
                    write = true;
                }
                else if (type == 'update') {
                    current_status = data_tmp[main][symbol][order_id]["status"];
                    if (text == 'start') {
                        //user_trading
                        current_status = current_status.split('_')[1];
                        data_tmp[main][symbol][order_id]["status"] = current_status;
                        msg = `Pause successfully!`;
                        write = true;

                    } else if (text == 'pause') {
                        //user_trading

                        data_tmp[main][symbol][order_id]["status"] = `pause_${current_status}`;
                        msg = `Start successfully!`;
                        write = true;

                    }
                }
                else if (type == 'sell' || type == 'restore'){
                    price = data_post['price'] ? data_post['price'] : 0;
                    if (type == 'sell'){
                        data_tmp[main][symbol][order_id]["trade_alg_info"]['sell_instant'] = price;
                        msg = `Selling with price "${price}"`;
                    }
                    else{
                        data_tmp[main][symbol][order_id]["trade_alg_info"]['sell_instant'] = 0;
                        msg = `Restored`;
                    }
                    write = true;
                }
                else {
                    data_post = data_tmp[main][symbol][order_id];
                    if (data_post['buy_log'] && data_post['buy_log'].length > 0 || data_post['buy_log'] && data_post['sell_log'].length > 0){
                        let db_add = async (data_post)=>{
                            let order = await db.find({
                                selector: {collection: {$eq: 'history'}, id: {$gt : null}},
                                sort: [{id: 'desc'}],
                                limit: 1
                            });
                            let latest_id = (Object.keys(order['docs']).length > 0) ? order['docs'][0]['id'] : null;
                            // Object.keys(order).some((k, i)=>{
                            //     console.log(k);
                            //     console.log(order[k]);
                            // });
                            data_post['_id'] = Robot.randomString(12);
                            data_post['collection'] = "history";
                            data_post['user_id'] = "u_100001";
                            data_post['status'] = "cancel";
                            data_post['id'] = latest_id ? latest_id + 1 : 1;
                            data_post['cancel_time'] = Date.now();
                            db.put(data_post);

                        }
                        db_add(data_post);    
                    }
                    //user_trading
                    if (Robot.testPropertyChain(`${main}.${symbol}.${order_id}`, data_tmp)){
                        delete data_tmp[main][symbol][order_id];
                    }
                    

                    write = true;
                    msg = 'Cancel Successfully!';
                }
            }
            else{
                actArr = ['buy', 'sell', 'stoploss', 'buy-again'];
                for (k in actArr){
                    let v = actArr[k];
                    if(!data_post['active-' + v]){
                        if (Robot.testPropertyChain(`${main}.${symbol}.${order_id}.${v}`, data_tmp)){
                            delete data_tmp[main][symbol][order_id][v];
                        }
                    }
                    else{
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.${v}.price`, data_post[v + '-price'], data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.${v}.percent`, data_post[v + '-percent'], data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.${v}.amount`, data_post[v + '-amount'], data_tmp);
                        Robot.addPropertyChain(`${main}.${symbol}.${order_id}.${v}.total`, data_post[v + '-total'], data_tmp);
                        // nếu status = buying-again thì không cho sửa check
                        if (v == 'buy-again' && status != 'buying-again' && status != ''){
                            data_tmp[main][symbol][order_id][v]['active-'.v] = (data_tmp[main][symbol][order_id][v]['active-'.v] ? data_tmp[main][symbol][order_id][v]['active-'.v] : false);
                        }

                    }
                    
                    delete data_post[v + '-price'];
                    delete data_post[v + '-percent']; 
                    delete data_post[v + '-amount']; 
                    delete data_post[v + '-total']; 
                    delete data_post['active-' + v];
                }
                data_tmp[main][symbol][order_id]['trade_test'] = data_post['trade_test'] ? 'active' : 'inactive';
                data_tmp[main][symbol][order_id]['user_key_id'] = data_post['user_key_id'];
                data_tmp[main][symbol][order_id]['trade_type'] = 'hand_trade';
                data_tmp[main][symbol][order_id]['status'] = (status != '') ? status :
                    (Robot.testPropertyChain(`${main}.${symbol}.${order_id}.buy`, data_tmp) ? 'buying' : 'selling');
                
                Robot.addPropertyChain(`${main}.${symbol}.${order_id}.user_id`, 100001, data_tmp);
                Robot.addPropertyChain(`${main}.${symbol}.${order_id}.buy_log`, [], data_tmp);
                Robot.addPropertyChain(`${main}.${symbol}.${order_id}.sell_log`, [], data_tmp);
                Robot.addPropertyChain(`${main}.${symbol}.${order_id}.trade_alg_info.sell_instant`, 0, data_tmp);
                Robot.addPropertyChain(`${main}.${symbol}.${order_id}.order_id`, {}, data_tmp);
                Robot.addPropertyChain(`${main}.${symbol}.${order_id}.createAt`, Date.now(), data_tmp);
                msg = 'Add Successfully!';

                write = true;
            }
            if (write){
                Robot.writeFileSync(file_path, JSON.stringify(data_tmp), { flag: 'w' });
                event.sender.send(`hand-trade-submit-return-${sent_view}`, {'status' :"success", "msg" : msg, type: type})
            }
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
    }
})