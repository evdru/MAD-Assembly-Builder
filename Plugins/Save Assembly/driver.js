// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sa_electron = require('electron');
const sa_ipcRenderer = sa_electron.ipcRenderer;
var sa_fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var sa_app = sa_electron.remote;
var sa_dialog = sa_app.dialog;
var sa_comp_list = component_list;
var sa_yaml = require('js-yaml');

sa_ipcRenderer.on('save_assembly', function() {

    saveAssembly();
    return;

});

function saveAssembly() {

    console.log(sa_comp_list);

    for(var i = 0; i < sa_comp_list.length; i++) {
        component = sa_comp_list[i];
        component.group = '';
    }

    var saveContent = sa_yaml.safeDump(sa_comp_list);

    fileName = sa_dialog.showSaveDialog( {defaultPath: "~/*.yaml"} );

    if (fileName === undefined) {
        console.log("You didn't save a file.");
        return;
    }

    console.log(sa_comp_list);

    sa_fs.writeFileSync(fileName, saveContent);

};
