const BrowserWindow = require('electron').remote.BrowserWindow;
const url = require('url');
const path = require('path');
const ipcMain = require('electron').remote.ipcMain;
const remote = require('electron').remote;
const ipcElectron = require('electron').ipcRenderer;

var layer = "global";
var stage = "global";
var component_list = [];
var blockSnapSize = 10;
var source_transition = null;
var dest_transition = null;
var source_obj = null;
var dest_obj = null;
var highlighted = false;

// @todo: add fields
// [x] int: posX, posY
// [x] ?: component_group
// [ ] Rect: component
// [ ] Component: component_obj
// [ ] Layer: tooltipLayer
class Component {
    constructor(type, name, posX, posY, group){
        this.type = type;
        this.name = name;
        this.place_list = [];
        this.transition_list = [];
        this.transition_dictionary = {};
        this.dependency_list = [];
        this.posX = posX;
        this.posY = posY;
        this.group = group;
    };
};

// @todo: add fields
// [ ] ?: offset
// [ ] Circle: circle
// [ ] ?: placePos

class Place {
    constructor(type, name, index, pos) {
        this.type = type;
        this.name = name;
        this.index = index;
        this.transition_count = 0;
        this.dependency = false;
        this.dependency_type = '';
        this.provide_dependency_list = [];
        this.pos = pos;
    };
};

// @todo: add fields
// [ ] Circle: source_konva
// [ ] Circle: dest_konva
class Transition {
    constructor(type, name, src, dest, func) {
        this.type = type;
        this.name = name;
        this.src = src;
        this.dest = dest;
        this.func = func;
        this.dependency = false;
        this.dependency_type = '';
        this.use_dependency_list = [];
    };
};

class Dependency {
    constructor(type, name) {
        this.type = type;
        this.name = name;
    };
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

// Function to change place name
function changePlaceName(component, place, new_place_name) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].place_list.length; j++) {
                if (component_list[i].place_list[j].name == place) {
                    component_list[i].place_list[j].name = new_place_name;
                }
            }
        }
    }
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
function changeComponentName(component, new_comp_name) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            component_list[i].name = new_comp_name;
        }
    }
};

// Function to change transition name
function changeTransitionName(component, old_name, new_name) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].transition_list.length; j++) {
                if (component_list[i].transition_list[j].name == old_name) {
                    component_list[i].transition_list[j].name = new_name;
                }
            }
        }
    }
};

// Function to change transition function
function changeTransitionFunc(component, old_func, new_func) {
    console.log("Changing func name in script.js");
    console.log(component);
    console.log(old_func);
    console.log(new_func);
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].transition_list.length; j++) {
                if (component_list[i].transition_list[j].func == old_func) {
                    component_list[i].transition_list[j].func = new_func;
                }
            }
        }
    }
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
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].dependency_list.length; j++) {
                if (component_list[i].dependency_list[j].name == stub_name) {
                    component_list[i].dependency_list[j].name = new_stub_name;
                }
            }
        }
    }
};
