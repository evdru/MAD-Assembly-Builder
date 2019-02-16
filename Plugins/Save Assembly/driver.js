// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sa_electron = require('electron');
const sa_ipcRenderer = electron.ipcRenderer;
var sa_fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var sa_app = electron.remote;
var sa_dialog = app.dialog;
var sa_comp_list = component_list;

ipcRenderer.on('save_assembly', function() {

    saveAssembly();
    return;

});

function saveAssembly() {

    // @todo: convert assembly -> .yaml; put .yaml in saveContent variable
    var saveContent = 'placeholder content';

    dialog.showSaveDialog(

        {defaultPath: "~/*.yaml"},

        function (fileName) {

            if (fileName === undefined) {
                console.log("You didn't save a file.");
                return;
            }
            // fileName is a string that contains the path and filename created in the save file dialog.
            fs.writeFile(fileName, saveContent, (err) => {
                if (err) {
                    alert("An error ocurred creating the file " + err.message)
                };
                console.log("Save successful.");
            });
      });

};
