// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sa_electron = require('electron');
const sa_ipcRenderer = electron.ipcRenderer;
var sa_fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var sa_app = electron.remote; 
var sa_dialog = app.dialog;
var sa_comp_list = component_list;

ipcRenderer.on('save_assembly', function() {
    window.alert('Save Assembly Placeholder')
    return;
});