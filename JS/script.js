const BrowserWindow = require('electron').remote.BrowserWindow;
const url = require('url');
const path = require('path');
const ipcMain = require('electron').remote.ipcMain;
const remote = require('electron').remote;
const ipcRend = require('electron').ipcRenderer;

var layer = "global";
var stage = "global";
var component_list = [];
var connection_list = [];
var blockSnapSize = 10;
var source_transition = null;
var dest_transition = null;
var source_obj = null;
var dest_obj = null;
var highlighted = false;
const MAX_DEPENDENCY_COUNT = 3;
const max_transition_count = 3; // const global max transition count coming out of any one place

class Component {
    constructor(type, name){
        this.type = type;
        this.name = name;
        this.index;
        this.place_list = [];
        this.component_group_konva;
        this.transition_list = [];
        this.transition_dictionary = {};
        this.dependency_list = [];
        this.konva_component;
        this.tooltipLayer;
        this.use_selection_area;
        this.provide_selection_area;
    };
};

class Place {
    constructor(type, name) {
        this.type = type;
        this.name = name;
        this.index;
        this.component_obj;
        this.place_konva;
        this.transition_count = 0; // 3 max
        this.dependency_count = 0; // 3 max
        this.offset = 0; // offset is for transitions coming out of this place
        this.dependency = false;
        this.dependency_type = '';
        this.dependency_konva_list = [];
        this.dependency_obj_list = [];
        this.transition_outbound_list = [];
        this.transition_inbound_list = [];
    };
};

class Transition {
    constructor(type, name, src, dest, func) {
        this.type = type;
        this.name = name;
        this.index;
        this.src = src;
        this.tran_group_konva;
        this.tran_select_konva;
        this.tran_konva;
        this.dest = dest;
        this.func = func;
        this.component_obj;
        this.dependency_count = 0; // 3 max
        this.dependency = false;
        this.dependency_type = '';
        this.dependency_konva_list = [];
        this.offset;
        this.dependency_obj_list = [];
        this.duration_min = 1;
        this.duration_max = 2;
        this.current_duration = 0;
        this.offset;
    };
};

class Dependency {
    constructor(type, name) {
        this.type = type;
        this.name = name;
        this.index;
        this.dep_group_konva;
        this.dep_stub_konva;
        this.source_obj;
        this.connection_list = [];
        this.component_obj;
        this.enabled = false;
    };
};

class Connection {
    constructor() {
        this.connection_group_konva;
        this.connection_line_konva;
        this.gate1_konva;
        this.gate2_konva;
        this.enabled = false;
        this.provide_port_obj;
        this.use_port_obj;
        this.provide_component_name;
        this.use_component_name;
    }
};

function snapToGrid(pos){
    return Math.round(pos / blockSnapSize) * blockSnapSize;
};

function initialize() {
    var WIDTH = 3840;
    var HEIGHT = 2160;

    stage = new Konva.Stage({
        container: 'container',
        width: WIDTH,
        height: HEIGHT
    });

    layer = new Konva.Layer();
    stage.add(layer);
};

// Drag N Drop Functions

function allowDrop(ev) {
    ev.preventDefault();
    console.log("allow drop");
};

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var posX = ev.pageX - 150;
    var posY = ev.pageY - 175;
    if(data == "component"){
        addNewComponent(posX, posY);
    }
};

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
};

// Function to close new windows
function closeNewWindow() {
    var window = remote.getCurrentWindow();
    window.close();
};

// Function to change place name
function changePlaceName(component, place, new_place_name) {
    // find the component obj
    var found_component_obj = component_list.find(function(element) { return element.name == component; });
    var found_place_obj = found_component_obj.place_list.find(function(element) { return element.name == place; });
    // set place obj to its new name
    if(found_place_obj){ found_place_obj.name = new_place_name; }
};

