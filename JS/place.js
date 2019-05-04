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
    place_obj.component_obj = component_obj;

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

            // if we've already selected a source, unselect it first
            if(selected_source != null) {
                selected_source.place_konva.stroke('black');
                selected_source.place_konva.strokeWidth(1);
                layer.batchDraw();
                // if we're clicking the selected place, deselect it
                if(selected_source == place_obj) {
                    selected_source = null;
                    return;
                }
            }

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

            if(validTransition(component_obj.place_list, selected_source, selected_source_comp, selected_dest, selected_dest_comp)) {
                returned_transition_obj = addNewTransition(component_obj, selected_source, selected_dest);
            }

            stage.container().style.cursor = 'default';

            // changes the source back to black
            selected_source.place_konva.stroke('black');
            selected_source.place_konva.strokeWidth(1);
            layer.batchDraw();

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

        if(selected_source != null) {

            if(validTransition(component_obj.place_list, selected_source, selected_source_comp, place_obj, component_obj)) {

                highlighted = true;
                place.stroke('green');
                place.strokeWidth(3);
                place.draw();

            } else {

                highlighted = true;
                place.stroke('red');
                place.strokeWidth(3);
                place.draw();

            }

        }

        // event listener for deletion
        window.addEventListener('keydown', removePlace);

    });

    // event: mouse leaves place
    place.on('mouseleave', function () {

        stage.container().style.cursor = 'default';

        // if the mouse leaves a place that *isn't* the place selected, turn it black.
        if(selected_source != place_obj) {

            // changes the stroke and stroke width back to default if highlighted
            //if(highlighted == true) {
                place.stroke('black');
                place.strokeWidth(1);
                layer.batchDraw();
                highlighted = false;
            //}

        // if the mouse leaves a place that *is* the place selected, turn it blue.
        } else {
            highlighted = true;
            selected_source.place_konva.stroke('blue');
            selected_source.place_konva.strokeWidth(5);
            selected_source.place_konva.draw();
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

            selected_source.place_konva.stroke('black');
            selected_source.place_konva.strokeWidth(1);
            selected_source = null;
            selected_source_comp = null;
            layer.batchDraw();

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
                tooltip.destroy();
                selected_source = null;
                selected_source_comp = null;
                selected_dest = null;
                selected_dest_comp = null;

                deletor(place_obj);
            } else {
                // Do nothing!
                return;
            }   
        }

    };

    // returns places with empty inbound_transition lists
    function findRoots(place_list) {

        var roots = [];

        for(var place_index = 0; place_index < place_list.length; place_index++) {
            if(place_list[place_index].transition_inbound_list.length == 0) {
                roots.push(place_list[place_index]);
            }
        }

        return roots;

    };

    function validTransition(place_list, source_obj, source_comp, dest_obj, dest_comp) {

        if(source_comp != dest_comp || source_obj == dest_obj) {
            return false;
        }

        if(source_comp.transition_list.length == 0) {
            return true;
        }

        // get root places; i.e. places with no in-transitions
        var root_places = findRoots(place_list);

        for(var root_index = 0; root_index < root_places.length; root_index++) {

            var root_place = root_places[root_index];

            // add prospective transition
            var new_trans = new Transition('Transition', 'TransitionX', source_obj, dest_obj, 'defaultFunctionX');
            source_obj.transition_outbound_list.push(new_trans);
            dest_obj.transition_inbound_list.push(new_trans);

            // is there a cycle?
            cyclic = cycle(root_place);

            source_obj.transition_outbound_list.pop();
            dest_obj.transition_inbound_list.pop();

            // remove transition from source and dest
            // for(var trans_index = 0; trans_index < source_obj.transition_outbound_list.length; trans_index++) {
            //     if(source_obj.transition_outbound_list[trans_index] === new_trans) {
            //         source_obj.transition_outbound_list.splice(trans_index, 1);
            //     }
            // }
            // for(var trans_index = 0; trans_index < dest_obj.transition_inbound_list.length; trans_index++) {
            //     if(dest_obj.transition_inbound_list[trans_index] === new_trans) {
            //         dest_obj.transition_inbound_list.splice(trans_index, 1);
            //     }
            // }

            if(cyclic) {
                return false;
            }

        }

        // if a transition doesn't make a cycle, it's valid
        return true;

    }

    // depth-first search for cycle
    function cycle(place, visited=[]) {

        // if 'place' has already been 'visited', there is a cycle
        for(var index = 0; index < visited.length; index++) {

            if(visited[index] === place) {
                return true;
            }

        }

        // 'place' has now been visited
        visited.push(place);

        // depth-first dive into place's transitions, until there are no transitions out
        for(var outTransIndex = 0; outTransIndex < place.transition_outbound_list.length; outTransIndex++) {

            cyclic = cycle(place.transition_outbound_list[outTransIndex].dest, visited);
            visited.pop();
            if(cyclic) { return true; }

        }

        return false;

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
function setTransitionOffset(source_obj, dest_obj){

    var offset;

    var offset_selection = new Array(0, 30, -30);

    for (var i = 0; i < source_obj.transition_outbound_list.length; i++) {
        // outbound transition has same dest place
        if(source_obj.transition_outbound_list[i].dest == dest_obj){
            // dont set offset to this
            var tran_offset = source_obj.transition_outbound_list[i].offset;
            // remove offset from selections list
            var index = offset_selection.indexOf(tran_offset);
            if (index > -1) {
                offset_selection.splice(index, 1);
            }
        }
    }
    offset = offset_selection[0];
    return offset;

}

// Catch new place name from ipcMain
ipcRend.on("place->renderer", function(event, args) {

    if(args.name != '') {
        changePlaceName(args.component, args.place, args.name);
    }

});
