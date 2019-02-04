const BrowserWindow = require('electron').remote.BrowserWindow;
const url = require('url');
const path = require('path');
const ipcMain = require('electron').remote.ipcMain;
const remote = require('electron').remote;

var layer = "global";
var stage = "global";
var component_list = [];
var blockSnapSize = 30;
var transition_count = 1;
var source_transition = null;
var dest_transition = null;
var source_obj = null;
var dest_obj = null;

class Component {
    
    constructor(type, name){
        this.type = type;
        this.name = name;
        this.children_list = [];
    };
};

class Place {
    constructor(type, name, index) {
        this.type = type;
        this.name = name;
        this.index = index;
    };
};

class Transition {
    constructor(type, name, src, dest, func) {
        this.type = type;
        this.name = name;
        this.src = src;
        this.dest = dest;
        this.func = func;
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
    var container = stage.container();
};

// Adds a new component to the stage
function addNewComponent(posX, posY) {
    
    // create a new component group every time a component is created
    var component_group = new Konva.Group({
        x: posX,
        y: posY,
        width: 300,
        height: 350,
        draggable: true,
        name: 'component_group'
    });

    // create the konva node
    var component = new Konva.Rect({
        x: 0,
        y: 0,
        width: 300,
        height: 350,
        stroke: 'black',
        name: 'component',
        strokeWidth: 0.5
    });

    // create a component object and add it to the global list
    var component_obj = new Component('Component', "Component_" + (component_list.length + 1));
    component_list.push(component_obj);
    console.log(component_list);

    
    component_group.add(component);
    layer.add(component_group);
    layer.draw();

    stage.on('click', function (e) {
        if (e.evt.button === 2) {
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
            var tr = new Konva.Transformer({rotateEnabled: false});
            e.target.getParent().add(tr);
            tr.attachTo(e.target);
            layer.draw();
          }
    });

    // tooltip to display name of object
    var tooltip = new Konva.Text({
        text: "",
        fontFamily: "Calibri",
        fontSize: 12,
        padding: 5,
        textFill: "white",
        fill: "black",
        alpha: 0.75,
        visible: false
    });

    var tooltipLayer = new Konva.Layer();
    tooltipLayer.add(tooltip);
    stage.add(tooltipLayer);

    // if mouse is over a component
    component.on('mousemove', function () {
        //console.log(component_obj.name + " over");
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(component_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });

    // hide the tooltip on mouse out
    component.on("mouseout", function(){
        //console.log(component_obj.name + " out");
        tooltip.hide();
        tooltipLayer.draw();
    });

    // if double click on component
    component.on('dblclick', function (e){
        console.log("dbl click on component click");
        // what is transform of parent element?
        var transform = component.getParent().getAbsoluteTransform().copy();
        // to detect relative position we need to invert transform
        transform.invert();
        // now we find relative point
        var pos = stage.getPointerPosition();
        var placePos = transform.point(pos);
        // grow component here
        var place = addNewPlace(component_group, component, placePos, component_obj);
        //layer.add(component_group);
        layer.draw();
    });
};

// Add new place function, should only be called by component
function addNewPlace(component_group, component, placePos, component_obj) {
    var index = component_obj.children_list.length;
    var place_obj = new Place('Place', "Place_" + (index + 1), index);
    component_obj.children_list.push(place_obj);
    console.log(component_obj.name + " its places are: ");
    console.log(component_obj.children_list);

    var place = new Konva.Circle({
        x: placePos.x,
        y: placePos.y,
        radius: 30,
        stroke: 'black',
        strokeWidth: 1,
        fill: 'white',
        name: 'place',
        ShadowBlur: 1,
        draggable: true,
        dragBoundFunc: function(pos) {
            var X = pos.x;
            var Y = pos.y;
            // get min and max based on its parent component
            var minX = component.getAbsolutePosition().x;
            var maxX = minX + (component.getWidth() * component.scaleX());
            var minY = component.getAbsolutePosition().y;
            var maxY = minY + (component.getHeight() * component.scaleY());
            if (X < minX) {
                X = minX;
              }
            if (X > maxX) {
                X = maxX;
            }
            if (Y < minY) {
                Y = minY;
            }
            if (Y > maxY) {
                Y = maxY;
            }
            return ({
                x: X,
                y: Y
            });
        }
    });

    component_group.add(place);

    // tooltip to display name of object
    var tooltip = new Konva.Text({
        text: "",
        fontFamily: "Calibri",
        fontSize: 12,
        padding: 5,
        textFill: "white",
        fill: "black",
        alpha: 0.75,
        visible: false
    });

    var tooltipLayer = new Konva.Layer();
    tooltipLayer.add(tooltip);
    stage.add(tooltipLayer);

    place.on('dragend', (e) => {
        place.position({
          x: Math.round(place.x() / blockSnapSize) * blockSnapSize,
          y: Math.round(place.y() / blockSnapSize) * blockSnapSize
        });
        layer.batchDraw();
    });

    // if mouse is over a place
    place.on('mousemove', function () {
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(component_obj.name + " - " + place_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });

    // if a click over place occurs
    place.on("click", function(e){
        if (e.evt.button === 0){
            // first left click set source
            console.log("Left clicked place: ", place_obj.name);
            source_transition = place;
            source_obj = place_obj;
        }
        if (e.evt.button === 2) {
            // first right click set dest
            console.log("Right clicked place: ", place_obj.name);
            dest_transition = place;
            dest_obj = place_obj;
            if(source_transition != null & source_obj.index < dest_obj.index){
                console.log("Source was assigned prior");
                console.log("Source has a lower index than dest");
                transition = addNewTransition(source_transition, dest_transition, source_obj, dest_obj, component_obj, component_group);
                // move transition below its source and dest
                transition.moveToBottom();
                layer.draw();
            } else {
                source_transition = null;
                dest_transition = null;
            }
        }
    });

    // when place is being dragged
    place.on('dragmove', (e) => {
        tooltip.hide();
        if(place = dest_transition){
            adjustPoint(e);
        }
        else if (place = source_transition){
            adjustPoint(e);
        }
    });

    // hide the tooltip on mouse out
    place.on("mouseout", function(){
        tooltip.hide();
        tooltipLayer.draw();
    });

    function adjustPoint(e){
        var p=[source_transition.getX(), source_transition.getY(), dest_transition.getX(), dest_transition.getY()];
        transition.setPoints(p);
        layer.draw();
    }
  
    // return konva object back to its parent component
    return place;
};

// function that adds new transition obj and konva arrow
function addNewTransition(source_konva, dest_konva, source_obj, dest_obj, component_obj, component_group){
    var transition_obj = new Transition('Transition', "Transition_" + transition_count, source_obj, dest_obj, "default function");
    component_obj.children_list.push(transition_obj);
    transition_count++;
    console.log(component_obj.name + " its elements are: ");
    console.log(component_obj.children_list);

    var transition = new Konva.Line({
        points: [source_konva.getX(), source_konva.getY(), dest_konva.getX(), dest_konva.getY()],
        stroke: 'black',
        strokeWidth: 1
      });

    // add transition konva obj to component group
    component_group.add(transition);

    return transition;
}

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
});

function closeAddPlaceWindow() {
    var window = remote.getCurrentWindow();
    window.close();
};
