let robot = require("./../../class/Robot");
let func = require("./../../class/func");
let system = require('./../../config/system')
let {dialog, Notification} = require('electron')

let path = require('path');
let Robot = new robot();
let PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
let db = new PouchDB('db', {auto_compaction: true});
db.createIndex({
    index: {fields: ['id', 'collection']},
});

var handTrade = module.exports = {};
let user_trade_config = {};
let trade_alg = {};
let user_apis = {};
let user_hand_trading = {};
let user_hand_trading_detail = {};
let current_update = false;
let data_change = {};
let amount_left_ask = {};
let amount_left_bid = {};

let tmpSaveList = {};
let first_load = true;
let countSell = {};
let alg_user = {};

handTrade.name = {};

handTrade.run = function(value, data, obj_data) {
    console.log('run handTrade');
    date = func.get_date();
    handTrade.name = 'handTrade';
    user_apis = data.user_apis;
    user_hand_trading = data.user_hand_trading;
    user_hand_trading_detail = data.user_hand_trading_detail;
    alg_user = {};


    data_change = false;
    // console.log(value);
//	console.log("= START =============================");
    // console.log(data);
//	console.log("= END =============================");

    Promise.resolve(new Promise(async resolve=>{
        for (let item=0; item<value.length; item++){
            let symbol = value[item]['symbol'];
            let main_coin = (symbol.substr(symbol.length-4, symbol.length) != 'USDT')? symbol.substr(symbol.length-3,symbol.length) : 'USDT';
            let price = value[item];
            let lower_symbol = symbol.toLowerCase();

            Promise.all([
                await handTrade.checkBuy(data, price, main_coin, symbol),
                await handTrade.checkSell(data, price, main_coin, symbol)
                // new Promise(resolve=>{
                //     //Kiểm tra điều kiện để stop-loss
                //     handTrade.checkStopLoss(data, price, main_coin, symbol, time_frame);
                //     resolve(1);
                // })
            ]);
        }
        resolve(1);
    })).then(()=>{
        console.log('==================');
        first_load= false;
        Object.keys(countSell).map((user)=>{
            console.log(`[${user}]`," current Selling: ", countSell);
        });
        countSell = {};
        if (data_change && !current_update){
            console.log('update');
            handTrade.update3File(data, obj_data);
            data_change = false;
        }
        else{
            obj_data['updating'] = false;
            console.log('update', obj_data['updating']);
        }
    });
}

