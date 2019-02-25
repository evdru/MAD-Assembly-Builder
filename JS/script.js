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
const max_transition_count = 3; // const global max transition count coming out of any one place

class Component {
    constructor(type, name){
        this.type = type;
        this.name = name;
        this.place_list = [];
        this.component_group_konva;
        this.transition_list = [];
        this.transition_dictionary = {};
        this.dependency_list = [];
    };
};

class Place {
    constructor(type, name, index) {
        this.type = type;
        this.name = name;
        this.index = index;
        this.place_konva;
        this.transition_count = 0; // 3 max
        this.dependency_count = 0; // 3 max
        this.dependency = false;
        this.dependency_type = '';
        this.dependency_konva_list = [];
        this.transition_outbound_list = [];
        this.transition_inbound_list = [];
    };
};

class Transition {
    constructor(type, name, src, tran_konva, dest, func) {
        this.type = type;
        this.name = name;
        this.src = src;
        this.tran_group_konva;
        this.dest = dest;
        this.func = func;
        this.dependency_count = 0; // 3 max
        this.dependency = false;
        this.dependency_type = '';
        this.dependency_konva_list = [];
    };
};

class Dependency {
    constructor(type, name) {
        this.type = type;
        this.name = name;
        this.dep_group_konva;
        this.dep_stub_konva;
        this.source_obj;
        this.connection_obj;
    };
};

class Connection {
    constructor() {
        this.connection_group_konva;
        this.gate1_konva;
        this.gate2_konva;
        this.enabled = false;
        this.provide_port_obj;
        this.use_port_obj;
    }
};

function snapToGrid(pos){
    return Math.round(pos / blockSnapSize) * blockSnapSize;
};

function initialize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height
    });
    
    layer = new Konva.Layer();
    stage.add(layer);
    var container = stage.container();
};

// Drag N Drop Functions

function allowDrop(ev) {
    ev.preventDefault();
    console.log("allow drop");
};

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var posX = ev.clientX - 270;
    var posY = ev.clientY - 180;
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

// remove the place obj from the component_obj's place list
function removePlaceObj(component_obj, place_obj){
    console.log("Before " + component_obj.place_list);
    // find index of component in component_list and remove
    component_obj.place_list.splice( component_obj.place_list.indexOf(place_obj), 1 );
    console.log("After " + component_obj.place_list);

    // remove all dependencies belonging to this place
    for(var i = 0; i < component_obj.dependency_list.length; i++){
        // if this dependency belongs to place obj
        if(component_obj.dependency_list[i].source_obj == place_obj){
            // destroy konva dependency group first
            component_obj.dependency_list[i].dep_group_konva.destroy();
            // remove dependency obj from list
            removeDependencyObj(component_obj, component_obj.dependency_list[i]);
        }
    }
};

