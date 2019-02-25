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

    // saving each component
    for(var i = 0; i < component_list.length; i++) {

        current_component = component_list[i];
        scaleX = current_component.konva_component.scaleX();
        scaleY = current_component.konva_component.scaleY();

        save_place_list = [];
        save_transition_list = [];

        // saving each place in a component
        for(var j = 0; j < current_component.place_list.length; j++) {
            current_place = current_component.place_list[j];
            save_place_obj = {
                type: current_place.type,
                name: current_place.name,
                index: current_place.index,
                transition_count: current_place.transition_count,
                dependency: current_place.dependency,
                dependency_type: current_place.dependency_type,
                provide_dependency_list: current_place.provide_dependency_list,
                posX: current_place.konva_place.x(),
                posY: current_place.konva_place.y()
            }
            save_place_list[j] = save_place_obj;
        }

        // saving each transition in a component
        for(var j = 0; j < current_component.transition_list.length; j++) {
            current_transition = current_component.transition_list[j];
            // defining src place
            save_src_obj = {
                type: current_transition.src.type,
                name: current_transition.src.name,
                index: current_transition.src.index,
                transition_count: current_transition.src.transition_count,
                dependency: current_transition.src.dependency,
                dependency_type: current_transition.src.dependency_type,
                provide_dependency_list: current_transition.src.provide_dependency_list
            }
            // defining dest place
            save_dest_obj = {
                type: current_transition.dest.type,
                name: current_transition.dest.name,
                index: current_transition.dest.index,
                transition_count: current_transition.dest.transition_count,
                dependency: current_transition.dest.dependency,
                dependency_type: current_transition.dest.dependency_type,
                provide_dependency_list: current_transition.dest.provide_dependency_list
            }
            save_transition_obj = {
                type: current_transition.type,
                name: current_transition.name,
                src: save_src_obj,
                dest: save_dest_obj,
                func: current_transition.func,
                dependency: current_transition.dependency,
                dependency_type: current_transition.dependency_type,
                use_dependency_list: current_transition.use_dependency_list
            }
            save_transition_list[j] = save_transition_obj;
        }

        save_component_obj = {
            type: current_component.type,
            name: current_component.name,
            place_list: save_place_list,
            transition_list: save_transition_list,
            transition_dictionary: current_component.transition_dictionary,
            dependency_list: current_component.dependency_list,
            posX: current_component.group.x(),
            posY: current_component.group.y(),
            scaleX: current_component.konva_component.scaleX(),
            scaleY: current_component.konva_component.scaleY()
        }

        sa_comp_list[i] = save_component_obj;

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