//==========================================================
//Hàm kiểm tra xem có đủ điều kiện Buy hay không.
//return true|false
//==========================================================
handTrade.checkBuy = async function(data, price, main_coin, symbol){

    let askPrice = parseFloat(price['askPrice']);
    let lower_symbol = symbol.toLowerCase();
    
    if (user_hand_trading_detail[main_coin] != undefined){
        if (user_hand_trading_detail[main_coin][symbol] != undefined){
            if (user_hand_trading_detail[main_coin][symbol]['buying-again']){
                let user_list = user_hand_trading_detail[main_coin][symbol]['buying-again'];
                for(item in user_list){
                    let user = user_list[item];
                    for (order in user){
                        let trade_test_status = user[order]['trade_test'];
                        let type = (trade_test_status == 'inactive') ? '* REAL * ' : '';
                        
                        let user_key_id = user[order]['user_key_id'];
                        let buy_price = parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['buy-again']['price']);
                        let buy_percent = parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['buy-again']['percent']);
                        let buy_log = data.user_hand_trading[item][main_coin][symbol][order]['buy_log'];
                        let log_count = Object.keys(buy_log).length;

                        buy_price = buy_price + buy_price * buy_percent / 100;

                        if (!data.api_balance[user_key_id] && trade_test_status == 'inactive'){
                            // console.log(data);
                            console.log(item, user_key_id,'invalid API');
                            continue;
                        }

                        let symbol_single = symbol.split('BTC')[0];

                        // if (first_load && !time_end_frame){
                        //     break;
                        // }
                        
                        
                        // console.log(user_hand_trading_detail);

                        
                        if (trade_test_status == 'inactive'){
                            let btc = parseFloat(data.api_balance[user_key_id]['BTC']['available']);
                            let money = data.api_balance[user_key_id][symbol_single];   
                            console.log(`[${handTrade.name} ${symbol} ${item}] btc_left ${btc}`);                                 
                            if (btc <= 0.001){
                                continue;
                            }
                        }

                        console.log (`[${type}${handTrade.name} ${symbol} ${item}]`+symbol + ` askPrice: ${askPrice} buyPrice: ${buy_price}`);
                        if (askPrice <= buy_price){
                                    

                            console.log('buying: %s',symbol, askPrice, 'buy_price: '+ buy_price);
                            let test_state = (trade_test_status == 'active') ? true : false;
                            await handTrade.buy(data, price, main_coin, symbol, order, item, test_state);
                        }
                    }
                };
            }
            if (user_hand_trading_detail[main_coin][symbol]['buying']){
                let user_list = user_hand_trading_detail[main_coin][symbol]['buying'];
                for(item in user_list){
                    let user = user_list[item];
                    for (order in user){
                        let trade_test_status = user[order]['trade_test'];
                        let type = (trade_test_status == 'inactive') ? '* REAL * ' : '';
                        
                        let user_key_id = user[order]['user_key_id'];
                        let buy_price = parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['buy']['price']);
                        let buy_percent = parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['buy']['percent']);
                        let buy_log = data.user_hand_trading[item][main_coin][symbol][order]['buy_log'];
                        let log_count = Object.keys(buy_log).length;
                        buy_price = buy_price + buy_price * buy_percent / 100;

                        if (!data.api_balance[user_key_id] && trade_test_status == 'inactive'){
                            // console.log(data);
                            console.log(item, user_key_id,'invalid API');
                            continue;
                        }

                        let symbol_single = symbol.split('BTC')[0];

                        // if (first_load && !time_end_frame){
                        //     break;
                        // }
                        
                        
                        // console.log(user_hand_trading_detail);

                        
                        if (trade_test_status == 'inactive'){
                            let btc = parseFloat(data.api_balance[user_key_id]['BTC']['available']);
                            let money = data.api_balance[user_key_id][symbol_single];   
                            console.log(`[${handTrade.name} ${symbol} ${item}] btc_left ${btc}`);                                 
                            if (btc <= 0.001){
                                continue;
                            }
                        }

                        console.log (`[${type}${handTrade.name} ${symbol} ${item}]`+symbol + ` askPrice: ${askPrice} buyPrice: ${buy_price}`);
                        if (askPrice <= buy_price){

                            console.log('buying: %s',symbol, askPrice, 'buy_price: '+ buy_price);
                            let test_state = (trade_test_status == 'active') ? true : false;
                            await handTrade.buy(data, price, main_coin, symbol, order, item, test_state);
                        }
                    }
                };
            }
        }
    }
}


