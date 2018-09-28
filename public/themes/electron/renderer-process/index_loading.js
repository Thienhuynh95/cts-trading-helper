let {app, dialog} = require('electron').remote;
let {ipcRenderer} = require('electron');

$(()=>{
    init();

    function init(){
        // menuSetting();
        update_request();
        // change app title
        $('.nav-header .nav-title').html(`<b class="text-35 color-white text-w700">${app.getName()} </b><span class="text-yellow text-13 text-w600 text-lower"></span>`);
        $('.about-version').html(`v${app.getVersion()}`);
    }

    function update_request(){
        
        ipcRenderer.send('update-request-info', {});
        ipcRenderer.on('update-request-info-return', (event, data)=>{
            let info = data;
            if (info['versionInfo']){
                let version = info['versionInfo']['version'];
                $('#update').html(`UPDATE v${version}`).removeClass('hidden');
            }
        })
        $('#update').click(()=>{
            ipcRenderer.send('update-request', {});
            ipcRenderer.on('update-request-return', (event, data)=>{
                console.log(data);
            })
        })
    }
    
    function menuSetting(){
        // active menu
        $('#side-menu').metisMenu();
    
        $('.navbar-minimalize').on('click', function () {
            $("body").toggleClass("mini-navbar");
            SmoothlyMenu();
        });
    
        // Full height of sidebar
        function fix_height() {
            var heightWithoutNavbar = $("body > #wrapper").height() - 61;
            $(".sidebard-panel").css("min-height", heightWithoutNavbar + "px");
    
            var navbarHeigh = $('nav.navbar-default').height();
            var wrapperHeigh = $('#page-wrapper').height();
    
            if (navbarHeigh > wrapperHeigh) {
                $('#page-wrapper').css("min-height", navbarHeigh + "px");
            }
    
            if (navbarHeigh < wrapperHeigh) {
                $('#page-wrapper').css("min-height", $(window).height() + "px");
            }
    
            if ($('body').hasClass('fixed-nav')) {
                if (navbarHeigh > wrapperHeigh) {
                    $('#page-wrapper').css("min-height", navbarHeigh - 60 + "px");
                } else {
                    $('#page-wrapper').css("min-height", $(window).height() - 60 + "px");
                }
            }
    
        }
    
        fix_height();
    
        function SmoothlyMenu() {
            if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
                // Hide menu in order to smoothly turn on when maximize menu
                $('#side-menu').hide();
                // For smoothly turn on menu
                setTimeout(
                    function () {
                        $('#side-menu').fadeIn(400);
                    }, 200);
            } else if ($('body').hasClass('fixed-sidebar')) {
                $('#side-menu').hide();
                setTimeout(
                    function () {
                        $('#side-menu').fadeIn(400);
                    }, 100);
            } else {
                // Remove all inline style from jquery fadeIn function to reset menu state
                $('#side-menu').removeAttr('style');
            }
        }
    
    }
})