// function gets called when a place is deleted
function removeOutboundAndInboundTransitions(component_obj, place_obj){
    // remove all inbound transitions from this place_obj
    if(place_obj.transition_inbound_list.length > 0){
        for (var i = 0; i < place_obj.transition_inbound_list.length; i++){
            place_obj.transition_inbound_list[i].tran_group_konva.destroy();
            removeTransitionObj(component_obj, place_obj.transition_inbound_list[i]);
        }
    }
    if(place_obj.transition_outbound_list.length > 0){
        // remove all outbound transitions from this place_obj
        for (var i = 0; i < place_obj.transition_outbound_list.length; i++){
            // destroy the konva transition group
            place_obj.transition_outbound_list[i].tran_group_konva.destroy();
            // remove the transition obj
            removeTransitionObj(component_obj, place_obj.transition_outbound_list[i]);
        }
    }
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

// func to remove the dependency obj from its global comp_obj.depedency_list
function removeDependencyObj(component_obj, dependency_obj){
    // check if dependency has a connection with it
    if(dependency_obj.connection_obj){
        console.log("its removing connection")
        removeConnectionObj(dependency_obj.connection_obj);
        removeConnectionKonva(dependency_obj);
    }
    console.log("Before " + component_obj.dependency_list);
    // find index of dependency_obj in component_list.dependency_list and remove
    component_obj.dependency_list.splice( component_obj.dependency_list.indexOf(dependency_obj), 1 );
    console.log("After " + component_obj.dependency_list);
};

function removeConnectionObj(connection_obj){
    // set opacity to 0 for dependencies
    connection_obj.provide_port_obj.dep_stub_konva.opacity(0);
    connection_obj.use_port_obj.dep_stub_konva.opacity(0);
    // remove connection from connection list
    connection_list.splice( connection_list.indexOf(connection_obj), 1 );
}

// function to remove connection konva group
function removeConnectionKonva(dependency_obj){
    // change opacity of provide and use ports
    // dependency_obj.connection_obj.provide_port_obj.dep_group_konva.provide_symbol.opacity(0);
    // dependency_obj.connection_obj.use_port_obj.dep_group_konva.use_stub_konva.opacity(0);

    // destroy the connection group
    dependency_obj.connection_obj.connection_group_konva.destroy();
}

// Function to change component name
function changeComponentName(component_name, new_comp_name) {
     // find the component obj
    var found_component_obj = component_list.find(function(element) {
        return element.name == component_name;
    });
    if(found_component_obj){
        found_component_obj.name = new_comp_name;
    }
};

function removeComponentObj(component_obj) {
    // check if connection is connected to this component
    for (var i = 0; i < connection_list.length; i++) {
        if(connection_list[i].provide_port_obj.component_obj == component_obj){
            removeConnectionKonva(connection_list[i].provide_port_obj);
            removeConnectionObj(connection_list[i]);
        }
        if (connection_list[i].use_port_obj.component_obj == component_obj){
            removeConnectionKonva(connection_list[i].use_port_obj);
            removeConnectionObj(connection_list[i]);
        }
    }
    console.log("Before " + component_list);
    // find index of component in component_list and remove
    component_list.splice( component_list.indexOf(component_obj), 1 );
    console.log("After " + component_list);
};

// Function to change transition name
function changeTransitionName(component, old_name, new_name) {
    // find the component obj
    var found_component_obj = component_list.find(function(element) {
        return element.name == component;
        });
    var found_transition_obj = found_component_obj.transition_list.find(function(element) {
        return element.name == old_name;
        });
    if (found_transition_obj){
        found_transition_obj.name = new_name;
    }
};

// Function to change transition function
function changeTransitionFunc(component, old_func, new_func) {
    console.log("Changing func name in script.js");
    console.log(component);
    console.log(old_func);
    console.log(new_func);
    // find the component obj
    var found_component_obj = component_list.find(function(element) {
        return element.name == component;
        });
    var found_transition_obj = found_component_obj.transition_list.find(function(element) {
        return element.func == old_func;
        });
    if (found_transition_obj){
        found_transition_obj.func = new_func;
    }
};

function removeTransitionObj(component_obj, transition_obj) {
    // remove all dependencies belonging to this transition_obj
    for(var i = 0; i < component_obj.dependency_list.length; i++){
        // if this dependency belongs to transition_obj
        if(component_obj.dependency_list[i].source_obj == transition_obj){
            // destroy konva dependency group first
            component_obj.dependency_list[i].dep_group_konva.destroy();
            // remove dependency obj from list
            removeDependencyObj(component_obj, component_obj.dependency_list[i]);
            layer.batchDraw();
        }
    }
    // check the transition dictionary for parallel transitions
    if(component_obj.transition_dictionary[transition_obj.src.name + transition_obj.dest.name] > 0){
        console.log("Decrementing dictionary keys")
        // decrement the trans dict 
        component_obj.transition_dictionary[transition_obj.src.name + transition_obj.dest.name]--;
    }
    // decrement the transition count of source
    transition_obj.src.transition_count--;
    // find index of component in component_list and remove
    component_obj.transition_list.splice( component_obj.transition_list.indexOf(transition_obj), 1 );
};

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
    var found_component_obj = component_list.find(function(element) {
        return element.name == component;
        });
    var found_dependency_obj = found_component_obj.dependency_list.find(function(element) {
        return element.name == stub_name;
        });
    if (found_dependency_obj){
        found_dependency_obj.name = new_stub_name;
    }
};
