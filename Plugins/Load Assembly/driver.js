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

    // load components
    for(var i = 0; i < la_comp_list.length; i++) {

        var posX = la_comp_list[i].posX;
        var posY = la_comp_list[i].posY;

        addNewComponent(posX, posY);

    }

    // load places
    for(var i = 0; i < component_list.length; i++) {

        component = component_list[i]; // global components in which we will add places
        loaded_component = la_comp_list[i]; // components parsed from .yaml file, which has info about places

        for(var j = 0; j < loaded_component.place_list.length; j++ ) {
            loaded_place = loaded_component.place_list[j];
            addNewPlace(component.group, component.konva_component, loaded_place.pos, component, component.tooltipLayer);
            layer.batchDraw();
        }

    }

    console.log(component_list);

};
