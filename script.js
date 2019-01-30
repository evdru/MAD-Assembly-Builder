const BrowserWindow = require('electron').remote.BrowserWindow;
const url = require('url');
const path = require('path');

var layer = "global";
var stage = "global";
let component_count = 0;
let place_count = 0;
var component_contains = [];

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

function addNewComponent(posX, posY) {
    var component = new Konva.Rect({
        x: posX - 200,
        y: posY - 125,
        width: 200,
        height: 250,
        stroke: 'black',
        strokeWidth: 0.5,
        name: 'component',
        draggable: true
    });
    layer.add(component);
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
        draggable: true
    });
    layer.add(place);
    layer.draw();

    place_count++;
};

// Drag N Drop Functions

function allowDrop(ev) {
    ev.preventDefault();
    console.log("allow drop");
};

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    console.log(data)
    var posX = ev.clientX;
    var posY = ev.clientY;
    console.log(ev.clientX)
    console.log(ev.clientY)
    if(data == "component"){
        addNewComponent(posX, posY);
    } else if (data == "place") {
        addNewPlace(posX, posY);
        addPlacePopUp();
    }
};
  
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    console.log("drag");
};

function addPlacePopUp() {
    var add_place_window = new BrowserWindow({width: 300, height: 200});
    add_place_window.loadURL(url.format({
        pathname: path.join(__dirname, 'add_place.html'),
		protocol: 'file:',
		slashes: true
	}));
    add_place_window.on('closed', function() {
        add_place_window = null;
    });
};

function addPlaceToList() {
    var place_name = document.getElementById('place_name').value;
    var new_place = new Place('Place', place_name);
    component_contains.push(new_place);
    console.log(component_contains[0].name);
};