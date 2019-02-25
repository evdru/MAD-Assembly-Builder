// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sa_electron = require('electron');
const sa_ipcRenderer = sa_electron.ipcRenderer;
var sa_fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var sa_app = sa_electron.remote;
var sa_dialog = sa_app.dialog;
var sa_comp_list = [];
var sa_yaml = require('js-yaml');

sa_ipcRenderer.on('save_assembly', function() {

    saveAssembly();
    return;

});

function saveAssembly() {

    for(var i = 0; i < component_list.length; i++) {

        current_component = component_list[i];
        scaleX = current_component.konva_component.scaleX();
        scaleY = current_component.konva_component.scaleY();

        save_obj = {
            type: current_component.type,
            name: current_component.name,
            place_list: current_component.place_list,
            transition_list: current_component.transition_list,
            transition_dictionary: current_component.transition_dictionary,
            dependency_list: current_component.dependency_list,
            posX: current_component.group.x(),
            posY: current_component.group.y(),
            scaleX: current_component.konva_component.scaleX(),
            scaleY: current_component.konva_component.scaleY()
        }

        sa_comp_list[i] = save_obj;

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
