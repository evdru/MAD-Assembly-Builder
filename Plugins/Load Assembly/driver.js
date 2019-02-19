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

    // @todo: clear/reload gui
    fileName = la_dialog.showOpenDialog( {properties: ['showHiddenFiles']} );

    if (fileName === undefined) {
        console.log("You didn't load a file.");
        return;
    }

    data = la_fs.readFileSync(fileName.toString());
    la_comp_list = la_yaml.safeLoadAll(data)[0];
    // @todo: we now have a list of components; how do we load them in?

    for(var i = 0; i < la_comp_list.length; i++) {

        var posX = la_comp_list[i].posX;
        var posY = la_comp_list[i].posY;

        addNewComponent(posX, posY);

    }

    console.log(component_list);

};
