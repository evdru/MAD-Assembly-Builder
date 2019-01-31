const BrowserWindow = require('electron').remote.BrowserWindow;
const url = require('url');
const path = require('path');
const ipcMain = require('electron').remote.ipcMain;
const remote = require('electron').remote;

var layer = "global";
var stage = "global";
let component_count = 0;
let place_count = 0;
var component_list = [];
var mouse_over_component = true;

class Component {
    constructor(type, name){
        this.type = type;
        this.name = name;
    }
}

class Place {
    constructor(type, name) {
        this.type = type;
        this.name = name;
    };
};

class Transition {
    constructor(type, name, from_place, to_place, function_name) {
        this.type = type;
        this.name = name;
        this.from_place = from_place;
        this.to_place = to_place;
        this.function_name = function_name;
    };
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
};

// Adds a new component to the stage
function addNewComponent(posX, posY) {
    // create the konva node
    var component = new Konva.Rect({
        x: posX - 200,
        y: posY - 125,
        width: 300,
        height: 350,
        stroke: 'black',
        strokeWidth: 0.5,
        name: 'component',
        draggable: true
    });

    // create a new component group every time a component is created
    var component_group = new Konva.Group({});
    component_group.add(component);
    layer.add(component_group);
    layer.draw();

    component_count++;

    stage.on('click tap', function (e) {
        // if click on empty area - remove all transformers
        if (e.target === stage) {
            stage.find('Transformer').destroy();
            layer.draw();
            return;
        }
        // do nothing if clicked NOT on our rectangles
        if (!e.target.hasName('component')) {
            return;
        }
        // remove old transformers
        // TODO: we can skip it if current rect is already selected
        stage.find('Transformer').destroy();
    
        // create new transformer
        var tr = new Konva.Transformer();
        layer.add(tr);
        tr.attachTo(e.target);
        layer.draw();
    });

    // if mouse is over a component
    component.on('mouseenter', function () {
        //console.log("mouse enter component");
        mouse_over_component = true;
    });

    // if double click on component
    component.on('dblclick', function (){
        console.log("dbl click on component");
        // grow component here
        var posX = component.position().x + 260;
        var posY = component.position().y + 175;
        component_group.add(addNewPlace(posX, posY));
        addPlacePopUp();
        layer.add(component_group);
        layer.draw();
    })

    // if mouse leeaves a component
    component.on('mouseout', function () {
        //console.log("mouse out component");
        mouse_over_component = false;
    })
};

function addNewPlace(posX, posY) {
    var place = new Konva.Circle({
        x: posX - 115,
        y: posY,
        radius: 30,
        stroke: 'black',
        strokeWidth: 1,
        fill: 'white',
        name: 'place',
        ShadowBlur: 1,
        draggable: true
    });
    place_count++;
    return place;
};

// Drag N Drop Functions

function allowDrop(ev) {
    ev.preventDefault();
    console.log("allow drop");
};

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var posX = ev.clientX;
    var posY = ev.clientY;
    if(data == "component"){
        addNewComponent(posX, posY);
    } else if (data == "place") {
        if(mouse_over_component){
            addNewPlace(posX, posY);
            addPlacePopUp();
        }
    }
};
  
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
};

// Add place to list functions
let add_place_window;

function addPlacePopUp() {
    add_place_window = new BrowserWindow({width: 300, height: 200, title: 'Add New Place'});
    add_place_window.loadURL(url.format({
        pathname: path.join(__dirname, 'add_place.html'),
		protocol: 'file:',
		slashes: true
    }));
    //Garbage collection handle
    add_place_window.on('closed', function() {
        add_place_window = null;
    });
};

// Catch place:add
ipcMain.on('place:add', function(e, place) {
    var place = new Place('Place', place);
    component_list.push(place);
    console.log(component_list);
});

function closeAddPlaceWindow() {
    var window = remote.getCurrentWindow();
    window.close();
};
