
let PouchDB = require('pouchdb');

class HistoryTradeModel{
    constructor(db, PouchDB){
        this.db = db;
        this.collection = 'history';
        this.PouchDB = PouchDB;
    }

    async getAll(){
        let selector = {id: {$gt: null}, collection: {$eq : this.collection}};
        let sort = {id: 'desc'};

        let order_tmp = await this.db.find({
            selector: selector
        });
        let order_list = order_tmp['docs'];
        console.log(order_list);
        return order_list;
    }

    async find(params){
        let listIndex = ['id', 'collection'];
        let selector = {id: {$gt: null}, collection: {$eq : this.collection}};
        let sort = {id: 'desc'};
        if (params['id']){
            selector['id'] = params['id'];
        }
        if (params['symbol']){
            selector['symbol'] = params['symbol'].replace('/', '');
            listIndex.push('symbol');
        }
        if (params['to'] && params['to'] != ''){
            let today_timestamp = parseInt((Date.now() - (24 * 60 * 60 * 1000)) / 1000);
            let from = params['from'] != '' ? parseInt(params['from'] / 1000) : today_timestamp;
            selector['sell_time'] = {
                $lte : parseInt(params['to'] / 1000)
            };
            listIndex.push('sell_time');
        }
        this.db.createIndex({
            index: {fields: listIndex},
        });
        console.log(selector);
        
        let order_tmp = await this.db.find({
            selector: selector
        });
        let order_list = order_tmp['docs'];
        return order_list;
    }

    async delete(query){
        if (query['id']){
            try {
                let dt = {};
                
                dt = await this.find(query);
                console.log(dt);
                Object.keys(dt).map((k, i) => {
                    
                    this.db.remove(dt[k]);
                })
                return true;
            }
            catch(err){
                return false;
            }
        }
    }

    async destroy(){
        await this.db.destroy();
        let new_db = new PouchDB('db', {auto_compaction: true});
    }

    async createId(){
        let order_tmp = await this.db.find({
            selector: selector,
            sort: [{id: 'desc'}],
            limit: 1
        });
        let order_list = order_tmp['docs'];
        return Object.keys(order_list).length > 1 ? order_list[0]['id'] + 1 : 1; 
    }

    async save(data){
        if (!data['id']){
            data['id'] = this.createId();
        }
        db.put(data);
    }
}
module.exports = HistoryTradeModel;