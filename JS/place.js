// Add new place function, should only be called by component
function addNewPlace(component_group, component, placePos, component_obj, tooltipLayer, use_selection_area, provide_selection_area) {
    var index;
    if (component_obj.place_list.length == 0){
        index = 1;
    } else {
        index = component_obj.place_list[component_obj.place_list.length - 1].index + 1;
    }
    var place_obj = new Place('Place', "Place_" + index, index);
    component_obj.place_list.push(place_obj);

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

    // initial values to null 
    source_konva = null;

    // add the place_konva to place_obj
    place_obj.place_konva = place;
    // add the konva place to the component group
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

    tooltipLayer.add(tooltip);
    stage.add(tooltipLayer);

    place.on('dragend', (e) => {
        posX = snapToGrid(place.x());
        posY = snapToGrid(place.y());
        place.position({
          x: posX,
          y: posY
        });
        place_obj.posX = posX;
        place_obj.posY = posY;
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
        else if (e.evt.button === 2) {
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
                    returned_transition_obj = addNewTransition(offset, source_konva, dest_transition, source_obj, dest_obj, component_obj, component_group, component, tooltipLayer, use_selection_area, provide_selection_area);
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
        // event listener for deletion
        window.addEventListener('keydown', removePlace);
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
        // remove event listener for deletion
        window.removeEventListener('keydown', removePlace);
    });

    // return konva object back to its parent component
    return place;
};
