// Add new place function, should only be called by component
function addNewPlace(component_obj, placePos) {

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
            var minX = component_obj.konva_component.getAbsolutePosition().x;
            var maxX = minX + (component_obj.konva_component.getWidth() * component_obj.konva_component.scaleX());
            var minY = component_obj.konva_component.getAbsolutePosition().y;
            var maxY = minY + (component_obj.konva_component.getHeight() * component_obj.konva_component.scaleY());
            if(X < minX) { X = minX; }
            if(X > maxX) { X = maxX; }
            if(Y < minY) { Y = minY; }
            if(Y > maxY) { Y = maxY; }
            return ( { x: X, y: Y } );
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

    component_obj.tooltipLayer.add(tooltip);
    stage.add(component_obj.tooltipLayer);

    // create place object
    var place_obj = new Place('Place', "Place_" + generateNextIndex(component_obj.place_list));
    place_obj.index = generateNextIndex(component_obj.place_list);
    place_obj.place_konva = place;

    component_obj.component_group_konva.add(place);
    component_obj.place_list.push(place_obj);

    // initial values to null 
    selected_source = null;
    selected_source_comp = null;
    selected_dest = null;
    selected_dest_comp = null;

    // event: place left-click
    place.on("click", function(e) {

        if(e.evt.button === 0) {
            
            selected_source_comp = component_obj;

            selected_source = place_obj;

            // highlight selection
            highlighted = true;
            place.stroke('blue');
            place.strokeWidth(5);
            place.draw();
        }

    });

    // event: place right click, source not selected
    place.on("click", function(e) {

        if(e.evt.button === 2 && selected_source == null) {

            // highlight the place
            highlighted = true;
            place.stroke('blue');
            place.strokeWidth(3);
            place.draw();

            ipcRend.send("change_place_details", {component: component_obj.name, place: place_obj.name});

        }

    });

    // event: place right click, source selected
    place.on("click", function(e) {

        if(e.evt.button === 2 && selected_source != null) {

            selected_dest_comp = component_obj;
            selected_dest = place_obj;

            if(validTransition(selected_source, selected_source_comp, selected_dest, selected_dest_comp)) {
                returned_transition_obj = addNewTransition(component_obj, selected_source, selected_dest);
            }

            selected_source = null;
            selected_source_comp = null;
            selected_dest = null;
            selected_dest_comp = null;

        }

    });

    // event: drag a place
    place.on('dragend', (e) => {

        place.position({

            x: snapToGrid(place.x()),
            y: snapToGrid(place.y())

        });

        layer.batchDraw();

    });

    // event: mouse over place
    place.on('mousemove', function () {

        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });

        tooltip.text(component_obj.name + " - " + place_obj.name);
        tooltip.show();

        component_obj.tooltipLayer.batchDraw();

    });

    // event: place is being dragged
    place.on('dragmove', (e) => {

        tooltip.hide();

    });

    // event: mouse enter
    place.on("mouseenter", function() {

        stage.container().style.cursor = 'pointer';

        if(selected_source != null && selected_source.index < place_obj.index && selected_source_comp == component_obj) {

            highlighted = true;
            place.stroke('green');
            place.strokeWidth(3);
            place.draw();

        } else if(selected_source != null && selected_source.index >= place_obj.index && selected_source_comp == component_obj) {

            highlighted = true;
            place.stroke('red');
            place.strokeWidth(3);
            place.draw();

        }

        // event listener for deletion
        window.addEventListener('keydown', removePlace);

    });

    // event: mouse leaves place
    place.on('mouseleave', function () {

        stage.container().style.cursor = 'default';

        // changes the stroke and stroke width back to default if highlighted
        if(highlighted == true) {

            place.stroke('black');
            place.strokeWidth(1);
            layer.batchDraw();
            highlighted = false;

        }

    });

    // event: mouse out 
    place.on("mouseout", function() {

        tooltip.hide();
        component_obj.tooltipLayer.draw();

        // remove event listener for deletion
        window.removeEventListener('keydown', removePlace);

    });

    // event: provide selection area right-click
    component_obj.provide_selection_area.on("click", function(e) {

        if(e.evt.button === 2 && selected_source != null) {

            selected_source.dependency = true;

            var type = ipcRend.sendSync("set_dependency_type");

            if(type == 'service') {
                selected_source.dependency_type = 'PROVIDE'
            } else if(type == 'data') {
                selected_source.dependency_type = 'DATA_PROVIDE'
            }

            createDependencyPort(selected_source_comp, selected_source);

            selected_source = null;
            selected_source_comp = null;

        }

    });

    // event: provide selection area mouse over
    component_obj.provide_selection_area.on("mouseover", function() {

        // if source konva has been selected show green provide selection area on mouse enter
        if(selected_source != null) {

            component_obj.provide_selection_area.fill('green');
            component_obj.provide_selection_area.opacity(1);
            layer.batchDraw();

        }

    });

    // event: provide selection area mouse out
    component_obj.provide_selection_area.on("mouseout", function() {

        // if provide selection area was visible, hide it!
        if(component_obj.provide_selection_area.opacity() === 1) {

            component_obj.provide_selection_area.opacity(0);
            layer.batchDraw();

        }

    });

    function removePlace(ev) {

        // keyCode Delete key = 46
        if(ev.keyCode === 46 || ev.keyCode == 8) {

            if(confirm('Are you sure you want to delete this Place?')) {

                // Delete it!
                place.destroy();
                tooltip.destroy();
                layer.draw();

                selected_source = null;
                selected_source_comp = null;
                selected_dest = null;
                selected_dest_comp = null;

                // remove all transitions that are connected to this place
                removeOutboundAndInboundTransitions(component_obj, place_obj);

                // remove the place obj from its components place list
                removePlaceObj(component_obj, place_obj);
                layer.batchDraw();

            }

        }

    };

    function validTransition(source_obj, source_comp, dest_obj, dest_comp) {
        return (source_obj.index < dest_obj.index && source_comp == dest_comp);
    };

    function generateNextIndex(place_list) {

        if(place_list.length == 0){
            return 1;
        } else {
            return place_list[place_list.length - 1].index + 1;
        }

    };

    return place_obj;

};

