// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sa_electron = require('electron');
const sa_ipcRenderer = electron.ipcRenderer;
var sa_fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var sa_app = electron.remote;
var sa_dialog = app.dialog;
var sa_comp_list = component_list;
var sa_yaml = require('js-yaml');

sa_ipcRenderer.on('save_assembly', function() {

    saveAssembly();
    return;

});

function saveAssembly() {

    // @todo: what other information do we need to save?
    var saveContent = '';

    for(var i = 0; i < sa_comp_list.length; i++) {
        saveContent += sa_yaml.safeDump(sa_comp_list[i]);
        saveContent += '\n';
    }

    sa_dialog.showSaveDialog(

        {defaultPath: "~/*.yaml"},

        function (fileName) {

            if (fileName === undefined) {
                console.log("You didn't save a file.");
                return;
            }
            // fileName is a string that contains the path and filename created in the save file dialog.
            sa_fs.writeFile(fileName, saveContent, (err) => {
                if (err) {
                    alert("An error ocurred creating the file " + err.message)
                };
                console.log("Save successful.");
            });
      });

};
