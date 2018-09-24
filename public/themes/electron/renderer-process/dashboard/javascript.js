const {ipcRenderer} = require('electron');
const func = require('./../../../class/func');
first[area_action] = (first[area_action] != undefined) ? first[area_action] : true;
let loadHTML = '<div class="sk-spinner sk-spinner-three-bounce"><div class="sk-bounce1"></div><div class="sk-bounce2"></div><div class="sk-bounce3"></div></div>';

$(()=>{
    
    load();

    // load
    function load(){
        ipcRenderer.send('dashboard_table_load', {});
        $('.table-up, .table-down').html(loadHTML);
        if (first[area_action]){
            loadTable();
        }

        first[area_action] = false;
    }

    // load table
    function loadTable(){
        ipcRenderer.on('dashboard_table_load_return', (event, data)=>{
            // table_down/up
            Object.keys(data['data']).map((k, i)=>{
                let table_data = data['data'][k];
                let table_class = k.replace('_', '-');
                let html = '';
                //table data
                html = `<table class="table table-striped table-bordered table-hover dataTables-example ${table_class}">
                    <thead>
                        <tr>
                            <th class="text-center" width="10%">Coin</th>
                            <th class="text-center" width="10%">Today</th>
                            <th class="text-center" width="15%">Vol 24h</th>
                            <th class="text-center" width="10%">Traders</th>
                            <th class="text-center" width="10%">Yesterday</th>
                            <th class="text-center" width="10%">This week</th>
                            <th class="text-center" width="10%">Pre week</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                            Object.keys(table_data).map((symbol, i)=>{
                                let item = table_data[symbol]; 
                                return `<tr>
                                    <td class="text-left">${symbol.toUpperCase()}</td>
                                    <td class="text-right">${parseFloat(item['today']).toFixed(2)}</td>
                                    <td class="text-right">${parseFloat(item['vol_24h']).toFixed(2)}</td>
                                    <td class="text-right tooltip_traders" data-trades_30m="${item['trade_30m']}" data-trades_1h="${item['trade_1h']}" data-trades_4h="${item['trade_4h']}">${item['trade_1d']}</td>
                                    <td class="text-right ${parseFloat(item['yesterday']) > 0 ? 'text-info' : 'text-danger'}">${parseFloat(item['yesterday']).toFixed(2)}</td>
                                    <td class="text-right ${parseFloat(item['this_week']) > 0 ? 'text-info' : 'text-danger'}">${parseFloat(item['this_week']).toFixed(2)}</td>
                                    <td class="text-right ${parseFloat(item['pre_week']) > 0 ? 'text-info' : 'text-danger'}">${parseFloat(item['pre_week']).toFixed(2)}</td>
                                </tr>`;
                            }).join('')
                        }
                    </tbody>
                </table>`;
                
                $(`.${table_class}-block`).html(html);
            })
            dataTable();
        })
    }

    function dataTable() {
        $('.table-down').DataTable({
            dom: '<"html5buttons"B>lTfgitp',
            buttons: [],
            iDisplayLength: 10,
            order: [[1, 'asc']],
        });
    
        $('.table-up').DataTable({
            dom: '<"html5buttons"B>lTfgitp',
            buttons: [],
            iDisplayLength: 10,
            order: [[1, 'desc']],
        });
    }
})