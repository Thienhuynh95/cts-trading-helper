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
const fs = require('fs-extra')
// const mv = require('mv');
const {app, BrowserWindow, dialog, Notification, ipcMain} = require('electron')
const updater = require("electron-updater");
const robot = require("./class/Robot");
let Robot = new robot();
let PouchDB = require('pouchdb');

const autoUpdater = updater.autoUpdater;
autoUpdater.autoDownload = false;

const debug = /--debug/.test(process.argv[2])

let mainWindow = null

function update(){
    let info = {};
    let first_request = true;
    
    ipcMain.on('update-request-info', (event, data)=>{        
        // Robot.ensureExists('./../test', function(err) {
        //     if (err){
        //         console.log(err);
        //     }
        //     else {
        
        //     }
        // });

        autoUpdater.on('checking-for-update', function () {
            sendStatusToWindow('Checking for update...');
        });

        autoUpdater.checkForUpdates().then((inform) => {
            if (autoUpdater.isUpdateAvailable) {
                info = inform;
                sendStatusToWindow(inform);
                sendStatusToWindow('Update available');
            } else {
                sendStatusToWindow('Update not available');
            }
        }).catch((error) => {
            if (isNetworkError(error)) {
                sendStatusToWindow('Network Error');
            } else {
                sendStatusToWindow('Unknown Error');
                sendStatusToWindow(error);
            }
        });
    
        function sendStatusToWindow(message) {
            let myNotification = new Notification('Title', {
                body: message + ''
            })
            event.sender.send('update-request-info-return', message);
            myNotification.show();
        }
    })

    ipcMain.on('update-request', (event, data)=>{
        if (info.cancellationToken){
            autoUpdater.downloadUpdate(info.cancellationToken).then(async (file) => {
                await Robot.copy(`${system['define']['root_path']}/${system['define']['release_path']}/public/themes/electron/assets/data`, Robot.tempDir());
                autoUpdater.quitAndInstall();
            }).catch((error) => {
                if (isNetworkError(error)) {
                    sendStatusToWindow('Network Error');
                } else {
                    sendStatusToWindow('Unknown Error');
                    sendStatusToWindow(error);
                }
            });
        }

        autoUpdater.on('download-progress', function (progressObj) {
            try{
                let log_message = "Download speed: " + progressObj.bytesPerSecond;
                log_message = log_message + ' - Downloaded ' + parseInt(progressObj.percent) + '%';
                log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
                sendStatusToWindow(log_message);
            }
            catch(err){
                sendStatusToWindow(err);
            }
        });

        function sendStatusToWindow(message) {
            let myNotification = new Notification('Title', {
                body: message + ''
            })
            event.sender.send('update-request-return', message);
            myNotification.show();
        }
    })

    function isNetworkError(errorObject) {
        return errorObject.message === "net::ERR_INTERNET_DISCONNECTED" ||
            errorObject.message === "net::ERR_PROXY_CONNECTION_FAILED" ||
            errorObject.message === "net::ERR_CONNECTION_RESET" ||
            errorObject.message === "net::ERR_CONNECTION_CLOSE" ||
            errorObject.message === "net::ERR_NAME_NOT_RESOLVED" ||
            errorObject.message === "net::ERR_CONNECTION_TIMED_OUT";
    }
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
    
    update();
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
async function load() {
    if (Robot.tempExist()){
        Robot.move(Robot.tempDir(), `${system['define']['root_path']}/${system['define']['release_path']}/public/themes/electron/assets/data`);
    }
    else{
        await Robot.initFile('./public/themes/electron/assets/data/user_api_config', 'user_api.txt')
        await Robot.initFile('./public/themes/electron/assets/data/user_hand_trading', 'u_100001.txt')
    }
    
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
