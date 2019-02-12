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

class Component {
    constructor(type, name){
        this.type = type;
        this.name = name;
        this.place_list = [];
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
        this.transition_count = 0;
        this.dependency = true;
        this.dependency_type = 'Data';
        this.provide_dependency_list = [];
    };
};

class Transition {
    constructor(type, name, src, dest, func) {
        this.type = type;
        this.name = name;
        this.src = src;
        this.dest = dest;
        this.func = func;
        this.dependency = true;
        this.dependency_type = 'Data';
        this.use_dependency_list = [];
    };
};

class Dependency {
    constructor(type, name) {
        this.type = type;
        this.name = name;
    }
}

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

//Function to change component name
function changeComponentName(component, new_comp_name) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            component_list[i].name = new_comp_name;
        }
    }
};

//Function to change transition details
function changeTransitionDetails(component, old_name, new_name, old_func, new_func) {
    for (var i = 0; i < component_list.length; i++) {
        if (component_list[i].name == component) {
            for (var j = 0; j < component_list[i].transition_list.length; j++) {
                if (component_list[i].transition_list[j].name == old_name) {
                    component_list[i].transition_list[j].name = new_name;
                }
                if (component_list[i].transition_list[j].func == old_func) {
                    component_list[i].transition_list[j].func = new_func;
                }
            }
        }
    }
};