function createDependencyPort(component_obj, place_obj) {

    var component = component_obj.konva_component;
    var component_group = component_obj.component_group_konva;
    var place = place_obj.place_konva;
    var tooltipLayer = component_obj.tooltipLayer;

    // create dependency here if set true
    if(place_obj.dependency) {

        // determine which type of dependency
        switch(place_obj.dependency_type) {

            case 'PROVIDE':
                // Creating service provide dependency
                dependency_obj = addNewServiceDependency(component, place, place_obj, component_obj, component_group, tooltipLayer);
                place_obj.dependency_konva_list.push(dependency_obj.dep_group_konva);
                break;

            case 'DATA_PROVIDE':
                // Creating service provide dependency
                dependency_obj = addNewDataDependency(component, place, place_obj, component_obj, component_group, tooltipLayer);
                place_obj.dependency_konva_list.push(dependency_obj.dep_group_konva);
                break;

            case '':
                alert("Dependency type has not been specified");
                break;

            default:
                // invalid dependency type
                alert("Invalid dependency type: " + place_obj.dependency_type);

        }

        return dependency_obj;
    }

};

// set the offset of the transition
function setTransitionOffset(num_occurences) {

    let offset;

    switch (num_occurences) {

        case 1:
            offset = 0
            break;

        case 2:
            offset = 30;
            break;

        case 3:
            offset = -30;
            break;

        default:
            // what are you doing here!?
            offset = 0;

        }

    return offset;

}

// Catch new place name from ipcMain
ipcRend.on("place->renderer", function(event, args) {

    if(args.name != '') {
        changePlaceName(args.component, args.place, args.name);
    }

});
