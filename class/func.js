const date = require("date-and-time");
const path = require("path");
let self = module.exports = {

//get time stmp
    get_timestamp: () => {
        return Math.floor(new Date().getTime());
    },

//show time
    show_time: (timestamp = "") => {
        if (timestamp === "") {
            return date.format(new Date(), "YYYY/MM/DD HH:mm:ss");
        } else {
            return date.format(new Date(parseInt(timestamp)), "YYYY/MM/DD HH:mm:ss");
        }
    },
//show time utc
    show_time_utc: (timestamp = "") => {
        if (timestamp === "") {
            return date.format(new Date(), "YYYY/MM/DD HH:mm:ss", true);
        } else {
            return date.format(new Date(parseInt(timestamp)), "YYYY/MM/DD HH:mm:ss", true);
        }
    },
    //show time utc +7
    show_time_7: (timestamp = "") => {
        if (timestamp === "") {
            let now = new Date();
            let utc_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
            let timestamp = utc_now.getTime() + 7 * 60 * 60 * 1000;
            return date.format(new Date(timestamp), "YYYY/MM/DD HH:mm:ss");
        } else {
            let now = new Date(parseInt(timestamp));
            let utc_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
            let timestamp = utc_now.getTime() + 7 * 60 * 60 * 1000;
            return date.format(new Date(timestamp), "YYYY/MM/DD HH:mm:ss");
        }
    },

//get UTC
    func_get_time_UTC: () => {
        let now = new Date();
        let hour_utc = now.getUTCHours();
        let minute_utc = now.getUTCMinutes();
        let second_utc = now.getUTCSeconds();
        let milisecond_utc = now.getUTCMilliseconds();
        return {
            hour: parseInt(hour_utc),
            minute: parseInt(minute_utc),
            second: parseInt(second_utc),
            milisecond: parseInt(milisecond_utc)
        };
    },

//conver H:m:s
    secondsToHms: (d) => {
        d = Number(d);
        let h = Math.floor(d / 3600);
        let m = Math.floor(d % 3600 / 60);
        let s = Math.floor(d % 3600 % 60);
        h = h < 10 ? "0" + h : h;
        m = m < 10 ? "0" + m : m;
        s = s < 10 ? "0" + s : s;
        return h + ":" + m + ":" + s;
    },

//console.log
    console_log: (text, data) => {
        console.log("===============");
        console.log(text);
        console.log(data);
        console.log("===============");
    },

//show_room
    show_room: (data) => {
        console.log("===============");
        console.log("show room");
        console.log(data);
        console.log("===============");
    },

    prepare_json: (data) => {
        data = JSON.stringify(data);
        data = JSON.parse(data);
        return data;
    },

//get full params date
    get_date: () => {
        let obj = {};
        let d = new Date();
        obj.fullYear = parseInt(d.getFullYear());	//Get the year as a four digit number (yyyy)
        obj.month = parseInt(d.getMonth());	//Get the month as a number (0-11)
        obj.date = parseInt(d.getDate());	//Get the day as a number (1-31)
        obj.hours = parseInt(d.getHours());	//Get the hour (0-23)
        obj.minutes = parseInt(d.getMinutes());	//Get the minute (0-59)
        obj.seconds = parseInt(d.getSeconds());	//Get the second (0-59)
        obj.milliseconds = parseInt(d.getMilliseconds());	//Get the millisecond (0-999)
        obj.time = parseInt(d.getTime());	//Get the time (milliseconds since January 1, 1970)
        obj.day = parseInt(d.getDay());	//Get the weekday as a number (0-6)

        obj.dateUTC = parseInt(d.getUTCDate());	//Same as getDate(), but returns the UTC date
        obj.dayUTC = parseInt(d.getUTCDay());	//Same as getDay(), but returns the UTC day
        obj.fullYearUTC = parseInt(d.getUTCFullYear());	//Same as getFullYear(), but returns the UTC year
        obj.hoursUTC = parseInt(d.getUTCHours());	//Same as getHours(), but returns the UTC hour
        obj.millisecondsUTC = parseInt(d.getUTCMilliseconds());	//Same as getMilliseconds(), but returns the UTC milliseconds
        obj.minutesUTC = parseInt(d.getUTCMinutes());	//Same as getMinutes(), but returns the UTC minutes
        obj.monthUTC = parseInt(d.getUTCMonth());	//Same as getMonth(), but returns the UTC month
        obj.secondsUTC = parseInt(d.getUTCSeconds());	//Same as getSeconds(), but returns the UTC seconds

        return obj;
    },

//get file name
    get_file_name: (__filename) => {
        return path.basename(__filename);
    },

//length obj
    get_length_obj: (objs) => {
        return Object.keys(objs).length;
    },

    //show key obj
    get_key_objs: (objs) => {
        return Object.keys(objs);
    },

    //compare config
    async compare_candle_and_config(candle, config, param) {
        let is_buy = false;
        switch (param) {
            case "gt":
                if (candle > config) {
                    is_buy = true;
                }
                break;
            case "gte":
                if (candle >= config) {
                    is_buy = true;
                }
                break;
            case "eq":
                if (candle === config) {
                    is_buy = true;
                }
                break;
            case "lt":
                if (candle < config) {
                    is_buy = true;
                }
                break;
            case "lte":
                if (candle <= config) {
                    is_buy = true;
                }
                break;
            case "ne":
                if (candle !== config) {
                    is_buy = true;
                }
                break;
        }
        return is_buy;
    },

    percent: async (params_1, params_2) => {
        return (params_1 - params_2) / params_2 * 100;
    }
};

