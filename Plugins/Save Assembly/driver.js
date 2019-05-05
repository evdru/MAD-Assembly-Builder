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

    var save_comp_list = saveComponents(component_list);
    var save_conn_list = saveConnections(connection_list);
    var save_list = [save_comp_list, save_conn_list];

    var saveContent = sa_yaml.safeDump(save_list);

    fileName = sa_dialog.showSaveDialog( {
        defaultPath: "~/*.yaml",
        filters: [ { name: 'yaml', extensions: ['yaml'] } ]
    } );

    if (fileName === undefined) {
        console.log("You didn't save a file.");
        return;
    }

    sa_fs.writeFileSync(fileName, saveContent);
};

function saveComponents(component_list) {

    var save_comp_list = [];

    // saving each component
    for(var i = 0; i < component_list.length; i++) {

        current_component = component_list[i];
        save_component_obj = componentToSaveObj(current_component);
        save_comp_list[i] = save_component_obj;

    }

    return save_comp_list;

}

function saveConnections(connection_list) {

        var save_conn_list = [];

        // saving each component
        for(var i = 0; i < connection_list.length; i++) {

            current_connection = connection_list[i];
            save_connection_obj = connectionToSaveObj(current_connection);
            save_conn_list[i] = save_connection_obj;

        }

        return save_conn_list;

}

function componentToSaveObj(component) {

    save_place_list = [];
    save_transition_list = [];
    save_dependency_list = [];

    // saving each place in a component
    for(var i = 0; i < component.place_list.length; i++) {
        current_place = component.place_list[i];
        save_place_obj = placeToSaveObj(current_place);
        save_place_list[i] = save_place_obj;
    }

    // saving each transition in a component
    for(var i = 0; i < component.transition_list.length; i++) {
        current_transition = component.transition_list[i];
        save_transition_obj = transitionToSaveObj(current_transition);
        save_transition_list[i] = save_transition_obj;
    }

    // saving each dependency into a component
    for(var i = 0; i < component.dependency_list.length; i++) {
        current_dependency = component.dependency_list[i];
        save_dependency_obj = dependencyToSaveObj(current_dependency);
        save_dependency_list[i] = save_dependency_obj;
    }

    return {
        type: component.type,
        name: component.name,
        place_list: save_place_list,
        transition_list: save_transition_list,
        transition_dictionary: component.transition_dictionary,
        dependency_list: save_dependency_list,
        posX: component.konva_component.getAbsolutePosition().x,
        posY: component.konva_component.getAbsolutePosition().y,
        scaleX: component.konva_component.scaleX(),
        scaleY: component.konva_component.scaleY()
    };

};

function placeToSaveObj(place, transitions=true) {

    save_transition_outbound_list = [];
    save_transition_inbound_list = [];

    if(transitions) {

        for(var i = 0; i < place.transition_outbound_list.length; i++) {
            transition = place.transition_outbound_list[i];
            save_transition_obj = transitionToSaveObj(transition);
            save_transition_outbound_list[i];
        }

        for(var i = 0; i < place.transition_inbound_list.length; i++) {
            transition = place.transition_inbound_list[i];
            save_transition_obj = transitionToSaveObj(transition);
            save_transition_inbound_list[i];
        }
    }

    return {
        type: place.type,
        name: place.name,
        index: place.index,
        transition_count: place.transition_count,
        dependency_count: place.dependency_count,
        dependency: place.dependency,
        dependency_type: place.dependency_type,
        transition_outbound_list: save_transition_outbound_list,
        transition_inbound_list: save_transition_inbound_list,
        posX: place.place_konva.getX(),
        posY: place.place_konva.getY()
    };
};

function transitionToSaveObj(transition) {

    save_src_obj = placeToSaveObj(transition.src, false);
    save_dest_obj = placeToSaveObj(transition.dest, false);

    return {
        type: transition.type,
        name: transition.name,
        src: save_src_obj,
        dest: save_dest_obj,
        func: transition.func,
        dependency_count: transition.dependency_count,
        dependency: transition.dependency,
        dependency_type: transition.dependency_type,
    };

};

function dependencyToSaveObj(dependency, connections=true) {

    var save_src_obj;
    switch(dependency.source_obj.type) {
        case "Transition":
            save_src_obj = transitionToSaveObj(dependency.source_obj);
            break;
        case "Place":
            save_src_obj = placeToSaveObj(dependency.source_obj);
            break;
    }

    if(connections && typeof dependency.connection_obj !== 'undefined') {
        save_connection_obj = connectionToSaveObj(dependency.connection_obj);
    } else {
        save_connection_obj = 'undefined';
    }

    return {
        type: dependency.type,
        name: dependency.name,
        index: dependency.index,
        source_obj: save_src_obj,
        connection_obj: save_connection_obj,
    };

};

function connectionToSaveObj(connection) {

    save_provide_port_obj = dependencyToSaveObj(connection.provide_port_obj, false);
    save_use_port_obj = dependencyToSaveObj(connection.use_port_obj, false);

    return {
        enabled: connection.enabled,
        provide_port_obj: save_provide_port_obj,
        use_port_obj: save_use_port_obj,
        provide_component_name: connection.provide_component_name,
        use_component_name: connection.use_component_name
    };

};
