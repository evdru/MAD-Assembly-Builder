// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const la_electron = require('electron');
const la_ipcRenderer = la_electron.ipcRenderer;
var la_fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var la_app = la_electron.remote;
var la_dialog = la_app.dialog;
var la_comp_list = component_list;
var la_yaml = require('js-yaml');

la_ipcRenderer.on('load_assembly', function() {

    loadAssembly();
    return;

});

function loadAssembly() {

    la_dialog.showOpenDialog( {properties: ['openFile']}, function (fileName) {

        if (fileName === undefined) {
            console.log("You didn't load a file.");
            return;
        }

        la_fs.readFile(fileName.toString(), (err, data) => {
            if(err) { return console.error(err); }
            // @todo: load data into gui... somehow
            console.log(data.toString());
        });
    });

};
