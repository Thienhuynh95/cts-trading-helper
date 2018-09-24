const binance = require('node-binance-api');
let fs = require("fs");
let func = require("./../class/func");
let {dialog} = require('electron')


class Robot{

    constructor(params = []) {
        this.path = (params['path'] != undefined) ? params['path'] : '';
    }

    randomString(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      
        for (var i = 0; i < length; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
      
        return text;
    }

    testPropertyChain(chain, obj) {
        let tmp = obj;
        let propChain = chain.split(".");
        let flag = false;
        propChain.some((element) => {
            if (tmp[element]) {
                tmp = tmp[element];
            }
            else {
                flag = true;
                return true;
            }
        });
        if (Object.keys(tmp).length === 0 || flag) {
            return false;
        }
        return true;
    }
    
    numberWithCommas(x){
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    getAllBalanceBinance(data){
        return new Promise((res, rej)=>{
            let user_api = data;
            let count = 0;
            let count_api_check = 0;
            let key_exist = {};

            data.api_balance = {};
            Object.keys(user_api).some((key_api)=>{
                let api_config = user_api[key_api];
                let key = api_config['key'];
                if (key){
                    key_exist[key] = key_exist[key] ? key_exist[key] : [];

                    if (api_config['api_check']){
                        key_exist[key][key_exist[key].length] = key_api;
                        count_api_check++;
                        console.log('valid', api_config['user_id']);
                    }
                }
            });
            console.log(count_api_check);
            if (count_api_check == 0) {
                res(1);
            }
            console.log("GETTING BALANCE =========");
            Object.keys(key_exist).some((item)=>{
                if (key_exist[item][0]){
                    let key_api = key_exist[item][0];
                    let api_config = user_api[key_api];
                    let key = api_config['key'];
                    let sec = api_config['secret'];
                    let binance_new = require('node-binance-api');

                    binance_new.options({
                        APIKEY: key,
                        APISECRET: sec,
                        useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
                        test: false // If you want to use sandbox mode where orders are simulated
                    });
                    binance_new.balance((error, balances) => {
                        if (!error){
                            console.log(count, count_api_check - 1);
                            key_exist[key].map((item)=>{
                                data.api_balance[item] = balances;
                                console.log(user_api[item]['user_id']);
                                if (count == count_api_check - 1){
                                    console.log("GETTING BALANCE DONE =========");
                                    res(1);
                                }
                                count++; 
                            });
                        }
                        else{
                            console.log(count, count_api_check - 1);
                            key_exist[key].map((item)=>{
                                console.log(user_api[item]['user_id'], 'ballance error');
                                if (count == count_api_check - 1){
                                    console.log("GETTING BALANCE DONE =========");
                                    res(1);
                                }
                                count++; 
                            });
                        }
                    });    
                }
            });
        }).catch((err)=>{
            let options = {
                type: 'info',
                title: 'Renderer Process Crashed',
                message: err + '',
                buttons: ['Close']
            }
            dialog.showMessageBox(options, (index) => {})
        });
    }

    getPreviousTimestamp(type, timestamp){
        let regex = new RegExp('[a-z]*$');
        let type_frame = regex.exec(type)[0];
        regex = new RegExp('^[0-9]*');
        let number_frame = parseInt(regex.exec(type)[0]);
        let multi_mili = 0;

        if (type_frame == 'm'){
            multi_mili = number_frame * 60 * 1000;
        }
        else if (type_frame == 'h'){
            multi_mili = number_frame * 60 * 60 * 1000;
        }
        return timestamp - multi_mili;
    }

    getFloorTimestamp(type){
        let currentDate = func.get_date();
        let hour = currentDate.hoursUTC;
        let minute = currentDate.minutesUTC;
        let day = currentDate.dateUTC;
        let month = currentDate.monthUTC;
        let year = currentDate.fullYearUTC;
        let second = '00';
        if (type == 'h'){
            minute = '00';
        }
        let date = new Date(Date.UTC(year, month, day, hour, minute, second));
        return date.getTime();
    }

    // format date Ex: 09/10/2018 00:00:00 mm/dd/yyyy hh:mm:ss
    getTimestamp(date){
        console.log(date);
        let hour = /[0-9]*\:/.exec(date)[0].replace(/\:/g, '');
        let minute = /\:[0-9]*\:/.exec(date)[0].replace(/\:/g, '');
        let day = /\/[0-9]*\//.exec(date)[0].replace(/\//g, '');
        let month = parseInt(/^[0-9]*/.exec(date)[0]) - 1;
        let year = /[0-9]{4}/.exec(date)[0].replace(/\//g, '');
        let second = '00';
        date = new Date(Date.UTC(year, month, day, hour, minute, second));
        return date.getTime();
    }

    unserialize(serializedString){
		var str = decodeURI(serializedString);
		var pairs = str.split('&');
		var obj = {}, p, idx, val;
		for (var i=0, n=pairs.length; i < n; i++) {
			p = pairs[i].split('=');
			idx = p[0];

			if (idx.indexOf("[]") == (idx.length - 2)) {
				// Eh um vetor
				var ind = idx.substring(0, idx.length-2)
				if (obj[ind] === undefined) {
					obj[ind] = [];
				}
				obj[ind].push(p[1]);
			}
			else {
				obj[idx] = p[1];
			}
		}
		return obj;
	};

    getCurrentHourFloorTimestamp(){
        let currentDate = func.get_date();
        let hour = currentDate.hoursUTC;
        let minute = currentDate.minutesUTC;
        let day = currentDate.dateUTC;
        let month = currentDate.monthUTC;
        let year = currentDate.fullYearUTC;
        let second = '00';

        let date = new Date(Date.UTC(year, month, day, hour, minute, second));
        return date.getTime();
    }

    getNextTimeFrame(type){
        let regex = new RegExp('[a-z]*$');
        let type_frame = regex.exec(type)[0];
        regex = new RegExp('^[0-9]*');
        let number_frame = parseInt(regex.exec(type)[0]);

        let time_obj = func.get_date();

        let date = time_obj.dateUTC;
        let month = time_obj.monthUTC;
        let year = time_obj.fullYearUTC;
        let hour = time_obj.hoursUTC;
        let next_hour = hour;
        let minute = time_obj.minutesUTC;
        let next_minute = 0;
        let daysInMonth = new Date(year, month+1, 0).getDate();
        let ceil_time = 0;
        if (type_frame == 'm') {
            // lấy tgian gốc (theo frame nhưng lấy chẵn xuống)
            ceil_time = Math.ceil(minute / number_frame) * number_frame;

            // lấy tgian gốc + số khung giờ
            if (minute % number_frame == 0) {
                ceil_time += number_frame;
                next_minute = ceil_time;
            }
            if (ceil_time == 60) {
                ceil_time = 0;
                next_minute = ceil_time;
                next_hour++;
                if (next_hour == 24) {
                    next_hour = 0;
                    date++;
                    if (date > daysInMonth){
                        date = 1;
                        month++;
                        if (month > 11){
                            month = 0;
                            year++;
                        }
                    }
                }
            }
        }
        else if (type_frame == 'h') {
            // lấy tgian gốc (theo frame nhưng lấy chẵn xuống)
            ceil_time = Math.ceil(hour / number_frame) * number_frame;

            // lấy tgian gốc + số khung giờ
            if (hour % number_frame == 0) {
                ceil_time += number_frame;
                next_hour = ceil_time;
            }
            if (ceil_time == 24) {
                ceil_time = 0;
                next_hour = ceil_time;
                date++;
                if (date > daysInMonth){
                    date = 1;
                    month++;
                    if (month > 11){
                        month = 0;
                        year++;
                    }
                }
            }
        }
        let newDate = new Date(Date.UTC(year, month, date, next_hour, next_minute, 0));
        return {'type': type_frame, 'frame_number' : number_frame,'number': ceil_time, 'timestamp': newDate.getTime()};
    }

    decimalNumber(number, dec, type = 'round') {
        return (type == 'floor') ? Math.floor(parseFloat(number) * Math.pow(10, dec)) / Math.pow(10, dec) :
            (type == 'ceil') ? Math.ceil(parseFloat(number) * Math.pow(10, dec)) / Math.pow(10, dec) :
                Math.round(parseFloat(number) * Math.pow(10, dec)) / Math.pow(10, dec);
    }

    saveCurrentPrice(data = []) {
        let newArr = {};
        data.some((e, i) => {
            newArr[e.symbol] = e;
        })
        newArr = JSON.stringify(newArr);
        this.writeFile('./../../public/files/data/price_list.txt', newArr);
    }

    saveParamFile(data = {}) {
        let limit_save = 5;
        let time_save = 1 * 60; // 2m
        let current_sec = func.get_date().secondsUTC;
        let current_mili = func.get_date().millisecondsUTC;
        console.log(func.func_get_time_UTC());
        let time_reset = time_save - (current_sec - Math.floor(current_sec / 10) * 10) + (1000 - current_mili);
        var on_limit = false;

        setTimeout(() => {
            let interval = setInterval(() => {
                try {
                    var on_limit = false;
                    var close_time = this.getCurrentHourFloorTimestamp();
                    Object.keys(data).map(item => {
                        robot_param.countDocuments({name: item}, (err, count) => {
                            on_limit = (count > limit_save) ? true : false;
                            let content = JSON.stringify(data[item]);

                            this.writeFile(`./../../public/files/robot_param/${item}.txt`, content);
                        });
                    });
                }
                catch (err) {
                    clearInterval(interval);
                    setTimeout(() => {
                        saveParam(data);
                    }, 2000);
                }

            }, time_save * 1000);
        }, time_reset);
    }

    async addPropertyChain(chain, val, obj) {
        var propChain = chain.split(".");
        if (propChain.length === 1) {
            obj[propChain[0]] = val;
            return;
        }
        var first = propChain.shift();
        if (!obj[first]) {
            obj[first] = {};
        }
        this.addPropertyChain(propChain.join("."), val, obj[first]);
    }

    async readFileOnLy(path) {
        this.params.data = await this.readFile(path);
    }

    async getTimeFrame(time_frame) {
        let time_frame_list = {'2h': 2, '4h': 4};
        time_frame = time_frame_list[time_frame];
        let time_obj = func.get_date();
        let hour = time_obj.hoursUTC;
        let minute = time_obj.minutesUTC;
        let second = time_obj.secondsUTC;
        let milisecond = time_obj.millisecondsUTC;

        let tmp_hour = (hour % 2 == 0) ? (hour + time_frame - 1) : hour;
        let sub_hour = tmp_hour - hour;
        let next_hour = sub_hour * 60 * 60 * 1000;  //doi so gio con lai ra milisec
        let next_minute = ((59 - minute) * 60) * 1000; // doi so phut con lai ra milisec
        let next_second = (59 - second) * 1000; // doi so giay con lai ra milisec
        let next_mili = (1000 - milisecond); // lay so milisec con lai

        let time_get_price = next_hour + next_minute + next_second + next_mili;
        let date = new Date();
        console.log(func.show_time_utc(date.getTime() + time_get_price));
    }

    async getPriceCloseTime(time_frame) {
        return new Promise((resolve, reject) => {
            let time_frame_list = {'2h': 2, '4h': 4};
            time_frame = time_frame_list[time_frame];
            let time_obj = func.get_date();
            let hour = time_obj.hoursUTC;
            let minute = time_obj.minutesUTC;
            let second = time_obj.secondsUTC;
            // let milisecond = time_obj.millisecondsUTC;

            let tmp_hour = (hour % 2 == 0) ? (hour + time_frame - 1) : hour;
            let sub_hour = tmp_hour - hour;
            let next_hour = sub_hour * 60 * 60 * 1000;  //doi so gio con lai ra milisec
            let next_minute = ((59 - minute) * 60) * 1000; // doi so phut con lai ra milisec
            let next_second = (59 - second) * 1000; // doi so giay con lai ra milisec
            let next_mili = 0; // lay so milisec con lai

            let time_get_price = next_hour + next_minute + next_second + next_mili;
            let date = new Date();
            this.params.getPriceStatus = true;
            console.log('[ WAIT TO GET PRICE ] ' + func.show_time_utc(date.getTime() + time_get_price) + ' ' + this.params.getPriceStatus);
            setTimeout(() => {
                binance.bookTickers((error, ticker) => {
                    if (error) {
                        reject(error);
                    }
                    this.params.getPriceStatus = false;
                    console.log('[ GET PRICE DONE ] ' + this.params.getPriceStatus);
                    resolve(ticker);
                });
            }, time_get_price);
        }).catch(console.log);

    };

    async getPriceOpenTime(time_frame) {
        return new Promise(resolve => {
            let time_frame_list = {'2h': 2, '4h': 4};
            time_frame = time_frame_list[time_frame];
            let time_obj = func.get_date();
            let hour = time_obj.hoursUTC;
            let minute = time_obj.minutesUTC;
            let second = time_obj.secondsUTC;
            let milisecond = time_obj.millisecondsUTC;

            let tmp_hour = (hour % 2 == 0) ? (hour + time_frame - 1) : hour;
            let sub_hour = tmp_hour - hour;
            let next_hour = sub_hour * 60 * 60 * 1000;  //doi so gio con lai ra milisec
            let next_minute = ((59 - minute) * 60) * 1000; // doi so phut con lai ra milisec
            let next_second = (59 - second) * 1000; // doi so giay con lai ra milisec
            let next_mili = (1000 - milisecond); // lay so milisec con lai

            let time_get_price = next_hour + next_minute + next_second + next_mili;
            let date = new Date();
            this.params.getPriceStatus = true;
            console.log('[ WAIT TO GET PRICE ] ' + func.show_time_utc(date.getTime() + time_get_price) + ' ' + this.params.getPriceStatus);
            setTimeout(() => {
                binance.prices((error, ticker) => {
                    if (error) {
                        clearInterval(interval);
                        resolve(error);
                    }
                    this.params.getPriceStatus = false;
                    console.log('[ GET PRICE DONE ] ' + this.params.getPriceStatus);
                    resolve(ticker);
                });
            }, time_get_price);
        });

    };

    getPriceTest(time_frame) {
        return new Promise(resolve => {
            this.params.getPriceStatus = false;
            binance.bookTickers((error, ticker) => {
                this.params.getPriceStatus = false;
                resolve(ticker);
            });
        });

    };

    readFile(path = '') {
        if (path == '') {
            path = this.path;
        }
        return new Promise((resolve, reject) => {
            // wait data in file fully load to server;
            try{
                fs.readFile(path, "utf8", function (err, data) {
                    setTimeout(function () {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        resolve(data);
                    }, 500);
                });
            }
            catch(err){
                let options = {
                    type: 'info',
                    title: 'Renderer Process Crashed',
                    message: err+' ' + path,
                    buttons: ['Close']
                }
                dialog.showMessageBox(options, (index) => {})
                resolve(1);
            }

        })
    }

    writeFileSync(path, data, option = null){
        let dt = fs.writeFileSync(path, data, option);
        return dt;
    }

    readFileSync(path = '') {
        try{
            if (fs.existsSync(path)) {
                let dt = fs.readFileSync(path, "utf8");
                return dt;
            }
            else{
                let index = 0;
                let tmp_arr = path.split(/\\|\//g);
                while(index ){
                    if (!fs.existsSync(dir)){
                        fs.mkdirSync(dir);
                    }
                }
            }
        }
        catch(err){
            let options = {
                type: 'info',
                title: 'Renderer Process Crashed',
                message: err+' ' + path,
                buttons: ['Close']
            }
            dialog.showMessageBox(options, (index) => {})
        }
        
    }

    async readAllFile(dirname = '', deleteAfterRead = false) {
        return new Promise(resolve => {
            // wait data in file fully load to server;
            setTimeout(() => {
                let dataArr = [];
                let i = 0;
                fs.readdir(dirname, (err, filenames) => {
                    if (err) {
                        resolve(err);
                    }
                    if (Object.keys(filenames).length == 0) {
                        resolve(0);
                    }
                    else {
                        let i = 0;
                        let requests = filenames.map(async (filename, index) => {
                            this.readFile(dirname + filename).then((data) => {
                                try {
                                    if (deleteAfterRead) {
                                        fs.unlink(dirname + filename);
                                    }
                                    let onlyName = filename.split('.')[0];
                                    if (data != '' || data != '{}') {
                                        console.log(filename);
                                        dataArr[onlyName] = JSON.parse(data);
                                    }
                                    i++;
                                    if (i == filenames.length || filenames.length == 1) {
                                        resolve(dataArr);
                                    }
                                } catch(e) {
                                    // statements
                                    let options = {
                                        type: 'info',
                                        title: 'Renderer Process Crashed',
                                        message: filename+' error readfile: '+e,
                                        buttons: ['Close']
                                    }
                                    dialog.showMessageBox(options, (index) => {})
                                    console.log(filename+' error readfile: '+e);
                                    // resolve(dataArr);
                                }
                                // if (deleteAfterRead) {
                                //     fs.unlink(dirname + filename);
                                // }
                                // let onlyName = filename.split('.')[0];
                                // if (data != '') {
                                //     console.log(filename);
                                //     dataArr[onlyName] = JSON.parse(data);
                                // }
                                // i++;
                                // if (i == filenames.length || filenames.length == 1) {
                                //     resolve(dataArr);
                                // }
                            });
                        });
                    }
                });

            }, 500);

        })
    }

    writeFile(path, data, option = null, cb = null){
        if (typeof cb == 'function'){
            fs.writeFile(path, data, option, cb);
        }
        else{
            try{
                fs.writeFile(path, data, option, function(err) {
                    if(err) {
                        console.log(err)
                        return ;
                    }
                });
            }
            catch(err){
                let options = {
                    type: 'info',
                    title: 'Renderer Process Crashed',
                    message: 'error: '+err,
                    buttons: ['Close']
                }
                dialog.showMessageBox(options, (index) => {})
            }
        }
    }

    async print(path, type) {
        console.log(await this.readFile(path, type));
    }
}

module.exports = Robot;
