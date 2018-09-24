var hand_trade = require('./hand_trade');
var chokidar = require('chokidar');
var trade = module.exports = {};
var log = console.log.bind(console);
let system = require('./../../config/system')
let path_func = require('path');
let func = require("./../../class/func");
let binance = require("node-binance-api");

process.on('exit', (code) => {
    console.log(`About to exit with code: ${code}`);
});

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) console.log('exit');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
var folderUserApiConfig = chokidar.watch(path_func.join(system['define']['root_path'], system['define']['release_path'], 'public/themes/electron/assets/data/user_api_config/'), {
    awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 1000
    }
});
var folderUseHandTrading = chokidar.watch(path_func.join(system['define']['root_path'], system['define']['release_path'], 'public/themes/electron/assets/data/user_hand_trading/'), {
    awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 0
    }
});

var firstLoad = true;
var isRobotWriting = false;
let robot = require("./../../class/Robot");
let Robot = new robot();
let _params = {
    change_folder_candle: {},
    total_buy_coin: 0
};

folderUseHandTrading
    .on('add', path => {
        if (!firstLoad) {
            trade.update_user_hand_trading(path);
        }
    })
    .on('change', path => {
        trade.update_user_hand_trading(path);
        log(`File ${path} has been changed`)
    })
    .on('ready', () => log('Initial scan complete. Ready for changes for "folder User Hand Trading"'));

// folderUserTradingDetailConfig
//     .on('add', path => {
//         if (!firstLoad) {
//             trade.update_user_trading_detail(path);
//         }
//     })
//     .on('change', path => {
//         trade.update_user_trading_detail(path);
//         log(`File ${path} has been changed`)
//     })
//     .on('ready', () => log('Initial scan complete. Ready for changes for "folder User Trading Detail"'));

folderUserApiConfig
    .on('add', path => {
        if (!firstLoad) {
            trade.update_user_apis(path);
        }
    })
    .on('change', path => {
        trade.update_user_apis(path);
        Robot.path = path;
        log(`File ${path} has been changed`)
    })
    .on('ready', () => log('Initial scan complete. Ready for changes for "folder UserApiConfig"'));

//Biến tất cả cấu hình và thông tin trade
trade.data = {};

//===============kd trade START

//biến lưu nến
trade.candles = {};

//giá hiện tại của all coin trên sàn binance
trade.price_all_coin = {};

//config_robot_kd
trade.config_robot_kd = {};

//===============kd trade END

trade.price_open_time_2h = {};
trade.price_open_time_4h = {};

trade.price_close_time_2h = {};
trade.price_close_time_4h = {};

trade.run = async function (value, balance, obj_data) {
    console.log(obj_data['updating']);
    console.log('============= RUN MAIN ==============');

    trade.data['api_balance'] = balance;

    //Nạp các giá trị mới nếu có và biến trade.data
    if (firstLoad) {
        console.log('run fisrt load');
        trade.configs().then(() => {
            console.log('not get param');
            hand_trade.run(value, trade.data, obj_data);
        });
    }
    else {
        hand_trade.run(value, trade.data, obj_data);
    }

//	console.log("= START =============================");
//	console.log(this.data);
//	console.log("= END =============================");
};

//==========================================================
//Hàm lấy tất cả cấu hình và thông tin trade
//==========================================================
trade.configs = async function () {
    trade.data.user_hand_trading_detail = {};
    return new Promise(resolve => {
        Promise.all([
            this.update_user_apis(),
            this.update_user_hand_trading(),
            // this.update_candle(),
            // this.get_config_robot_kd(),
        ])
            .then((res) => {
                trade.data["user_apis"] = res[0];
                trade.data["user_hand_trading"] = res[1];

                // trade.data = {
                //     "trade_alg": res[0],
                //     "user_apis": res[1],
                //     "user_trade_configs": res[2],
                //     "user_trading": res[3],
                // };

                firstLoad = false;

                console.log(trade.data);
                resolve(1);
            });
    });
};

//==========================================================
//Hàm dùng để cập nhật cấu hình API của User khi có sự thay đổi
//==========================================================
trade.update_user_apis = async function (path = '') {
    return new Promise((resolve) => {
        let data = '';
        if (path == '') {
            console.log('user_api');
            Robot.readAllFile(path_func.join(system['define']['root_path'], system['define']['release_path'], 'public/themes/electron/assets/data/user_api_config/')).then((data) => {
                var keyArr = Object.keys(data);
                let newData = '';
                newData += `
					{
						"updated" : 0,
						"list": ${JSON.stringify(data[keyArr[0]])}
					}
				`;
                data = JSON.parse(newData);
                // console.log(data);
                // console.log( JSON.parse(newData) );
                // console.log(data);
                // console.log(data.config_dp_2h);

                //2. Biến chứa danh sách các API của các User trên hệ thống
                var user_apis = data;

                resolve(user_apis);
            });
        }
        else if (path != '' && !firstLoad) {
            console.log('user_api');
            Robot.readFile(path).then(data => {
                if (data != '') {
                    if (trade.data.user_apis['list'] == undefined) {
                        let newData = `{
                            "updated" : 0,
                            "list": ${JSON.stringify(data)}
                        }`;
                        trade.data.user_apis = JSON.parse(newData);
                    }
                    else {
                        trade.data.user_apis['list'] = JSON.parse(data);
                        trade.data.user_apis['updated'] = Date.now();
                    }
                }
                resolve(1);
                // console.log(trade.data);
            });
        }
    });
};


