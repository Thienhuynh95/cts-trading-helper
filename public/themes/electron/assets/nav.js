const settings = require('electron-settings')
const {dialog} = require('electron').remote

document.body.addEventListener('click', (event) => {
    try{
        if ($(event.target).closest('.nav-button').length > 0 && $(event.target).closest('.nav-button').data('section')) {
            handleSectionTrigger(event)
        } else if (event.target.dataset.modal) {
            handleModalTrigger(event)
        } else if (event.target.classList.contains('modal-hide')) {
            hideAllModals()
        }
    }
    catch(err){
        console.log(err);
        let options = {
            type: 'info',
            title: 'Renderer Process Crashed',
            message: err+'',
            buttons: ['Close']
        }
        dialog.showMessageBox(options, (index) => {})
    }
})

process.on('exit', ()=>{
    let options = {
        type: 'info',
        title: 'Renderer Process Crashed',
        message: 'error',
        buttons: ['Close']
    }
    dialog.showMessageBox(options, (index) => {})
})

function activeMenu(target){
    let $target = $(target);
    let target_id = $target.attr('id');
    if (!target_id.includes('index')){
        let arr_tmp = target_id.split('-');
        arr_tmp.pop();
        arr_tmp.push('index');
        let id_menu = arr_tmp.join('-');
        $('#'+ id_menu).addClass('is-selected');
    }
}

function handleSectionTrigger (event) {

    hideAllSectionsAndDeselectButtons()
    let target = $(event.target).closest('.nav-button');
    // Highlight clicked button and show view
    target.addClass('is-selected')
    activeMenu(target);

    // Display the current section
    const sectionId = `${target.data('section')}-section`;

    if (document.getElementById(sectionId)){
        setTimeout(()=>{
            document.getElementById(sectionId).classList.add('is-shown')
        }, 100)
    }
    else{
        const link = document.querySelector(`link[data-link="${sectionId}"]`);
        let template = link.import.querySelector('.task-template')
        if (template){
            // create fake interval (clear All interval)
            let tmp = setInterval(';');
            for (var i = 0 ; i <= tmp ; i++) clearInterval(i);

            let clone = document.importNode(template.content, true)
            let html = $(clone).children().html();
            let key_id = target.data('key-id');
            let order_id = target.data('order-id');
            let symbol_edit = target.data('symbol-edit');
            if (link.href.match('about.html')) {
                $('body').html(html)
            } else {
                $('.content').empty();
                if (key_id){
                    $('.content').append(`<script>var user_key_id = "${key_id}"</script>`);
                }
                if (order_id){
                    $('.content').append(`<script>var order_id = "${order_id}"</script>`);
                }
                if (symbol_edit){
                    $('.content').append(`<script>var symbol_edit = "${symbol_edit}"</script>`);
                }
                if (!key_id && !order_id && !symbol_edit){
                    $('.content').html(html);
                }
                else{
                    $('.content').append(html);
                }
            }
        }
    }

    if (target.hasClass('mark-nav')){
        // Save currently active button in localStorage
        const buttonId = target.attr('id')
        settings.set('activeSectionButtonId', buttonId)
    }
}

function activateDefaultSection () {
    displayAbout();
}

function showMainContent () {
  document.querySelector('.js-nav').classList.add('is-shown')
  document.querySelector('.js-content').classList.add('is-shown')
}

function handleModalTrigger (event) {
  hideAllModals()
  const modalId = `${event.target.dataset.modal}-modal`
  console.log(modalId);
  document.getElementById(modalId).classList.add('is-shown')
}

function hideAllModals () {
  const modals = document.querySelectorAll('.modal.is-shown')
  Array.prototype.forEach.call(modals, (modal) => {
    modal.classList.remove('is-shown')
  })
  showMainContent()
}

function hideAllSectionsAndDeselectButtons () {
  const sections = document.querySelectorAll('.js-section.is-shown')
  Array.prototype.forEach.call(sections, (section) => {
    section.classList.remove('is-shown')
  })

  const buttons = document.querySelectorAll('.nav-button.is-selected')
  Array.prototype.forEach.call(buttons, (button) => {
    button.classList.remove('is-selected')
  })
}

function displayAbout () {
  document.querySelector('#about-modal').classList.add('is-shown')
}

// Default to the view that was active the last time the app was open
const sectionId = settings.get('activeSectionButtonId')
showMainContent()
if (sectionId) {
  const section = document.getElementById(sectionId)
  displayAbout();
  if (section) section.click()
} else {
  activateDefaultSection()
}
