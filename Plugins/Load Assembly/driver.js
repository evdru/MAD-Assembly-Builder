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
    la_load_list = la_yaml.safeLoadAll(data)[0];
    la_comp_list = la_load_list[0];
    la_conn_list = la_load_list[1];

    loadComponents(la_comp_list);
    loadPlaces(la_comp_list);
    loadTransitions(la_comp_list);
    loadDependencies(la_comp_list);
    loadConnections(la_conn_list);
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
        addNewComponent(posX, posY);
        component_list[i].konva_component.scaleX(scaleX);
        component_list[i].konva_component.scaleY(scaleY);
        component_list[i].component_group_konva.position({x:posX,y:posY});

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
            addNewPlace(component.component_group_konva, component.konva_component, {x: loaded_place.posX, y: loaded_place.posY}, component, component.tooltipLayer, component.use_selection_area, component.provide_selection_area);
            layer.batchDraw();
        }

    }

};

function loadTransitions(la_comp_list) {

    // load transitions
    for(var i = 0; i < la_comp_list.length; i++) {

        loaded_component = la_comp_list[i]; // components parsed from .yaml file, which has info about transitions
        component = component_list[i]; // global components in which we will add transitions

        for(var j = 0; j < loaded_component.transition_list.length; j++) {

            loaded_transition = loaded_component.transition_list[j];

            // @todo: is there a way to make this more robust?
            for(var k = 0; k < loaded_component.place_list.length; k++) {
                if(loaded_transition.src.name == component.place_list[k].name) {
                    var src = component.place_list[k];
                }
                if(loaded_transition.dest.name == component.place_list[k].name) {
                    var dest = component.place_list[k];
                }
            }

            addNewTransition(src.place_konva, dest.place_konva, src, dest, component, component.component_group_konva, component.konva_component, component.tooltipLayer, component.use_selection_area, component.provide_selection_area);
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
                source_obj = matchTransition(component.transition_list, loaded_dependency.source_obj);
            } else if(loaded_dependency.source_obj.type == "Place") {
                source_obj = matchPlace(component.place_list, loaded_dependency.source_obj);
            }

            source_obj.dependency = true;
            source_obj.dependency_type = loaded_dependency.type;

            if(loaded_dependency.type == "USE" || loaded_dependency.type == "DATA_USE") {
                createDependencyUsePort(component.konva_component, component, component.component_group_konva, source_obj, source_obj.transition_selection_area, component.tooltipLayer);
            }
            else if(loaded_dependency.type == "PROVIDE" || loaded_dependency.type == "DATA_PROVIDE") {
                createDependencyPort(component.konva_component, component, component.component_group_konva, source_obj, source_obj.place_konva, component.tooltipLayer);
            }

        }

    }

};

function matchTransition(transition_list, loaded_transition) {

    for(var trans_ctr = 0; trans_ctr < transition_list.length; trans_ctr++) {
        transition = transition_list[trans_ctr];
        if(transition.name == loaded_transition.name) {
            return transition;
        }
    }

};

function matchPlace(place_list, loaded_place) {

    for(var place_ctr = 0; place_ctr < place_list.length; place_ctr++) {
        place = place_list[place_ctr];
        if(place.name == loaded_place.name) {
            return place;
        }
    }
};

function loadConnections(la_conn_list) {

    for(var conn_ctr = 0; conn_ctr < la_conn_list.length; conn_ctr++) {
        var provide_component;
        var provide_obj;
        var provide_dependency;

        var use_component;
        var use_obj;
        var use_dependency;

        var loaded_connection = la_conn_list[conn_ctr];

        // get components
        for(var comp_ctr = 0; comp_ctr < component_list.length; comp_ctr++) {
            component = component_list[comp_ctr];
            if(loaded_connection.provide_component_name == component.name) {
                provide_component = component;
            }
            if(loaded_connection.use_component_name == component.name) {
                use_component = component;
            }
        }

        // get provide stuff
        for(var dep_ctr = 0; dep_ctr < provide_component.dependency_list.length; dep_ctr++) {
            dependency = provide_component.dependency_list[dep_ctr];
            if(dependency.name == loaded_connection.provide_port_obj.name) {
                provide_dependency = dependency;
                provide_obj = provide_dependency.source_obj;
            }
        }

        // get use stuff
        for(var dep_ctr = 0; dep_ctr < use_component.dependency_list.length; dep_ctr++) {
            dependency = use_component.dependency_list[dep_ctr];
            if(dependency.name == loaded_connection.use_port_obj.name) {
                use_dependency = dependency;
                use_obj = use_dependency.source_obj;
            }
        }

        if(provide_dependency.type == "DATA_PROVIDE") {
            provide_dependency.dep_symbol_konva.opacity(100);
            use_dependency.dep_symbol_konva.opacity(100);
            use_dependency.dep_stub_use_konva.opacity(100);
        } else {
            provide_dependency.dep_stub_konva.opacity(100);
            provide_dependency.dep_symbol_konva.opacity(100);
            use_dependency.dep_stub_konva.opacity(100);
            use_dependency.dep_symbol_konva.opacity(100);
        }

        addNewConnection(provide_component, provide_obj, provide_dependency.dep_stub_konva, provide_component.component_group_konva,
                         use_component, use_obj, use_dependency.dep_stub_konva, use_component.component_group_konva,
                         provide_dependency, use_dependency);
    }

};
