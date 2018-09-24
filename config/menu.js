let menu = [
    {
        name: 'Dashboard', id: 'dashboard-index', img: 'fa-home'
    },
    {
        name: 'Trading', type: 'heading', childs: [
            {
                name: 'Trade View', id: 'hand-trade-view-index', img: 'fa-cogs'
            },
            {
                name: 'History', id: 'history-hand-trade-index', img: 'fa-history'
            },
            {
                name: 'Balances', id: 'balance-wallet-index', img: 'fa-credit-card'
            },
            {
                name: 'API Setting', id: 'account-api-index', img: 'fa-cogs'
            }
        ]
    },
    {
        name: 'Others', type: 'heading', childs: [
            {
                name: 'Video Training', id: 'video-training-index', img: 'fa-cogs'
            }
        ]
    },
];

let xhtmlMenu = '';
Object.keys(menu).some((e, i)=> {
    let item = menu[e];
    xhtmlMenu += `<li class="nav-item u-category-windows ${(i==0) ? 'first' : ''}">`;
    if(item['type'] && item['type'] == 'heading'){
        xhtmlMenu += `<h4 class="nav-category m-btm-13">
                            ${item['name']}
                        </h4>`;
        if (item['childs']){
            Object.keys(item['childs']).some((e, i)=>{
                let child = item['childs'][e];
                xhtmlMenu += `
                <button type="button" id="button-${child['id']}" data-section="${child['id']}" title="${child['name']}" class="nav-button mark-nav">
                    <i class="fa ${child['img']} text-15"></i>
                    <span class="nav-label text-w600 text-12">${child['name']}</span>
                </button>
                `;
            });
        }
    }
    else{
        xhtmlMenu += `
                <button type="button" id="button-${item['id']}" data-section="${item['id']}" title="${item['name']}" class="nav-button mark-nav">
                    <i class="fa ${item['img']} text-15"></i>
                    <span class="nav-label text-w600 text-12">${item['name']}</span>
                </button>
                `;
    }      
    xhtmlMenu += `</li>`;  
});
module.exports = xhtmlMenu;