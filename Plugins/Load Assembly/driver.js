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

    fileName = la_dialog.showOpenDialog( {
        properties: ['showHiddenFiles'],
        filters: [ { name: 'yaml', extensions: ['yaml'] } ]
    } );

    if (fileName === undefined) {
        console.log("You didn't load a file.");
        return;
    }

    clear();

    data = la_fs.readFileSync(fileName.toString());
    la_load_list = la_yaml.safeLoadAll(data)[0];
    la_comp_list = la_load_list[0];
    la_conn_list = la_load_list[1];

    loadComponents(la_comp_list);
    loadPlaces(la_comp_list);
    loadTransitions(la_comp_list);
    loadDependencies(la_comp_list);
    loadConnections(la_conn_list);

};

function clear() {

    while(component_list.length != 0) {
        deletor(component_list[0]);
    }

};

function loadComponents(la_comp_list) {

    // load components
    for(var i = 0; i < la_comp_list.length; i++) {

        loaded_component = la_comp_list[i];

        var posX = loaded_component.posX;
        var posY = loaded_component.posY;
        var scaleX = loaded_component.scaleX;
        var scaleY = loaded_component.scaleY;

        // create component in GUI, modify scale and position correctly
        var component_obj = addNewComponent(posX, posY);
        component_obj.konva_component.scaleX(scaleX);
        component_obj.konva_component.scaleY(scaleY);
        component_obj.component_group_konva.position({x:posX,y:posY});
        component_obj.name = loaded_component.name;

        // fire component event listener
        component_obj.konva_component.fire('xChange');

        layer.batchDraw();

    }
}

function loadPlaces(la_comp_list) {

    // load places
    for(var i = 0; i < la_comp_list.length; i++) {

        loaded_component = la_comp_list[i]; // components parsed from .yaml file, which has info about places
        component = component_list[i]; // global components in which we will add places

        for(var j = 0; j < loaded_component.place_list.length; j++ ) {

            loaded_place = loaded_component.place_list[j];

            var place_obj = addNewPlace(component, {x: loaded_place.posX, y: loaded_place.posY});
            place_obj.name = loaded_place.name;

            layer.batchDraw();
        }

    }

};

function loadTransitions(la_comp_list) {

    // load transitions
    for(var comp_ctr = 0; comp_ctr < la_comp_list.length; comp_ctr++) {

        loaded_component = la_comp_list[comp_ctr]; // components parsed from .yaml file, which has info about transitions
        component = component_list[comp_ctr]; // global components in which we will add transitions

        for(var trans_ctr = 0; trans_ctr < loaded_component.transition_list.length; trans_ctr++) {

            loaded_transition = loaded_component.transition_list[trans_ctr];

            var src = matchObject(component.place_list, loaded_transition.src.name);
            var dest = matchObject(component.place_list, loaded_transition.dest.name);

            var transition_obj = addNewTransition(component, src, dest);
            transition_obj.name = loaded_transition.name;
        }
    }
};

function loadDependencies(la_comp_list) {


    for(var i = 0; i < la_comp_list.length; i++) {

        loaded_component = la_comp_list[i];
        var component = component_list[i];

        for(var j = 0; j < loaded_component.dependency_list.length; j++) {

            loaded_dependency = loaded_component.dependency_list[j];

            if(loaded_dependency.source_obj.type == "Transition") {
                source_list = component.transition_list;
            } else if(loaded_dependency.source_obj.type == "Place") {
                source_list = component.place_list
            }

            source_obj = matchObject(source_list, loaded_dependency.source_obj.name);
            source_obj.dependency = true;
            source_obj.dependency_type = loaded_dependency.type;
            var dependency_obj;

            if(loaded_dependency.type == "USE" || loaded_dependency.type == "DATA_USE") {
                dependency_obj = createDependencyUsePort(component, source_obj);
            }
            else if(loaded_dependency.type == "PROVIDE" || loaded_dependency.type == "DATA_PROVIDE") {
                dependency_obj = createDependencyPort(component, source_obj);
            }

            dependency_obj.name = loaded_dependency.name;

        }

    }

};

function loadConnections(la_conn_list) {

    for(var conn_ctr = 0; conn_ctr < la_conn_list.length; conn_ctr++) {

        var loaded_connection = la_conn_list[conn_ctr];

        // get components
        var provide_component = matchObject(component_list, loaded_connection.provide_component_name);
        var use_component = matchObject(component_list, loaded_connection.use_component_name);

        // get provide stuff
        var provide_dependency = matchObject(provide_component.dependency_list, loaded_connection.provide_port_obj.name);
        var provide_obj = provide_dependency.source_obj;

        // get use stuff
        var use_dependency = matchObject(use_component.dependency_list, loaded_connection.use_port_obj.name);
        var use_obj = use_dependency.source_obj;

        // successful connection = change dependency visibility
        if(provide_dependency.type == "DATA_PROVIDE") {
            use_dependency.dep_stub_use_konva.opacity(100);
        } else {
            provide_dependency.dep_stub_konva.opacity(100);
            use_dependency.dep_stub_konva.opacity(100);
        }
        provide_dependency.dep_symbol_konva.opacity(100);
        use_dependency.dep_symbol_konva.opacity(100);

        var connection_obj = addNewConnection(provide_component, provide_obj, provide_dependency.dep_stub_konva, provide_component.component_group_konva,
                                              use_component, use_obj, use_dependency.dep_stub_konva, use_component.component_group_konva,
                                              provide_dependency, use_dependency);

        connection_obj.name = loaded_connection.name;

    }

};

// takes a list of objects (e.g. component list, place list, etc) and returns the already-created object with 'name'
function matchObject(list, name) {

    for(var list_ctr = 0; list_ctr < list.length; list_ctr++) {

        obj = list[list_ctr];

        if(obj.name == name) {
            return obj;
        }

    }
};