//==========================================================
//Hàm kiểm tra xem có đủ điều kiện Sell hay không.
//return true|false
//==========================================================
handTrade.checkSell = async function(data, price, main_coin, symbol){
    if (user_hand_trading_detail[main_coin] != undefined){
        if (user_hand_trading_detail[main_coin][symbol] != undefined){
            if (user_hand_trading_detail[main_coin][symbol]['selling'] != undefined){
                let user_list = user_hand_trading_detail[main_coin][symbol]['selling'];

                for(item in user_list){
                    let user = user_list[item];
                    for (order in user){
                        let user_order = user[order];
                        let trade_test_status = data.user_hand_trading[item][main_coin][symbol][order]['trade_test'];
                        let type = (trade_test_status == 'inactive') ? '* REAL * ' : '';
                        let sell_log = data.user_hand_trading[item][main_coin][symbol][order]['sell_log'];
                        let log_count = Object.keys(sell_log).length;
                        
                        if (trade_test_status == 'inactive'){
                            countSell[item] = countSell[item] ? countSell[item] : 0;
                            countSell[item]++;
                        }
                        let lower_symbol = symbol.toLowerCase();
                        let bidPrice = parseFloat(price['bidPrice']);
                        let symbol_single = symbol.split('BTC')[0];
                        let user_key_id = data.user_hand_trading[item][main_coin][symbol][order]['user_key_id'];
                        let sell_price = user[order]['sell'] ? parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['sell']['price']) + parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['sell']['price']) * parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['sell']['percent']) / 100 : false;
                        let stoploss_price = user[order]['stoploss'] ? parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['stoploss']['price']) + parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['stoploss']['price']) * parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['stoploss']['percent']) / 100 : false;
                        let sell_check = false;
                        let sell_instant = data.user_hand_trading[item][main_coin][symbol][order]['trade_alg_info']['sell_instant'] ? parseFloat(data.user_hand_trading[item][main_coin][symbol][order]['trade_alg_info']['sell_instant']) : 0;
                        let msg = '';
                        let type_selling = '';
                        // kt xem sell & stoploss co active hay khong
                        if (!sell_price && !stoploss_price){
                            
                            continue;
                        }
                        else{
                            if (sell_instant != 0){
                                console.log (`[${type}${handTrade.name} ${symbol} ${item}] ${symbol} sell: %s`, bidPrice, 'instant:'+ sell_instant);
                                if (bidPrice >= sell_instant){
                                    msg += `instant: ${sell_instant}`;
                                    sell_check = true;
                                }
                            }
                            else{
                                
                                if (sell_price && bidPrice >= sell_price){
                                    msg += `target: ${sell_price}`;
                                    type_selling = 'target';
                                    sell_check = true;
                                }
                                else if (stoploss_price && bidPrice <= stoploss_price){
                                    msg += `stoploss: ${stoploss_price}`;
                                    type_selling = 'stoploss';
                                    sell_check = true;
                                }
                                console.log (`[${type}${handTrade.name} ${symbol} ${item}] ${symbol} sell: %s`, bidPrice, 'target:'+sell_price, 'stoploss:'+stoploss_price);
                            }
                            
                            if (!sell_check){
                                continue;
                            }

                            if (trade_test_status == 'inactive' && data.api_balance[user_key_id]){
                                let btc = parseFloat(data.api_balance[user_key_id]['BTC']['available']);
                                let coin_ava = parseFloat(data.api_balance[user_key_id][symbol_single]['available']); 
                                let coin_onOrder = parseFloat(data.api_balance[user_key_id][symbol_single]['onOrder']);

                                console.log(`[${type}${handTrade.name} ${symbol} ${item}] coin_ava ${coin_ava}`);
                                
                                if (coin_ava < 1){
                                    continue;
                                }                                     
                            }

                            if (type_selling != ""){
                                if (!data.user_hand_trading[item][main_coin][symbol][order]['trade_alg_info']['type_sell']){
                                    data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order]['trade_alg_info']['type_sell'] 
                                    = data.user_hand_trading[item][main_coin][symbol][order]['trade_alg_info']['type_sell'] = [];
                                }
                                data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order]['trade_alg_info']['type_sell'][log_count] = type_selling;
                                data.user_hand_trading[item][main_coin][symbol][order]['trade_alg_info']['type_sell'][log_count] = type_selling;
                            }
                            
                            console.log(`[${handTrade.name} ${item}] ${symbol} selling: ${bidPrice} ${msg}`);
                            let test_state = (trade_test_status == 'active') ? true : false;
                            await handTrade.sell(data, price, main_coin, symbol, order, item, test_state);
                        }
                    }
                };
            }
        }
    }
}

