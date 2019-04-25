const fs = require('fs');
const path = require('path');

const plugins_folder = path.join(__dirname, '../Plugins/');

let valid_plugins = [];
let valid_paths = [];

//Collects the plugins present in the Plugins folder
let plugins = fs.readdirSync(plugins_folder);
console.log('\nThe following ' + plugins.length + ' Plugin(s) have been Detected:\n    ' + plugins);

for (var i = 0; i < plugins.length; i++) {
    if (fs.lstatSync(plugins_folder + plugins[i] + '/').isDirectory()){
        let files = fs.readdirSync(plugins_folder + plugins[i] + '/');

        if (files.includes('driver.js')) {
            valid_plugins.push(plugins[i]);
            valid_paths.push(plugins_folder + plugins[i] + '/');
        }
    }
}

console.log('\nThe following ' + valid_plugins.length + ' Plugin(s) have been Validated:\n    ' + valid_plugins);

module.exports = [valid_plugins, valid_paths];
