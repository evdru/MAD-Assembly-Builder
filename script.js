const BrowserWindow = require('electron').remote.BrowserWindow;
const url = require('url');
const path = require('path');
const ipcMain = require('electron').remote.ipcMain;
const remote = require('electron').remote;

var layer = "global";
var stage = "global";
var component_list = [];

class Component {
    
    constructor(type, name){
        this.type = type;
        this.name = name;
        this.children_list = [];
    };
};

class Place {
    constructor(type, name) {
        this.type = type;
        this.name = name;
    };
};

class Transition {
    constructor(type, name, source, dest) {
        this.type = type;
        this.name = name;
        this.source = source;
        this.dest = dest;
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
        name: 'component',
        strokeWidth: 0.5,
        draggable: true
    });

    // create a component object and add it to the global list
    var component_obj = new Component('Component', "Component " + (component_list.length + 1));
    component_list.push(component_obj);
    console.log(component_list);

    // create a new component group every time a component is created
    var component_group = new Konva.Group({});
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
            var tr = new Konva.Transformer();
            layer.add(tr);
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
    component.on('dblclick', function (){
        console.log("dbl click on component");
        // grow component here
        var posX = component.position().x + 260;
        var posY = component.position().y + 175;
        var place = addNewPlace(posX, posY, component_obj);
        component_group.add(place);
        layer.add(component_group);
        layer.draw();
    })
};

// Add new place function, should only be called by component
function addNewPlace(parentX, parentY, component_obj) {
    var place_obj = new Place('Place', "Place " + (component_obj.children_list.length + 1));
    component_obj.children_list.push(place_obj);
    console.log(component_obj.name + " its places are: ");
    console.log(component_obj.children_list);

    // spawn the place at current pointer position
    var mousePos = stage.getPointerPosition();
    var place = new Konva.Circle({
        x: mousePos.x,
        y: mousePos.y,
        radius: 30,
        stroke: 'black',
        strokeWidth: 1,
        fill: 'white',
        name: 'place',
        ShadowBlur: 1,
        draggable: true
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

    // if mouse is over a place
    place.on('mousemove', function () {
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(place_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });

    // hide the tooltip on mouse out
    place.on("mouseout", function(){
        tooltip.hide();
        tooltipLayer.draw();
    });
    // return konva object back to its parent component
    return place;
};

function addNewTransition(source, dest, component_obj){

    var transition_obj = new Place('Transition',"Transition " + (component_obj.children_list.length + 1),source, dest);
    component_obj.children_list.push(transition_obj);
    console.log(component_obj.name + " its elements are: ");
    console.log(component_obj.children_list);
}

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
