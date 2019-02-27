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
        save_component_obj = componentToSaveObj(current_component);
        sa_comp_list[i] = save_component_obj;

    }

    var saveContent = sa_yaml.safeDump(sa_comp_list);

    fileName = sa_dialog.showSaveDialog( {defaultPath: "~/*.yaml"} );

    if (fileName === undefined) {
        console.log("You didn't save a file.");
        return;
    }

    sa_fs.writeFileSync(fileName, saveContent);

};

function placeToSaveObj(place) {
    return {
        type: place.type,
        name: place.name,
        index: place.index,
        transition_count: place.transition_count,
        dependency: place.dependency,
        dependency_type: place.dependency_type,
        provide_dependency_list: place.provide_dependency_list,
        posX: place.place_konva.x(),
        posY: place.place_konva.y()
    };
};

function transitionToSaveObj(transition) {

    save_src_obj = placeToSaveObj(transition.src);
    save_dest_obj = placeToSaveObj(transition.dest);

    return {
        type: transition.type,
        name: transition.name,
        src: save_src_obj,
        dest: save_dest_obj,
        func: transition.func,
        dependency: transition.dependency,
        dependency_type: transition.dependency_type,
        use_dependency_list: transition.use_dependency_list
    };

};

function componentToSaveObj(component) {

    scaleX = component.konva_component.scaleX();
    scaleY = component.konva_component.scaleY();

    save_place_list = [];
    save_transition_list = [];

    // saving each place in a component
    for(var j = 0; j < component.place_list.length; j++) {
        current_place = component.place_list[j];
        save_place_obj = placeToSaveObj(current_place);
        save_place_list[j] = save_place_obj;
    }

    // saving each transition in a component
    for(var j = 0; j < component.transition_list.length; j++) {
        current_transition = component.transition_list[j];
        save_transition_obj = transitionToSaveObj(current_transition);
        save_transition_list[j] = save_transition_obj;
    }

    return {
        type: component.type,
        name: component.name,
        place_list: save_place_list,
        transition_list: save_transition_list,
        transition_dictionary: component.transition_dictionary,
        dependency_list: component.dependency_list,
        posX: component.component_group_konva.x(),
        posY: component.component_group_konva.y(),
        scaleX: component.konva_component.scaleX(),
        scaleY: component.konva_component.scaleY()
    };

};
