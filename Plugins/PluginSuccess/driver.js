const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

var success_data = 'PluginSuccess can give data';

console.log('TEST!');

ipcRenderer.on('pluginsuccess', function() {
    console.log("Made it to Script_2. :D");
    helloWorld();
});
console.log('PluginSuccess has been activated.');

exports.helloWorld = function () {
    console.log("HELLO WORLD")
}

exports.data = [success_data];