//==========================================================
//Hàm này dùng để cập nhật cấu hình Hand Trade của User khi có sự thay đổi
//==========================================================
trade.update_user_hand_trading = async (path = '') => {
    return new Promise((resolve) => {
        let data = '';
        if (path == '') {
            console.log('user_hand_trading');
            Robot.readAllFile(path_func.join(system['define']['root_path'], system['define']['release_path'], 'public/themes/electron/assets/data/user_hand_trading/')).then((data) => {
                let tempArr = {};
                Object.keys(data).some((user) => {
                    let user_list = data[user];
                    tempArr[user] = user_list;
                    // BTC part
                    Object.keys(user_list).some((main_coin) => {
                        let main_list = user_list[main_coin];
                        tempArr[user][main_coin] = main_list;
                        // ETHBTC part
                        Object.keys(main_list).some((symbol) => {
                            let symbol_list = main_list[symbol];
                            tempArr[user][main_coin][symbol] = symbol_list;
                            // order part (ex: "b_xxxx || s_ xxxx")
                            Object.keys(symbol_list).some((order)=>{
                                let item = symbol_list[order];
                                Robot.addPropertyChain(`${main_coin}.${symbol}.${item.status}.${user}.${order}`, item, trade.data.user_hand_trading_detail);
                                Robot.addPropertyChain(`${user}.${main_coin}.${symbol}.${order}`, item, tempArr);
                            })
                        });
                    });
                });
                //3. Biến chứa cấu hình của trade của các user
                var user_trade_configs = tempArr;
                console.log(user_trade_configs);
                resolve(user_trade_configs);
            });
        }
        else if (path != '' && !firstLoad) {
            console.log('user_hand_trading');
            regex = new RegExp('[a-zA-Z0-9_]*.txt$');
            let fileName = regex.exec(path)[0];
            let only_name = fileName.split('.txt')[0];

            Robot.readFile(path).then(data => {
                if (data != '') {
                    try{
                        console.log(trade.data.user_hand_trading[only_name]);
                        data = JSON.parse(data);
                        tempArr = {};
                        // Kiem tra xem co xoa don nao khong
                        // BTC part
                        Object.keys(trade.data.user_hand_trading[only_name]).some((main_coin) => {
                            let main_list = trade.data.user_hand_trading[only_name][main_coin];
                            // ETHBTC part
                            Object.keys(main_list).some((symbol) => {
                                let symbol_list = main_list[symbol];
                                // order part (ex: "b_xxxx || s_ xxxx")
                                Object.keys(symbol_list).some((order)=>{
                                    // console.log(data[main_coin][symbol]);
                                    let item = symbol_list[order];
                                    let current_status = item['status'];
                                    if (Robot.testPropertyChain(`${main_coin}.${symbol}.${order}`, data)){
                                        let data_item = data[main_coin][symbol][order];
                                        Robot.addPropertyChain(`${main_coin}.${symbol}.${data_item.status}.${only_name}.${order}`, data_item, trade.data.user_hand_trading_detail);
                                        if (data_item.status != current_status) {
                                            delete trade.data.user_hand_trading_detail[main_coin][symbol][current_status][only_name][order];
                                        }
                                        Robot.addPropertyChain(`${only_name}.${main_coin}.${symbol}.${order}`, data_item, trade.data.user_hand_trading);
                                    }
                                    else{
                                        delete trade.data.user_hand_trading_detail[main_coin][symbol][current_status][only_name][order];
                                        delete trade.data.user_hand_trading[only_name][main_coin][symbol][order];
                                    }
                                });
                            });
                        });

                        // Kiem tra xem co them don nao khong
                        // BTC part
                        Object.keys(data).some((main_coin) => {
                            let main_list = data[main_coin];
                            // ETHBTC part
                            Object.keys(main_list).some((symbol) => {
                                let symbol_list = main_list[symbol];
                                // order part (ex: "b_xxxx || s_ xxxx")
                                Object.keys(symbol_list).some((order)=>{
                                    let item = symbol_list[order];
                                    Robot.addPropertyChain(`${main_coin}.${symbol}.${item.status}.${only_name}.${order}`, item, trade.data.user_hand_trading_detail);
                                    Robot.addPropertyChain(`${only_name}.${main_coin}.${symbol}.${order}`, item, trade.data.user_hand_trading);
                                });
                            });
                        });
                    }
                    catch(err){
                        console.log('user_hand_trading', only_name, err + '');
                    }
                }
                resolve(0);
            });
        }
    });
};