// function that adds new transition obj and konva arrow
function addNewTransition(component_obj, source_obj, dest_obj) {

    // check max transition count
    if(source_obj.transition_count >= max_transition_count) {
        alert("Cant create more than " + max_transition_count + " transitions from " + source_obj.name);
        return false;
    }

    // set transition offset
    let num_occurences = pushTransitionDictionary(component_obj, source_obj, dest_obj);
    var offset = setTransitionOffset(source_obj, dest_obj);
    source_obj.offset = offset;

    var transition_group = new Konva.Group({
        name: 'transition_group'
    });

    var transition = new Konva.Line({
        points: [source_obj.place_konva.getX(), source_obj.place_konva.getY(),
               ((source_obj.place_konva.getX() + dest_obj.place_konva.getX()) / 2) + offset, ((source_obj.place_konva.getY() + dest_obj.place_konva.getY()) / 2),
                 dest_obj.place_konva.getX(), dest_obj.place_konva.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'transition',
        tension: 1
    });

    var transition_selection_area = new Konva.Circle({
        x: ((source_obj.place_konva.getX() + dest_obj.place_konva.getX()) / 2) + offset,
        y: (source_obj.place_konva.getY() + dest_obj.place_konva.getY()) / 2,
        radius: 10,
        opacity: 0,
        stroke: 'black',
        fill: 'white',
        strokeWidth: 0.5,
        text: transition.name,
        name: 'Transition'
    });

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

    // create transition object
    var transition_obj = new Transition('Transition', "Transition_" + generateNextIndex(component_obj.transition_list),
                                        source_obj, dest_obj, "defaultFunction_" + generateNextIndex(component_obj.transition_list));
    transition_obj.index = generateNextIndex(component_obj.transition_list);
    transition_obj.offset = offset;
    transition_obj.tran_group_konva = transition_group;
    transition_obj.tran_select_konva = transition_selection_area;
    transition_obj.transition_selection_area = transition_selection_area;
    transition_obj.tran_konva = transition;
    transition_obj.component_obj = component_obj;
    component_obj.transition_list.push(transition_obj);

    // add transition konva obj to component group
    transition_group.add(transition);
    transition_group.add(transition_selection_area);
    source_obj.transition_outbound_list.push(transition_obj);
    dest_obj.transition_inbound_list.push(transition_obj);
    component_obj.component_group_konva.add(transition_group);

    // intilize selection variables to null
    selected_transition = null;

    // event: left click on transition
    transition_selection_area.on("click", function(e) {
        // left clk on tran selection area
        if (e.evt.button === 0){
            // highlight the transition
            transition.stroke('blue');
            transition.strokeWidth(3);
            transition.draw();
            selected_transition = transition_obj;
        }
    });

    // event: right-click on transition
    transition_selection_area.on("click", function(e) {
        if(e.evt.button === 2) {
            // highlight the transition
            transition.stroke('blue');
            transition.strokeWidth(3);
            transition.draw();
            //open window for editing transition
            console.log("Open window for editing transition details");
            ipcRend.send("change_transition_details", {component: component_obj.name, transition: transition_obj.name, function: transition_obj.func});
        }
    });

    // event: mouse enters transition selection
    transition_selection_area.on('moveenter', function() {
        stage.container().style.cursor = 'pointer';
    });

    // event: mouse moves over transition selection
    transition_selection_area.on('mouseover', function() {
        window.addEventListener('keydown', removeTransition);
    });

    // event: mouse moves over place
    transition_selection_area.on('mousemove', function () {
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(component_obj.name + " - " + transition_obj.name);
        tooltip.show();
        component_obj.tooltipLayer.batchDraw();
    });

    // event: mouse moves out of transition selection
    transition_selection_area.on('mouseout', function(){
        stage.container().style.cursor = 'default';
        transition.stroke('black');
        transition.strokeWidth(1);
        tooltip.hide();
        component_obj.tooltipLayer.draw();
        window.removeEventListener('keydown', removeTransition);
    });

    // event: source place is moved
    source_obj.place_konva.on('dragmove', (e) => {
        transition.setPoints([snapToGrid(source_obj.place_konva.getX()),
                              snapToGrid(source_obj.place_konva.getY()),
                              snapToGrid(((source_obj.place_konva.getX() + dest_obj.place_konva.getX()) / 2) + offset),
                              snapToGrid(source_obj.place_konva.getY() + dest_obj.place_konva.getY()) / 2,
                              snapToGrid(dest_obj.place_konva.getX()),
                              snapToGrid(dest_obj.place_konva.getY())]);
        transition_selection_area.position({
            x: snapToGrid(((source_obj.place_konva.getX() + dest_obj.place_konva.getX()) / 2) + offset),
            y: snapToGrid((source_obj.place_konva.getY() + dest_obj.place_konva.getY()) / 2)
        });
    });

    // event: dest place is moved
    dest_obj.place_konva.on('dragmove', (e) => {
        transition.setPoints([snapToGrid(source_obj.place_konva.getX()),
                              snapToGrid(source_obj.place_konva.getY()),
                              snapToGrid(((source_obj.place_konva.getX() + dest_obj.place_konva.getX()) / 2) + offset),
                              snapToGrid(source_obj.place_konva.getY() + dest_obj.place_konva.getY()) / 2,
                              snapToGrid(dest_obj.place_konva.getX()),
                              snapToGrid(dest_obj.place_konva.getY())]);
        transition_selection_area.position({
            x: snapToGrid(((source_obj.place_konva.getX() + dest_obj.place_konva.getX()) / 2) + offset),
            y: snapToGrid((source_obj.place_konva.getY() + dest_obj.place_konva.getY()) / 2)
        });
    });

    // event: right click on use_selection_area
    component_obj.use_selection_area.on("click", function(e){

        if(e.evt.button === 2 && selected_transition != null) {

            selected_transition.dependency = true;

            var type = ipcRend.sendSync("set_dependency_type");

            if(type == 'service') {
                selected_transition.dependency_type = 'USE'
            } else if (type == 'data') {
                selected_transition.dependency_type = 'DATA_USE'
            }

            createDependencyUsePort(component_obj, selected_transition);

            // reset the source obj and konva pointers to null
            selected_transition = null;

        }

    });

    // event: mouse goes over use_selection_area
    component_obj.use_selection_area.on("mouseover", function() {

        // if source konva has been selected show green provide selection area on mouse enter
        if(selected_transition != null){
            component_obj.use_selection_area.fill('green');
            component_obj.use_selection_area.opacity(1);
            layer.batchDraw();
        }

    });

    // event: mouse leaves use_selection_area
    component_obj.use_selection_area.on("mouseout", function() {

        // if use_selection_area was visible, hide it!
        if(component_obj.use_selection_area.opacity() === 1){
            component_obj.use_selection_area.opacity(0);
            layer.batchDraw();
        }

    });

    function removeTransition(ev){

        // keyCode Delete key
        if (ev.keyCode === 46 || ev.keyCode == 8) {
            if (confirm('Are you sure you want to delete this Transition?')){
                // Delete it!
                tooltip.destroy();
                selected_transition = null;
                // remove the transition obj from its components transition list
                deletor(transition_obj);
            } else {
                // Do nothing!
                return;
            }
        }

    }

    function generateNextIndex(transition_list) {

        if (transition_list.length == 0){
            return 1;
        } else {
            return transition_list[transition_list.length - 1].index + 1;
        }

    }

    // move source and dest places above the transition
    source_obj.place_konva.moveToTop();
    dest_obj.place_konva.moveToTop();
    source_obj.transition_count++;
    layer.batchDraw();

    return transition_obj;

}

// function to create a use port out of a transition
function createDependencyUsePort(component_obj, transition_obj){

    var component = component_obj.konva_component;
    var component_group = component_obj.component_group_konva;
    var transition_selection_area = transition_obj.transition_selection_area;
    var tooltipLayer = component_obj.tooltipLayer;

    if(!transition_obj.dependency) {
        return;
    }

    // determine which type of dependency
    switch(transition_obj.dependency_type) {

        // create service-use dep
        case 'USE':
            dependency_obj = addNewServiceDependency(component, transition_selection_area, transition_obj, component_obj, component_group, tooltipLayer);
            transition_obj.dependency_konva_list.push(dependency_obj.dep_group_konva);
            break;

        // create data-use dep
        case 'DATA_USE':
            dependency_obj = addNewDataDependency(component, transition_selection_area, transition_obj, component_obj, component_group, tooltipLayer);
            transition_obj.dependency_konva_list.push(dependency_obj.dep_group_konva);
            break;

        // invalid dep type
        default:
            alert("Invalid dependency type: " + transition_obj.dependency_type);

        }

    return dependency_obj;

};

// set Transition dictionary value
function pushTransitionDictionary(source_component, source_obj, dest_obj) {

    let src = source_obj.name;
    let dest = dest_obj.name;

    // check if this source -> dest combo has been added prior
    if(source_component.transition_dictionary[src] && source_component.transition_dictionary[src][dest]) {
        source_component.transition_dictionary[src][dest]++;
    } else {
        source_component.transition_dictionary[src] = {};
        source_component.transition_dictionary[src][dest] = 1;
    }

    source_obj.offset = source_component.transition_dictionary[src][dest];

    let count = source_component.transition_dictionary[src][dest]
    return count;

}

// Catch new transition details from ipcMain
ipcRend.on("transition->renderer", function(event, args) {

    if (args.new_func != '') {
        changeTransitionFunc(args.component, args.old_func, args.new_func);
    }

    if (args.duration_min != '') {
        changeTransitionDurationMin(args.component, args.transition, args.new_duration_min);
    }

    if (args.duration_max != '') {
        changeTransitionDurationMax(args.component, args.transition, args.new_duration_max);
    }

    if (args.name != '') {
        changeTransitionName(args.component, args.transition, args.name);
    }

});
