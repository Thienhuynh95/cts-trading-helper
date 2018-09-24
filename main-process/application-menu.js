const {BrowserWindow, Menu, app, shell, dialog} = require('electron')

let template = [{
    label: 'Debug',
    accelerator: (() => {
        if (process.platform === 'darwin') {
            return 'Alt+Command+I'
        } else {
            return 'Ctrl+Shift+I'
        }
    })(),
    click: (item, focusedWindow) => {
        if (focusedWindow) {
            focusedWindow.toggleDevTools()
        }
    }
}]

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})