// Function to change place's dependency status
function changePlaceDependencyStatus(component, place, dependency_status) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].place_list.length; j++) {
                if (component_list[i].place_list[j].name == place) {
                    component_list[i].place_list[j].dependency = dependency_status;
                    console.log(place + " dependency status is: " + component_list[i].place_list[j].dependency)
                }
            }
        }
    }
};

// Function to change place's dependency type
function changePlaceDependencyType(component, place, dependency_type) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].place_list.length; j++) {
                if (component_list[i].place_list[j].name == place) {
                    component_list[i].place_list[j].dependency_type = dependency_type.toUpperCase();
                    console.log(place + " dependency type is: " + component_list[i].place_list[j].dependency_type)
                }
            }
        }
    }
};

// Function to change component name
function changeComponentName(component_name, new_comp_name) {
     // find the component obj
    var found_component_obj = component_list.find(function(element) { return element.name == component_name; });
    if(found_component_obj){ found_component_obj.name = new_comp_name; }
};

// Function to change transition name
function changeTransitionName(component, old_name, new_name) {
    // find the component obj
    var found_component_obj = component_list.find(function(element) { return element.name == component; });
    var found_transition_obj = found_component_obj.transition_list.find(function(element) { return element.name == old_name; });
    if (found_transition_obj){ found_transition_obj.name = new_name; }
};

// Function to change transition function
function changeTransitionFunc(component, old_func, new_func) {
    // find the component obj
    var found_component_obj = component_list.find(function(element) { return element.name == component; });
    var found_transition_obj = found_component_obj.transition_list.find(function(element) { return element.func == old_func; });
    if (found_transition_obj){ found_transition_obj.func = new_func; }
};

function changeTransitionDurationMin(component, transition_name, new_min_duration) {
    // find the component obj
    var found_component_obj = component_list.find(function(element) { return element.name == component; });
    var found_transition_obj = found_component_obj.transition_list.find(function(element) { return element.name == transition_name; });
    console.log(found_transition_obj.name + " old min duration is " + found_transition_obj.duration_min);
    if (found_transition_obj){ found_transition_obj.duration_min = new_min_duration; }
    console.log(found_transition_obj.name + " new min duration is " + found_transition_obj.duration_min);
}

function changeTransitionDurationMax(component, transition_name, new_max_duration) {
    // find the component obj
    var found_component_obj = component_list.find(function(element) { return element.name == component; });
    var found_transition_obj = found_component_obj.transition_list.find(function(element) { return element.name == transition_name; });
    console.log(found_transition_obj.name + " old max duration is " + found_transition_obj.duration_max);
    if (found_transition_obj){ found_transition_obj.duration_max = new_max_duration; }
    console.log(found_transition_obj.name + " new max duration is " + found_transition_obj.duration_max);
}

// Function to change transitions's dependency status
function changeTransitionDependencyStatus(component, transition, dependency_status) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].transition_list.length; j++) {
                if (component_list[i].transition_list[j].name == transition) {
                    component_list[i].transition_list[j].dependency = dependency_status;
                    console.log(transition + " dependency status is: " + component_list[i].transition_list[j].dependency)
                }
            }
        }
    }
};

// Function to change transition's dependency type
function changeTransitionDependencyType(component, transition, dependency_type) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].transition_list.length; j++) {
                if (component_list[i].transition_list[j].name == transition) {
                    component_list[i].transition_list[j].dependency_type = dependency_type.toUpperCase();
                    console.log(transition + " dependency type is: " + component_list[i].transition_list[j].dependency_type)
                }
            }
        }
    }
};

// Function to change stub name
function changeStubName(component, stub_name, new_stub_name) {
    // find the component obj
    var found_component_obj = component_list.find(function(element) { return element.name == component; });
    var found_dependency_obj = found_component_obj.dependency_list.find(function(element) { return element.name == stub_name; });
    if (found_dependency_obj){ found_dependency_obj.name = new_stub_name; }
};
