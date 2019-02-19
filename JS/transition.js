// function that adds new transition obj and konva arrow
function addNewTransition(offset, source_konva, dest_konva, source_obj, dest_obj, component_obj, component_group, component, tooltipLayer) {

    // max number of transitions out of the same source = 3
    if(source_obj.transition_count >= 3){
        alert("Cant create more than 3 transitions from " + source_obj.name);
        return;
    }
    // Transition Creation arguments: type, name, src, src_konva, dest, dest_konva, func
    var transition_obj = new Transition('Transition', "Transition_" + (component_obj.transition_list.length + 1), 
                                        source_obj, dest_obj, "defaultFunction_" + (component_obj.transition_list.length + 1));
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
        name: 'Transition_hover'
    });

    // create a new transition group
    var transition_group = new Konva.Group({
        name: 'transition_group'
    });

    // add transition konva obj to component group
    transition_group.add(transition);
    transition_group.add(transition_selection_area)
    component_group.add(transition_group);
    // component_group.add(transition);
    // component_group.add(transition_selection_area);

    // add the konva group to transition obj attribute
    transition_obj.tran_group_konva = transition_group;

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

    // delete this transition if the source_konva has been deleted
    source_konva.on('destroy', (e) => {
        // destroy the transition konva element
        transition.destroy();
        transition_selection_area.destroy();
        tooltip.destroy();
        layer.draw();
        // remove the transition obj from transition list
        removeTransitionObj(component_obj, transition_obj);
    });

    // delete this transition if the source_konva has been deleted
    dest_konva.on('destroy', (e) => {
        // destroy the transition konva element
        transition.destroy();
        transition_selection_area.destroy();
        tooltip.destroy();
        layer.draw();
        // remove the transition obj from transition list
        removeTransitionObj(component_obj, transition_obj);
    });

    transition_selection_area.on('moveenter', function(){
        stage.container().style.cursor = 'pointer';
    });

    transition_selection_area.on('mouseover', function(){
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

    function removeTransition(ev){
        // keyCode Delete key
        if (ev.keyCode === 46) {
            if (confirm('Are you sure you want to delete this Transition?')){
                // Delete it!
                transition.destroy();
                transition_selection_area.destroy();
                tooltip.destroy();
                layer.draw();
                // decrement transition dictionary
                component_obj.transition_dictionary[source_obj.name + dest_obj.name]--;
                // decrement the transition count for source obj
                source_obj.transition_count--;
                // remove the transition obj from its components transition list
                removeTransitionObj(component_obj, transition_obj);
            } else {
                // Do nothing!
                return;
            }   
        }
    }

    // Catch new transition details from ipcMain
    ipcRenderer.on("transition->renderer", function(event, args) {
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
            if (args.dependency_status != undefined) {
                console.log("Time to change transition dependency status after chaning the name.");
                changeTransitionDependencyStatus(args.component, args.name, args.dependency_status);
            };
            if (args.dependency_type != undefined) {
                console.log("Time to change transition dependency type after chaning the name.");
                changeTransitionDependencyType(args.component, args.name, args.dependency_type);
            };
        }
        // If the name is not changed and the func/dep status/dep type are, then use the old transition name
        else if (args.new_func != '') {
            console.log("Time to change the transition function name.");
            changeTransitionFunc(args.component, args.old_func, args.new_func);
        };
        //Separate if statements
        if (args.dependency_status != undefined) {
            console.log("Time to change transition dependency status.");
            changeTransitionDependencyStatus(args.component, args.transition, args.dependency_status);
        };
        if (args.dependency_type != undefined) {
            console.log("Time to change transition dependency type.");
            changeTransitionDependencyType(args.component, args.transition, args.dependency_type);
        };
        checkDependencyStatus();
    });

    function checkDependencyStatus(){
        // create dependency here if set true
        if(transition_obj.dependency){
            // determine which type of dependency
            switch(transition_obj.dependency_type) {
                case 'USE':
                // Creating service use dependency
                console.log("Creating service use dependency");
                dependency = addNewServiceDependency(component, transition_selection_area, transition_obj, component_obj, component_group, tooltipLayer);
                break;
                case 'DATA_USE':
                    // Creating data use dependency
                    console.log("Creating service use dependency");
                    dependency = addNewDataDependency(component, transition_selection_area, transition_obj, component_obj, component_group, tooltipLayer);
                break;
                default:
                    // invalid dependency type
                    alert("Invalid dependency type: " + transition_obj.dependency_type);
            }
        }
    };

    // move source and dest places above the transition
    source_konva.moveToTop();
    dest_konva.moveToTop();
    source_obj.transition_count++;
    layer.batchDraw();
    //layer.draw();
    return transition_obj;
}