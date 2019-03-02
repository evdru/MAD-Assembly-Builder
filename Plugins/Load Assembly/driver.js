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

    loadComponents(la_comp_list);
    loadPlaces(la_comp_list);
    loadTransitions(la_comp_list);
    loadDependencies(la_comp_list);

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

        offsetCtr = 0;
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

            if(offsetCtr == 0) { var offset = 0; }
            if(offsetCtr == 1) { var offset = 30; }
            if(offsetCtr == 2) { var offset = -30; }
            addNewTransition(offset, src.place_konva, dest.place_konva, src, dest, component, component.component_group_konva, component.konva_component, component.tooltipLayer, component.use_selection_area, component.provide_selection_area);
            offsetCtr++;
        }
    }
};

function loadDependencies(la_comp_list) {


    for(var i = 0; i < la_comp_list.length; i++) {

        loaded_component = la_comp_list[i];
        var component = component_list[i];

        for(var j = 0; j < loaded_component.dependency_list.length; j++) {

            loaded_dependency = loaded_component.dependency_list[j];
            console.log(loaded_dependency);
            switch(loaded_dependency.source_obj.type) {
                case ("Transition"):
                    for(var k = 0; k < component.transition_list.length; k++) {
                        if(component.transition_list[k].name == loaded_dependency.source_obj.name) {
                            source_obj = component.transition_list[k];
                        }
                    }
                    break;
                case("Place"):
                    for(var k = 0; k < component.place_list.length; k++) {
                        if(component.place_list[k].name == loaded_dependency.source_obj.name) {
                            source_obj = component.place_list[k];
                        }
                    }
                    break;
            }

            source_obj.dependency = true;
            source_obj.dependency_type = loaded_dependency.type;

            console.log(source_obj);
            switch(loaded_dependency.type) {
                case("USE" || "DATA_USE"):
                    createDependencyUsePort(component.konva_component, component, component.component_group_konva, source_obj, source_obj.tran_group_konva, component.tooltipLayer);
                    break;
                case("PROVIDE" || "DATA_PROVIDE"):
                    createDependencyPort(component.konva_component, component, component.component_group_konva, source_obj, source_obj.place_konva, component.tooltipLayer);
                    break;
            }

        }

    }

}