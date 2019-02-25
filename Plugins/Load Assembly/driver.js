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

        loaded_component = la_comp_list[i];

        var posX = loaded_component.posX;
        var posY = loaded_component.posY;
        var scaleX = loaded_component.scaleX;
        var scaleY = loaded_component.scaleY;

        // create component in GUI, modify scale and position correctly
        addNewComponent(posX, posY);
        component_list[i].konva_component.scaleX(scaleX);
        component_list[i].konva_component.scaleY(scaleY);
        component_list[i].group.position({x:posX,y:posY});

        layer.batchDraw();

    }

    // load places
    for(var i = 0; i < component_list.length; i++) {

        component = component_list[i]; // global components in which we will add places
        loaded_component = la_comp_list[i]; // components parsed from .yaml file, which has info about places

        for(var j = 0; j < loaded_component.place_list.length; j++ ) {
            loaded_place = loaded_component.place_list[j];
            addNewPlace(component.group, component.konva_component, {x: loaded_place.posX, y: loaded_place.posY}, component, component.tooltipLayer);
            layer.batchDraw();
        }

    }

    console.log(component_list);

};
