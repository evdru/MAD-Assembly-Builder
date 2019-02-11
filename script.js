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
    };
};

class Place {
    constructor(type, name, index) {
        this.type = type;
        this.name = name;
        this.index = index;
        this.transition_count = 0;
        this.dependency = true;
        this.dependency_type;
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
        this.dependency_type;
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
    
    component_group.add(component);
    layer.add(component_group);
    layer.draw();

    stage.on('click', function (e) {
        if (e.evt.button === 0) {
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

    // when component is being dragged
    component_group.on('dragmove', (e) => {
        tooltip.hide();
        tooltipLayer.draw();
    });

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
        component.stroke('black');
        component.strokeWidth(1);
        tooltip.hide();
        tooltipLayer.draw();
        layer.draw();
    });

    // if double click on component
    component.on('dblclick', function (e){
        if (e.evt.button === 0){
            console.log("dbl left click on component click");
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
        }
    });

    component.on("click", function(e){
        if (e.evt.button === 2){
            // highlight the component
            component.stroke('blue');
            component.strokeWidth(3);
            component.draw();
            // open window for editing
            console.log("Open window for editing component details");
            ipcRenderer.send("change_component_details", {component: component_obj.name});
        };
    });

    // Catch new component name from ipcMain
    ipcRenderer.on("component->renderer", function(event, args) {
        changeComponentName(args.component, args.name);
    });
};

// Add new place function, should only be called by component
function addNewPlace(component_group, component, placePos, component_obj) {
    var index = component_obj.place_list.length;
    var place_obj = new Place('Place', "Place_" + (index + 1), index);
    component_obj.place_list.push(place_obj);

    var place = new Konva.Circle({
        x: placePos.x,
        y: placePos.y,
        radius: 30,
        stroke: 'black',
        strokeWidth: 1,
        fill: 'white',
        name: 'place',
        text: 'place',
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
          x: snapToGrid(place.x()),
          y: snapToGrid(place.y())
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
            // get its component parent
            source_component = component_obj;
            source_transition = place;
            source_obj = place_obj;
            // highlight selection
            highlighted = true;
            place.stroke('blue');
            place.strokeWidth(5);
            place.draw();
        }
        if (e.evt.button === 2) {
            // first right click set dest
            console.log("Right clicked place: ", place_obj.name);
            dest_component = component_obj;
            dest_transition = place;
            dest_obj = place_obj;
            console.log("Source has been selected");
            if(source_transition != null){
                // check the index and both places are in same component
                if(source_obj.index < dest_obj.index && source_component == dest_component){
                    var offset = 0;
                    // check if this source -> dest combo has been added prior
                    if(source_component.transition_dictionary[source_obj.name + dest_obj.name]){
                        // set offset based on its value in the dictionary
                        if(source_component.transition_dictionary[source_obj.name + dest_obj.name] == 1){
                            offset = 30;
                            // iterate the count for this transition
                            source_component.transition_dictionary[source_obj.name + dest_obj.name] = 2;
                        } else if (source_component.transition_dictionary[source_obj.name + dest_obj.name] == 2){
                            offset = -30;
                        }
                    } else {
                        // add the source -> dest combo into the components dictionary
                        source_component.transition_dictionary[source_obj.name + dest_obj.name] = 1;
                    }

                    console.log("Source place transition out count: ", source_obj.transition_count);
                    transition = addNewTransition(offset, source_transition, dest_transition, source_obj, dest_obj, component_obj, component_group, component);
                } 
            } else {
                // highlight the place
                highlighted = true;
                place.stroke('blue');
                place.strokeWidth(3);
                place.draw();
                // right clk source was not selected, open window for editing
                console.log("Open window for editing place details");
                ipcRenderer.send("change_place_details", {component: component_obj.name, place: place_obj.name});
            }
            source_transition = null;
            dest_transition = null;
        }
    });

    // when place is being dragged
    place.on('dragmove', (e) => {
        tooltip.hide();
    });

    // changes the cursor to hand pointer
    place.on("mouseenter", function(){
        stage.container().style.cursor = 'pointer';
        // checks if this place is valid
        if(source_transition != null && source_obj.index < place_obj.index && source_component == component_obj){
            highlighted = true;
            place.stroke('green');
            place.strokeWidth(3);
            place.draw();
        } else if (source_transition != null && source_obj.index >= place_obj.index && source_component == component_obj){
            highlighted = true;
            place.stroke('red');
            place.strokeWidth(3);
            place.draw();
        }
    });

    // changes the cursor back to default
    place.on('mouseleave', function () {
        stage.container().style.cursor = 'default';
        // changes the stroke and stroke width back to default if highlighted
        if(highlighted == true){
            place.stroke('black');
            place.strokeWidth(1);
            layer.draw();
            highlighted = false;
        } 
    });

    // hide the tooltip on mouse out
    place.on("mouseout", function(){
        tooltip.hide();
        tooltipLayer.draw();
    });

    // Catch new place name from ipcMain
    ipcRenderer.on("place->renderer", function(event, args) {
        changePlaceName(args.component, args.place, args.name);
    });

    // create dependency here
    if(place_obj.dependency == true){
        console.log("Creating provide dependency");
        dependency = addNewDependency(component, place, place_obj, component_obj, component_group);
    }
    // return konva object back to its parent component
    return place;
};

// function that adds new transition obj and konva arrow
function addNewTransition(offset, source_konva, dest_konva, source_obj, dest_obj, component_obj, component_group, component){

    // max number of transitions out of the same source = 3
    if(source_obj.transition_count >= 3){
        alert("Cant create more than 3 transitions from " + source_obj.name);
        return;
    }

    var transition_obj = new Transition('Transition', "Transition_" + (component_obj.transition_list.length + 1), source_obj, dest_obj, "defaultFunction_" + (component_obj.transition_list.length + 1));
    component_obj.transition_list.push(transition_obj);
    
    var transition = new Konva.Line({
        points: [source_konva.getX(), source_konva.getY(), ((source_konva.getX() + dest_konva.getX()) / 2) + offset, (source_konva.getY() + dest_konva.getY()) / 2, dest_konva.getX(), dest_konva.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: transition_obj.name,
        tension: 1
    });

    var transition_selection_area = new Konva.Circle({
        x: ((source_konva.getX() + dest_konva.getX()) / 2) + offset,
        y: (source_konva.getY() + dest_konva.getY()) / 2,
        radius: 15,
        opacity: 0,
        text: transition.name,
        name: 'transition_hover'
    });

    // add transition konva obj to component group
    component_group.add(transition);
    component_group.add(transition_selection_area);

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

    // source place is moved update the transitions that are connected to it
    source_konva.on('dragmove', (e) => {
        transition.setPoints([snapToGrid(source_konva.getX()), 
                              snapToGrid(source_konva.getY()),
                              snapToGrid(((source_konva.getX() + dest_konva.getX()) / 2) + offset),
                              snapToGrid(source_konva.getY() + dest_konva.getY()) / 2,
                              snapToGrid(dest_konva.getX()), 
                              snapToGrid(dest_konva.getY())]);
        transition_selection_area.position({
            x: snapToGrid(((source_konva.getX() + dest_konva.getX()) / 2) + offset),
            y: snapToGrid((source_konva.getY() + dest_konva.getY()) / 2)
        });
        layer.draw();
    });

    // destination place is moved update the transitions that are connected to it
    dest_konva.on('dragmove', (e) => {
        transition.setPoints([snapToGrid(source_konva.getX()), 
                              snapToGrid(source_konva.getY()),
                              snapToGrid(((source_konva.getX() + dest_konva.getX()) / 2) + offset),
                              snapToGrid(source_konva.getY() + dest_konva.getY()) / 2,
                              snapToGrid(dest_konva.getX()),
                              snapToGrid(dest_konva.getY())]);
        transition_selection_area.position({
            x: snapToGrid(((source_konva.getX() + dest_konva.getX()) / 2) + offset),
            y: snapToGrid((source_konva.getY() + dest_konva.getY()) / 2)
        });
        layer.draw();
    });

    transition_selection_area.on('moveenter', function(){
        stage.container().style.cursor = 'pointer';
    });

    // if mouse is over a place
    transition_selection_area.on('mousemove', function () {
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(component_obj.name + " - " + transition_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });

    // hide the tooltip on mouse out
    transition_selection_area.on('mouseout', function(){
        stage.container().style.cursor = 'default';
        transition.stroke('black');
        transition.strokeWidth(1);
        tooltip.hide();
        tooltipLayer.draw();
        layer.draw();
    });

    transition_selection_area.on("click", function(e){
        if (e.evt.button === 2){
            // highlight the transition
            transition.stroke('blue');
            transition.strokeWidth(3);
            transition.draw();
            //open window for editing transition
            console.log("Open window for editing transition details");
            ipcRenderer.send("change_transition_details", {component: component_obj.name, transition: transition_obj.name, function: transition_obj.func});
        };
    });

    // Catch new transition details from ipcMain
    ipcRenderer.on("transition->renderer", function(event, args) {
        changeTransitionDetails(args.component, args.transition, args.name, args.old_func, args.new_func);
        console.log(args.component)
        console.log(args.transition)
        console.log(args.name)
        console.log(args.old_func)
        console.log(args.new_func)
    });

    // move transition below its source and dest
    transition.moveToBottom();
    source_obj.transition_count++;
    layer.draw();
    
    // create dependency here
    if(transition_obj.dependency == true){
        console.log("Creating use dependency");
        dependency = addNewDependency(component, transition_selection_area, transition_obj, component_obj, component_group);
    }

    return transition;
}


// Add new dependency function, should only be called by place and transition
function addNewDependency(component, source_element, source_obj, component_obj, component_group) {

    var pos_x;
    var offset;
    console.log(source_element.getX());
    // provide connection
    if(source_obj.type == 'Place'){
        pos_x = (component.getX() + component.getWidth()) * component.scaleX();
        offset = 20;
    } else {
        // use connection
        pos_x = component.getX();
        offset = -20;
    }

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), pos_x, source_element.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'dependency',
        tension: 0,
        dash: [10, 5],
        listening: true
    });

    var stub = new Konva.Circle({
        x: dependency.points()[2] + offset,
        y: dependency.points()[3],
        radius: 10,
        stroke: 'black',
        strokeWidth: 1,
        fill: 'black',
        name: 'stub',
        ShadowBlur: 1,
        listening: true
    });

    // when the source element moves
    source_element.on('xChange yChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              pos_x * component.scaleX(),
                              source_element.getY()]);
        stub.position({
            x: dependency.points()[2] + offset,
            y: dependency.points()[3]
        });
        layer.draw();
    });

    // if a click over stub
    stub.on("click", function(e){
        if (e.evt.button === 0){
            // first left click
            console.log("Left clicked stub: ", source_element.name);
        };
    });

    component_group.add(stub);
    component_group.add(dependency);
    dependency.moveToBottom();
    layer.draw();
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