//==========================================================
//Hàm Buy
//==========================================================
handTrade.buy = async function(data, price, main_coin, symbol, order_id, user_id, test_state = true){
	return new Promise(resolve=>{
        let askPrice = parseFloat(price['askPrice']);
		let item = user_id;
        let symbol_lower = main_coin.toLowerCase();
        
        let buy_log = data.user_hand_trading[item][main_coin][symbol][order_id]['buy_log'];
        let buy_amount = 0;
        let lower_symbol = symbol.toLowerCase();
        
        let user_key_id = data.user_hand_trading[item][main_coin][symbol][order_id]['user_key_id'];
        let apiKey = (test_state) ? 'testapi' : data.user_apis['list'][user_key_id]['key'];
        let apiSec = (test_state) ? 'testapi' : data.user_apis['list'][user_key_id]['secret'];

        let symbol_single = symbol.split('BTC')[0];
        // tinh toan so luong con lai de mua
        let amount_left = 0;
        let log_count = Object.keys(buy_log).length;
        let binance = require('node-binance-api');
        let status = data.user_hand_trading[item][main_coin][symbol][order_id]['status'];
        let left = 0;
        let sell_active = (data.user_hand_trading[item][main_coin][symbol][order_id]['sell'] || data.user_hand_trading[item][main_coin][symbol][order_id]['stoploss']) ? true : false;
        if (status == 'buying'){
            left = data.user_hand_trading[item][main_coin][symbol][order_id]['buy']['total'];
            amount_left = data.user_hand_trading[item][main_coin][symbol][order_id]['buy']['amount'];
        }
        else{
            left = data.user_hand_trading[item][main_coin][symbol][order_id]['buy-again']['total'];
            amount_left = data.user_hand_trading[item][main_coin][symbol][order_id]['buy-again']['amount'];
        }

        if (!test_state){
            let btc = parseFloat(data.api_balance[user_key_id]['BTC']['available']);
            let coin_ava = parseFloat(data.api_balance[user_key_id][symbol_single]['available']);
            let coin_onOrder = parseFloat(data.api_balance[user_key_id][symbol_single]['onOrder']);
            // tinh toan so luong con lai de mua
            // if (btc < left){
            //     console.log(`[${item}]`, symbol, 'not enought BTC');
            //     resolve(1);
            // }
            left = (btc < left) ? btc : left;
        }
        if (left <= 0 || amount_left <= 0){
            let trade_info = data.user_hand_trading[item][main_coin][symbol][order_id];
            trade_info['status'] = 'abort';
            trade_info['descript'] = 'Not enought BTC, cancel order!';
            let db_add = async (data_post)=>{
                let order = await db.find({
                    selector: {collection: {$eq: 'history'}, id: {$gt: null}},
                    sort: [{'id':  'desc'}],
                    limit: 1
                })['docs'];
                let latest_id = order[0]['id'];
                data_post['_id'] = Robot.randomString(12);
                data_post['collection'] = "history";
                data_post['user_id'] = "u_100001";
                data_post['id'] = latest_id ? latest_id + 1 : 1;
                data_post['cancel_time'] = Date.now();
                db.put(data_post);
            }
            db_add(trade_info);
            console.log(symbol, 'not enought BTC, reset');
            console.log('error buying test: ', symbol, amount_left, askPrice, err['body']);
            resolve(1);
            return;
        }

        data_change = true;
        alg_user[item] = 1;
        binance.options({
            APIKEY: apiKey,
            APISECRET:  apiSec,
            useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
            test: test_state // If you want to use sandbox mode where orders are simulated
        });
        // truong hop trade that
        binance.buy(symbol, amount_left, askPrice.toFixed(8), {type:'LIMIT'}, (err, res) => {
        // binance.bookTickers((err, ticker) => {
            if (err && !test_state){
                let trade_info = data.user_hand_trading[item][main_coin][symbol][order_id];
                trade_info['status'] = 'abort';
                trade_info['descript'] = 'Not enought BTC, cancel order!';
                let db_add = async (data_post)=>{
                    let order = await db.find({
                        selector: {collection: {$eq: 'history'}, id: {$gt : null}},
                        sort: [{id: 'desc'}],
                        limit: 1
                    });
                    let latest_id = (Object.keys(order['docs']).length > 0) ? order['docs'][0]['id'] : null;
                    data_post['_id'] = Robot.randomString(12);
                    data_post['collection'] = "history";
                    data_post['user_id'] = "u_100001";
                    data_post['id'] = latest_id ? latest_id + 1 : 1;
                    db.put(data_post);

                }
                db_add(trade_info);
                console.log(symbol, 'not enought BTC, reset');
                console.log('error buying test: ', symbol, amount_left, askPrice, err['body']);
                resolve(1);
                return;
            }
            else{
                console.log(res);
                let new_order_id = (test_state) ? 'o_' + order_id.split('_')[1] : 'o_'+res['orderId'];

                // update bien user_hand_trading_detail
                data.user_hand_trading_detail[main_coin][symbol][status][item][order_id]['status'] = (sell_active) ? 'selling' : 'finish';
                // data.user_hand_trading_detail[main_coin][symbol]['buying'][item]['buy_orderId'] = parseInt(res['orderId']);
                data.user_hand_trading_detail[main_coin][symbol][status][item][order_id]['order_id'] = new_order_id;
                data.user_hand_trading_detail[main_coin][symbol][status][item][order_id]['buy_time'] = parseInt(Date.now() / 1000);
                data.user_hand_trading_detail[main_coin][symbol][status][item][order_id]['buy_log'][log_count] =  {"price":askPrice, "amount": amount_left, "time": parseInt(Date.now() / 1000), "type": status};

                // update bien user_hand_trading
                data.user_hand_trading[item][main_coin][symbol][order_id]['status'] = (sell_active) ? 'selling' : 'finish';
                // data.user_hand_trading[item][main_coin][symbol]['buy_orderId'] = parseInt(res['orderId']);
                data.user_hand_trading[item][main_coin][symbol][order_id]['order_id'] = new_order_id;
                data.user_hand_trading[item][main_coin][symbol][order_id]['buy_time'] = parseInt(Date.now() / 1000);;
                data.user_hand_trading[item][main_coin][symbol][order_id]['buy_log'][log_count] =  {"price":askPrice, "amount": amount_left,"time": parseInt(Date.now() / 1000), "type": status};
                console.log(`[${handTrade.name} ${symbol} ${item}] buying for ${symbol} :%s`, askPrice, amount_left);

                if (!sell_active){
                    let trade_info = data.user_hand_trading[item][main_coin][symbol][order_id];
                    trade_info['status'] = 'finish';
                    trade_info['user_id'] = item.split('_')[1];
                    let db_add = async (data_post)=>{
                        let order = await db.find({
                            selector: {collection: {$eq: 'history'}, id: {$gt : null}},
                            sort: [{id: 'desc'}],
                            limit: 1
                        });
                        let latest_id = (Object.keys(order['docs']).length > 0) ? order['docs'][0]['id'] : null;
                        data_post['_id'] = Robot.randomString(12);
                        data_post['collection'] = "history";
                        data_post['user_id'] = "u_100001";
                        data_post['id'] = latest_id ? latest_id + 1 : 1;
                        db.put(data_post);

                    }
                    db_add(trade_info);
                    console.log('%s', symbol, ' buying done', askPrice, amount_left);
                    console.log('finish');
                    if (Object.keys(data.user_hand_trading[item][main_coin][symbol]).length > 1){
                        delete data.user_hand_trading[item][main_coin][symbol][order_id];
                        delete data.user_hand_trading_detail[main_coin][symbol]['buying'][item][order_id];
                    }
                    else{
                        delete data.user_hand_trading[item][main_coin][symbol];
                        delete data.user_hand_trading_detail[main_coin][symbol]['buying'][item];
                    }
                    resolve(1);
                    return;
                }
                else{
                    // chuyen status selling neu thoa dieu kien
                    Robot.addPropertyChain(`${main_coin}.${symbol}.${'selling'}.${item}.${order_id}`,
                        data.user_hand_trading_detail[main_coin][symbol][status][item][order_id],
                        data.user_hand_trading_detail);
                    delete data.user_hand_trading_detail[main_coin][symbol][status][item][order_id];
                    resolve(1);
                    return;
                }
            }
        });
    });
    //return something
}

