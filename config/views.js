const path = require('path')
const glob = require('glob')
const system = require('./system');
const files = glob.sync(path.join(__dirname, `./../${system['define']['electron_theme']}sections/*/*.ejs`))
module.exports = files;