// function that adds new transition obj and konva arrow
function addNewTransition(offset, source_konva, dest_konva, source_obj, dest_obj, component_obj, component_group, component, tooltipLayer, use_selection_area, provide_selection_area) {

    // max number of transitions out of the same source = 3
    if(source_obj.transition_count >= max_transition_count){
        alert("Cant create more than 3 transitions from " + source_obj.name);
        return false;
    }

    // get index
    var index;
    if (component_obj.transition_list.length == 0){
        index = 1;
    } else {
        index = component_obj.transition_list[component_obj.transition_list.length - 1].index + 1;
    }

    // Transition Creation arguments: type, name, src, src_konva, dest, dest_konva, func
    var transition_obj = new Transition('Transition', "Transition_" + index, 
                                        source_obj, dest_obj, "defaultFunction_" + index);
    component_obj.transition_list.push(transition_obj);

    // set index
    transition_obj.index = index;

    var transition = new Konva.Line({
        points: [source_konva.getX(), source_konva.getY(), ((source_konva.getX() + dest_konva.getX()) / 2) + offset, (source_konva.getY() + dest_konva.getY()) / 2, dest_konva.getX(), dest_konva.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'transition',
        tension: 1
    });

    var transition_selection_area = new Konva.Circle({
        x: ((source_konva.getX() + dest_konva.getX()) / 2) + offset,
        y: (source_konva.getY() + dest_konva.getY()) / 2,
        radius: 10,
        opacity: 0,
        stroke: 1,
        text: transition.name,
        name: 'Transition'
    });

    // create a new transition group
    var transition_group = new Konva.Group({
        name: 'transition_group'
    });

    // add transition konva obj to component group
    transition_group.add(transition);
    transition_group.add(transition_selection_area)
    component_group.add(transition_group);

    // add the konva group to transition obj attribute
    transition_obj.tran_group_konva = transition_group;

    // intilize selection variables to null
    source_transition_konva = null;
    source_transition_obj = null;

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
        //layer.draw();
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
        //layer.draw();
    });

    use_selection_area.on("mouseover", function() {
        // if source konva has been selected show green provide selection area on mouse enter
        if(source_transition_konva == transition_selection_area){
            use_selection_area.fill('green');
            use_selection_area.opacity(1);
            layer.batchDraw();
        }
    });

    use_selection_area.on("mouseout", function() {
        // if use_selection_area was visible, hide it!
        if(use_selection_area.opacity() === 1){
            use_selection_area.opacity(0);
            layer.batchDraw();
        }
    });

    transition_selection_area.on('moveenter', function() {
        stage.container().style.cursor = 'pointer';
    });

    transition_selection_area.on('mouseover', function() {
        window.addEventListener('keydown', removeTransition);
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
        //layer.draw();
        window.removeEventListener('keydown', removeTransition);
    });

    transition_selection_area.on("click", function(e){
        // left clk on tran selection area
        if (e.evt.button === 0){
            // highlight the transition
            transition.stroke('blue');
            transition.strokeWidth(3);
            transition.draw();
            source_transition_konva = transition_selection_area;
            source_transition_obj = transition_obj;
        }
        else if (e.evt.button === 2){
            // highlight the transition
            transition.stroke('blue');
            transition.strokeWidth(3);
            transition.draw();
            //open window for editing transition
            console.log("Open window for editing transition details");
            ipcRend.send("change_transition_details", {component: component_obj.name, transition: transition_obj.name, function: transition_obj.func});
        };
    });

    // if provide_selection_area gets clicked on
    use_selection_area.on("click", function(e){
        // right click
        if(e.evt.button === 2){
            // if source obj has been assigned with a left click prior
            if(source_transition_konva != null){
                source_transition_obj.dependency = true;
                
                // prompt for dependency type
                console.log("Open window for setting port type (sync)");
                var type = ipcRend.sendSync("set_dependency_type");
                console.log("type: " + type);

                if(type ==  'service' ){
                    type = 'USE';
                    // set the type
                    source_transition_obj.dependency_type = type
                    // args: component, component_obj, component_group, transition_obj, transition_selection_area, tooltipLayer
                    createDependencyUsePort(component, component_obj, component_group, source_transition_obj, source_transition_konva, tooltipLayer);
                } else if (type == 'data'){
                    type = 'DATA_USE';
                    // set the type
                    source_transition_obj.dependency_type = type
                    createDependencyUsePort(component, component_obj, component_group, source_transition_obj, source_transition_konva, tooltipLayer);
                }
                
                // reset the source obj and konva pointers to null
                source_transition_konva = null;
                source_transition_obj = null;
            }
        }
    });

    function removeTransition(ev){
        // keyCode Delete key
        if (ev.keyCode === 46) {
            if (confirm('Are you sure you want to delete this Transition?')){
                // Delete it!
                transition.destroy();
                transition_selection_area.destroy();
                tooltip.destroy();
                layer.draw();
                // remove the transition obj from its components transition list
                removeTransitionObj(component_obj, transition_obj);
            } else {
                // Do nothing!
                return;
            }   
        }
    }

    // move source and dest places above the transition
    source_konva.moveToTop();
    dest_konva.moveToTop();
    source_obj.transition_count++;
    layer.batchDraw();
    //layer.draw();
    return transition_obj;
}

// function to create a use port out of a transition
function createDependencyUsePort(component, component_obj, component_group, transition_obj, transition_selection_area, tooltipLayer){
    // create dependency here if set true
    if(transition_obj.dependency){
        // determine which type of dependency
        switch(transition_obj.dependency_type) {
            case 'USE':
                // Creating service use dependency
                console.log("Creating service use dependency");
                dependency_group = addNewServiceDependency(component, transition_selection_area, transition_obj, component_obj, component_group, tooltipLayer);
                // add the return dependency konva elements 
                transition_obj.dependency_konva_list.push(dependency_group);
                break;
            case 'DATA_USE':
                // Creating data use dependency
                console.log("Creating service use dependency");
                dependency_group = addNewDataDependency(component, transition_selection_area, transition_obj, component_obj, component_group, tooltipLayer);
                // add the return dependency konva elements 
                transition_obj.dependency_konva_list.push(dependency_group);
                break;
            default:
                // invalid dependency type
                alert("Invalid dependency type: " + transition_obj.dependency_type);
        }
    }
};

// Catch new transition details from ipcMain
ipcRend.on("transition->renderer", function(event, args) {
    console.log("Made it to transition->renderer.");
    console.log(args.name);
    //If the name is changed
    if (args.name != '') {
        //Time to change transition name
        console.log("Change transition name");
        changeTransitionName(args.component, args.transition, args.name, args.old_func, args.new_func);
        // If the name is changed and the func/dependency status/dependency type is changed (use new transition name)
        if (args.new_func != '') {
            console.log("Time to change the transition function after changing the name.")
            changeTransitionFunc(args.component, args.old_func, args.new_func);
        };
    }
    // If the name is not changed and the func/dep status/dep type are, then use the old transition name
    else if (args.new_func != '') {
        console.log("Time to change the transition function name.");
        changeTransitionFunc(args.component, args.old_func, args.new_func);
    };
});