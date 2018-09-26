// only add update server if it's not being run from cli
if (require.main !== module) {
  require('update-electron-app')({
    logger: require('electron-log')
  })
}

const ejse = require('ejs-electron')
const url  = require('url');
const path = require('path')
const glob = require('glob')
const resource = require('./config/resource')
const menu = require('./config/menu')
const views = require('./config/views')
const system = require('./config/system')
const {app, BrowserWindow, dialog, Notification} = require('electron')
const updater = require("electron-updater");
const autoUpdater = updater.autoUpdater;

const debug = /--debug/.test(process.argv[2])

let mainWindow = null
update();
function update(){
    

    // autoUpdater.on('checking-for-update', function () {
    //     sendStatusToWindow('Checking for update...');
    // });

    // autoUpdater.on('update-available', function (info) {
    //     sendStatusToWindow('Update available.');
    // });

    // autoUpdater.on('update-not-available', function (info) {
    //     sendStatusToWindow('Update not available.');
    // });

    // autoUpdater.on('error', function (err) {
    //     sendStatusToWindow('Error in auto-updater.');
    // });

    // autoUpdater.on('download-progress', function (progressObj) {
    //     let log_message = "Download speed: " + progressObj.bytesPerSecond;
    //     log_message = log_message + ' - Downloaded ' + parseInt(progressObj.percent) + '%';
    //     log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    //     sendStatusToWindow(log_message);
    // });

    // autoUpdater.on('update-downloaded', function (info) {
    //     sendStatusToWindow('Update downloaded; will install in 1 seconds');
    // });

    // autoUpdater.on('update-downloaded', function (info) {
    //     setTimeout(function () {
    //         autoUpdater.quitAndInstall();
    //     }, 1000);
    // });

    autoUpdater.checkForUpdatesAndNotify();

    // function sendStatusToWindow(message) {
    //     let myNotification = new Notification('Title', {
    //         body: message
    //     })
    //     myNotification.show();
    // }
}

function initialize () {
  const shouldQuit = makeSingleInstance()
  if (shouldQuit) return app.quit()
  load()

  app.setName(app.getName());

  function createWindow () {
    const windowOptions = {
        width: 1200,
        minWidth: 1200,
        height: 720,
        title: app.getName()
    }

    if (process.platform === 'linux') {
      windowOptions.icon = url.format(path.join( __dirname, 'public/themes/electron/assets/app-icon/png/512.png'));
    }

    // init window
    ejse.data('resource', resource);
    ejse.data('menu', menu);
    ejse.data('views', views);
    ejse.data('system', system);
    ejse.data('ejs', ejse);
    
    mainWindow = new BrowserWindow(windowOptions)

    function crashApp(cb){
        mainWindow.webContents.on('crashed', cb);
    }
    

    try{
        mainWindow.loadURL(
            url.format({
            pathname: path.join(__dirname, 'public/themes/electron/index.ejs'),
            protocol: 'file:',
            slashes: true
            })
        );
    
    }
    catch(err){
        console.log(err);
        crashApp(()=>{
            let options = {
                type: 'info',
                title: 'Renderer Process Crashed',
                message: err+'',
                buttons: ['Reload', 'Close']
            }
        
            dialog.showMessageBox(options, (index) => {
                if (index === 0) mainWindow.reload()
                else mainWindow.close()
            })
        })
    }

    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
        mainWindow.webContents.openDevTools()
        mainWindow.maximize()
        require('devtron').install()
    }

    mainWindow.on('closed', () => {
      mainWindow = null
    })
  }

  app.on('ready', () => {
    createWindow()
    autoUpdater.checkForUpdates();
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
  if (process.mas) return false

  return app.makeSingleInstance(() => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Require each JS file in the main-process dir
function load() {
    let filesArr = [
        glob.sync(path.join(__dirname, 'main-process/*.js')),
        glob.sync(path.join(__dirname, 'robot/*.js'))
    ]
    filesArr.forEach((files) => {
        files.forEach((file)=>{
            require(file) 
        })
    })
}

initialize()
