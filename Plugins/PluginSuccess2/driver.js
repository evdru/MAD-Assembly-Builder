const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

var success_data = 'PluginSuccess2 can give data';

console.log('PluginSuccess2 has been activated.');

ipcRenderer.on('pluginsuccess2', function() {
    console.log('Testing')
});
console.log('PluginSuccess2 has been activated.');

module.exports = [success_data];