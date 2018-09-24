let {app} = require('electron');
let params = {
    define : {
        root_path: '',
        electron_theme: '/public/themes/electron/',
        release: false
    }
}
params['define']['root_path'] = 
    (params['define']['release'] ? process.resourcesPath : app.getAppPath())
    // app.getAppPath()
    ;
params['define']['release_path'] = (params['define']['release'] ? 'app' : '');
module.exports = params;