//==========================================================
//Hàm Sell
//==========================================================
handTrade.sell = function(data, price, main_coin, symbol, order_id, user_id, test_state = true){

	return new Promise(resolve=>{
		let item = user_id;
		let bidPrice =parseFloat(price['bidPrice']);
        let symbol_lower = main_coin.toLowerCase();
        let sell_price = bidPrice;
		let user_key_id = data.user_hand_trading[item][main_coin][symbol][order_id]['user_key_id'];
        let apiKey = (test_state) ? 'testapiTest' : data.user_apis['list'][user_key_id]['key'];
        let apiSec = (test_state) ? 'testapiTest' : data.user_apis['list'][user_key_id]['secret'];

        let sell_log = data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['sell_log'];
        let log_count = sell_log.length;
        let buy_again = data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['buy-again'] ?  true : false;
        let buy = data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['buy'] ?  true : false;
        let sell_instant = data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['trade_alg_info'] ?  user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['trade_alg_info']['sell_instant'] : 0;
        let buy_again_status = false;
        if (buy_again){
            buy_again_status = data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['buy-again']['active-buy-again'];
        }
        
        let buy_amount = buy_again_status ? Robot.decimalNumber(data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['buy-again']['amount'], 2) : Robot.decimalNumber(data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['sell']['amount'], 2);


        let sell_amount = 0;
        let amount_left = buy_amount;
        let symbol_single = symbol.split('BTC')[0];
        let binance = require('node-binance-api');
        let done = false;

        sell_amount += amount_left;
        let status = (buy_again && !buy_again_status) ? 'buying-again' : 'finish';
        if (sell_instant != 0){
            status = 'finish';
        }

        data_change = true;
        alg_user[item] = 1;

        // kiem tra status neu so luong mua ~ budget_buy

        if (!test_state){
            let btc = parseFloat(data.api_balance[user_key_id]['BTC']['available']);
            let coin_ava = parseFloat(data.api_balance[user_key_id][symbol_single]['available']);
            let coin_onOrder = parseFloat(data.api_balance[user_key_id][symbol_single]['onOrder']);

            // tinh toan so luong con lai de mua
            // if (coin_ava < amount_left){
            //     amount_left = Math.floor(coin_ava);
            //     done = true;
            // }


        }

        binance.options({
            APIKEY: apiKey,
            APISECRET:  apiSec,
            useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
            test: test_state // If you want to use sandbox mode where orders are simulated
        });

        if (buy){
            let buy_orderId = data.user_hand_trading[item][main_coin][symbol][order_id]['order_id'];
            let raw = parseInt(buy_orderId.split('_')[1]);
            binance.orderStatus(symbol, raw, (error, orderStatus, symbol) => {
                if (error && !test_state){
                    console.log(symbol, error['body']);
                    resolve(1);
                    return;
                }
                if (orderStatus['status']){
                    let order_status = orderStatus['status'];
                    let exe_qty = parseFloat(orderStatus['executedQty']);
                    if (exe_qty < amount_left){
                        amount_left = Robot.decimalNumber(exe_qty, 2, 'floor');
                        done = true;
                        // huy bo lenh mua hien tai lai
                        binance.cancel(symbol, raw, (error, response, symbol) => {
                            console.log('Cancel:' , response);
                        });
                    }
                }
                setTimeout(()=>{
                    binance.sell(symbol, amount_left, bidPrice.toFixed(8), {type:'LIMIT'}, (err, res) => {
                    // binance.bookTickers((err, resu) => {
                        if (err && !test_state){
                            console.log(err['body']);
                            console.log('error selling real: ', symbol, amount_left, bidPrice);
                        }
                        else{
                            console.log(res);
                            console.log('selling real done: ', symbol, amount_left, bidPrice);

                            data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['status'] = status;
                            data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['sell_time'] = parseInt(Date.now() / 1000);
                            data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['sell_log'][log_count] =  {"price":bidPrice, "amount": amount_left,"time": parseInt(Date.now() / 1000)};

                            data.user_hand_trading[item][main_coin][symbol][order_id]['status'] = status;
                            data.user_hand_trading[item][main_coin][symbol][order_id]['sell_time'] = parseInt(Date.now() / 1000);
                            data.user_hand_trading[item][main_coin][symbol][order_id]['sell_log'][log_count] = {"price":bidPrice, "amount": amount_left, "time": parseInt(Date.now() / 1000)};

                            if (status != 'finish'){
                                data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['buy-again']['active-buy-again']
                                = data.user_hand_trading[item][main_coin][symbol][order_id]['buy-again']['active-buy-again']
                                = true;
                            }

                            let trade_info = data.user_hand_trading[item][main_coin][symbol][order_id];
                            if (status != 'buying-again'){
                                trade_info['status'] = 'finish';
                                trade_info['user_id'] = item.split('_')[1];
                                let db_add = async (data_post)=>{
                                    let order = await db.find({
                                        selector: {collection: {$eq: 'history'}, id: {$gt : null}},
                                        sort: [{id: 'desc'}],
                                        limit: 1
                                    });
                                    let latest_id = (Object.keys(order['docs']).length > 0) ? order['docs'][0]['id'] : null;
                                    data_post['_id'] = Robot.randomString(12);
                                    data_post['collection'] = "history";
                                    data_post['user_id'] = "u_100001";
                                    data_post['id'] = latest_id ? latest_id + 1 : 1;
                                    db.put(data_post);
            
                                }
                                db_add(trade_info);
                                console.log('%s', symbol, ' selling done', sell_price, sell_amount);
                                if (Object.keys(data.user_hand_trading[item][main_coin][symbol]).length > 1){
                                    delete data.user_hand_trading[item][main_coin][symbol][order_id];
                                    delete data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id];
                                }
                                else{
                                    delete data.user_hand_trading[item][main_coin][symbol];
                                    delete data.user_hand_trading_detail[main_coin][symbol]['selling'][item];
                                }
                                resolve(1);
                                return;

                                console.log('finish');
                            }
                            // chuyen status buying neu thoa dieu kien
                            else{
                                Robot.addPropertyChain(`${main_coin}.${symbol}.${status}.${item}.${order_id}`,
                                    data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id],
                                    data.user_hand_trading_detail);
                                delete data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id];
                                resolve(1);
                                return;
                            }

                        }
                    });
                }, 500);
            });
        }
        else{
            binance.sell(symbol, amount_left, bidPrice.toFixed(8), {type:'LIMIT'}, (err, res) => {
                // binance.bookTickers((err, resu) => {
                if (err && !test_state){
                    console.log(err['body']);
                    console.log('error selling real: ', symbol, amount_left, bidPrice);
                    return;
                }
                else{
                    console.log(res);
                    console.log('selling real done: ', symbol, amount_left, bidPrice);

                    data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['status'] = status;
                    data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id]['sell_log'][log_count] =  {"price":bidPrice, "amount": amount_left,"time": parseInt(Date.now() / 1000)};

                    data.user_hand_trading[item][main_coin][symbol][order_id]['status'] = status;
                    data.user_hand_trading[item][main_coin][symbol][order_id]['sell_log'][log_count] = {"price":bidPrice, "amount": amount_left, "time": parseInt(Date.now() / 1000)};

                    let trade_info = data.user_hand_trading[item][main_coin][symbol][order_id];
                    if (status != 'buying-again'){
                        trade_info['status'] = 'finish';
                        let db_add = async (data_post)=>{
                            let order = await db.find({
                                selector: {collection: {$eq: 'history'}, id: {$gt : null}},
                                sort: [{id: 'desc'}],
                                limit: 1
                            });
                            let latest_id = (Object.keys(order['docs']).length > 0) ? order['docs'][0]['id'] : null;
                            data_post['_id'] = Robot.randomString(12);
                            data_post['collection'] = "history";
                            data_post['user_id'] = "u_100001";
                            data_post['id'] = latest_id ? latest_id + 1 : 1;
                            db.put(data_post);
    
                        }
                        db_add(trade_info);
                        console.log('%s', symbol, ' selling done', sell_price, sell_amount);
                        console.log('finish');  
                        if (Object.keys(data.user_hand_trading[item][main_coin][symbol]).length > 1){
                            delete data.user_hand_trading[item][main_coin][symbol][order_id];
                            delete data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id];
                        }
                        else{
                            delete data.user_hand_trading[item][main_coin][symbol];
                            delete data.user_hand_trading_detail[main_coin][symbol]['selling'][item];
                        }
                        resolve(1);
                        return;
                    }
                    // chuyen status buying neu thoa dieu kien
                    if (status != 'finish'){
                        Robot.addPropertyChain(`${main_coin}.${symbol}.${status}.${item}.${order_id}`,
                            data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id],
                            data.user_hand_trading_detail);
                        delete data.user_hand_trading_detail[main_coin][symbol]['selling'][item][order_id];
                        resolve(1);
                        return;
                    }
                }
            });
        }
    });
    //return something
}

//==========================================================
//Hàm check
//==========================================================


handTrade.update3File = (data, obj_data)=>{
    try {
        current_update = true;
        let test_data = JSON.stringify(data.user_hand_trading);
        Object.keys(alg_user).some((file_name)=>{
            let file_path = path.join(system['define']['root_path'], system['define']['release_path'], `public/themes/electron/assets/data/user_hand_trading/${file_name}.txt`);
            Robot.writeFile(file_path, JSON.stringify(data.user_hand_trading[file_name]), null, (err)=>{
                if (err){
                    console.log(err);
                    obj_data['updating'] = false;
                }
                else{
                    obj_data['updating'] = false;
                    console.log(obj_data['updating']);
                }
            });
        });
        current_update = false;
    } catch (error) {
        let options = {
            type: 'info',
            title: 'Renderer Process Crashed',
            message: error + '',
            buttons: ['Close']
        }
        dialog.showMessageBox(options, (index) => {})
        setTimeout(()=>{
            console.log('update_again');
            handTrade.update3File(data, obj_data);
        }, 3000);

        console.log(error);
    }
}