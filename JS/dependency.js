// Add new Service dependency function, should only be called by place and transition
function addNewServiceDependency(component, source_element, source_obj, component_obj, component_group, tooltipLayer) {

    // check if source obj dependency count is less than allowed
    // if(isDependencyAllowed(source_obj)){ return false; }

    var offset;
    var add;
    var stub_x;
    var verticalOffset;
    source_selected = null;

    // get index
    var index;
    if (component_obj.dependency_list.length == 0){
        index = 1;
    } else {
        index = component_obj.dependency_list[component_obj.dependency_list.length - 1].index + 1;
    }

    // provide connection going right of a place
    if(source_obj.type == 'Place') {
        // create the dependency object
        var dependency_obj = new Dependency('PROVIDE', "Dependency_" + index);
        // add dep obj to comp_obj.dep_list
        component_obj.dependency_list.push(dependency_obj);
        console.log('Created new PROVIDE dependency dock');

        offset = component.getWidth();
        add = 20;
        stub_x = 0;
        // set vertical offset for dependency port
        verticalOffset = getVerticalOffset(source_obj);
        console.log("Vertical Offset is " + verticalOffset);
    } else if (source_obj.type == 'Transition') {
        // create the dependency object
        var dependency_obj = new Dependency('USE', "Dependency_" + index);
        // set transition selection area opacity to 1
        // source_obj
        // add dep obj to comp_obj.dep_list
        component_obj.dependency_list.push(dependency_obj);
        console.log('Created new USE dependency dock');

        // use connection going left of a transition
        offset = 0;
        add = -20;
        stub_x = -15;
        // set vertical offset for dependency port
        verticalOffset = getVerticalOffset(source_obj);
        console.log("Vertical Offset is " + verticalOffset);
        // toggle transition selection area opacity
        showTransitionSelectionArea(source_obj);
    };

    // add dependency obj to source_obj dep list
    source_obj.dependency_obj_list.push(dependency_obj);
    
    // set index
    dependency_obj.index = index;

    // set source obj of dependency stub
    dependency_obj.source_obj = source_obj;
    console.log("This dependencys source obj is " + dependency_obj.source_obj.name);

    // set pointer to depedencies component obj
    dependency_obj.component_obj = component_obj;

    // increment source obj dependency count
    source_obj.dependency_count++;

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), (component.getX() + offset * component.scaleX()), source_element.getY() + verticalOffset],
        stroke: 'black',
        strokeWidth: 1,
        name: 'dependency',
        tension: 0,
        dash: [10, 5],
        listening: true
    });

    var stem = new Konva.Line({
        points: [component.getX() + offset * component.scaleX(), source_element.getY() + verticalOffset, 
                (component.getX() + offset * component.scaleX()) + add, source_element.getY() + verticalOffset],
        stroke: 'black',
        strokeWidth: 1,
        name: 'stem',
        tension: 0,
    });

    // create a new dependency_group
    var dependency_group = new Konva.Group({
        name: 'dependency_group'
    });

    // add dependency (dashed line) and stem to dependency group
    dependency_group.add(dependency);
    dependency_group.add(stem);

    // stub for provide dependency
    if(source_obj.type == 'Place'){
        var stub = getServiceStub();
        var symbol = getServiceSymbol();
        symbol.opacity(0);
        dependency_obj.dep_stub_konva = stub;
        dependency_obj.dep_symbol_konva = symbol;
        // add stub and symbol to group for place
        dependency_group.add(stub);
        dependency_group.add(symbol);
    }
    else if(source_obj.type == 'Transition') {
        // stub for use dependency
        var stub = getServiceStub();
        stub.opacity(0);
        var symbol = getServiceSymbol();
        dependency_obj.dep_stub_konva = stub;
        dependency_obj.dep_symbol_konva = symbol;
        // add stub and symbol to group for transition
        dependency_group.add(stub);
        dependency_group.add(symbol);
    };

    function getServiceStub(){
        var stub = new Konva.Circle({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3],
            radius: 8,
            stroke: 'black',
            strokeWidth: 1,
            fill: 'black',
            name: 'stub',
            ShadowBlur: 1
        });
        return stub;
    };

    function getServiceSymbol(){
        var symbol = new Konva.Arc({
            x: stub.getX(),
            y: stub.getY(),
            innerRadius: 15,
            outerRadius: 16,
            angle: 180,
            stroke: 'black',
            strokeWidth: 1,
            rotation: 270
        });
        return symbol;
    }

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

    // if mouse is over a stub
    stub.on('mousemove', function () {
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(component_obj.name + " - " + dependency_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });

    stub.on('mouseenter', function () {
        window.addEventListener('keydown', removeStub);
    });

    // hide the tooltip on mouse out
    stub.on('mouseout', function(){
        tooltip.hide();
        tooltipLayer.draw();
        window.removeEventListener('keydown', removeStub);
    });

    function removeStub(ev){
        // keyCode Delete key = 46
        if (ev.keyCode === 46 || ev.keyCode == 8) {
            if (confirm('Are you sure you want to delete this dependency?')){
                // Delete it!
                //dependency_group.destroy();
                tooltip.destroy();

                // remove the depedency obj from its components dependency list
                //removeDependencyObj(component_obj, dependency_obj);
                deletor(dependency_obj);
            } else {
                // Do nothing!
                return;
            }
        }
    };

    // when the source element moves
    source_element.on('xChange yChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              component.getX() + offset * component.scaleX(),
                              source_element.getY() + verticalOffset]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY() + verticalOffset,
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY() + verticalOffset]);
        stub.position({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3]
        });
        symbol.position({
            x: stub.getX(),
            y: stub.getY()
        });

        //layer.draw();
    });

     // when the source element moves
     component.on('xChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              component.getX() + offset * component.scaleX(),
                              source_element.getY() + verticalOffset]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY() + verticalOffset,
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY() + verticalOffset]);

        stub.position({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3]
        });
        symbol.position({
            x: stub.getX(),
            y: stub.getY()
        });
    });

    // if a click over stub
    stub.on("click", function(e){
        if (e.evt.button === 0){
            // first left click
            // check if stub is a provide
            if(source_obj.type == 'Place'){
                provide_component_obj = component_obj;
                provide_source_obj = source_obj;
                provide_stub_konva = stub;
                provide_component_group = component_group;
                provide_symbol = symbol;
                provide_dependency_obj = dependency_obj;
                // set pointer to dependency obj stub/symbol
                provide_dependency_obj.dep_stub_konva = provide_symbol;
                provide_dependency_type = source_obj.dependency_type;
                // set source selected true
                source_selected = true;
            }
        } else if (e.evt.button === 2) {
            // check if provide stub was selected prior
            if(source_selected != null){
                // make sure connection is going to USE stub
                if(source_obj.type == 'Transition'){
                    // get the use stub depedency type
                    use_dependency_type = source_obj.dependency_type;
                    // check if source stub and dest stub is the same dependency type
                    if((provide_dependency_type == 'PROVIDE' && use_dependency_type == 'USE') || (provide_dependency_type == 'DATA_PROVIDE' && use_dependency_type == 'DATA_USE')){
                        use_component_obj = component_obj;
                        // Check if connection is going to a different component
                        if(provide_component_obj != use_component_obj){
                            use_source_obj = source_obj;
                            use_stub_konva = stub;
                            use_component_group = component_group;
                            use_dependency_obj = dependency_obj;
                            // set pointer to dependency obj stub/symbol
                            use_dependency_obj.dep_stub_konva = use_stub_konva;
                            // check if connection already exists between these two depedencies
                            if(!checkConnectionExist(provide_dependency_obj, use_dependency_obj)){
                                // check if arc is visible
                                provide_dependency_obj.dep_stub_konva.opacity(1);
                                use_dependency_obj.dep_stub_konva.opacity(1);
                                // if(provide_symbol.opacity() == 0){
                                //     // make it visible
                                //     provide_symbol.opacity(1);
                                //     use_stub_konva.opacity(1);
                                // }
                                // create new connection here
                                connection_obj = addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group, provide_dependency_obj, use_dependency_obj);
                            } else {
                                alert("Connection already exists between these two dependencies");
                            }
                        } else {
                            alert("Cant create connection from " + provide_component_obj.name + " to " + use_component_obj.name);
                        }
                    } else {
                        alert("Incompatible dependency types");
                    }
                } else {
                    alert("Left click Provide dependency stub and Right click Use dependency stub to connect them");
                }
            } else {
                // right clk source was not selected, open window for editing
                ipcRend.send("change_stub_details", {component: component_obj.name, stub: dependency_obj.name});
            }
            // reset source and dest
            provide_stub_konva = null;
            use_stub_konva = null;
            source_selected = null;
        }
    });

    // add dependency group to dependency obj
    dependency_obj.dep_group_konva = dependency_group;
    // add dependency group to component group
    component_group.add(dependency_group);
    // move dependency group to bottom
    dependency_group.moveToBottom();
    // draw the layer with added dependency elements
    layer.draw();

    return dependency_obj;
}

function showTransitionSelectionArea(source_obj){
    if(source_obj.type != "Transition"){
        return;
    } else {
        if(source_obj.transition_selection_area.opacity() == 0){
            source_obj.transition_selection_area.opacity(1);
        }
    }
}

function hideTransitionSelectionArea(source_obj){
    if(source_obj.type != "Transition"){
        return;
    } else {
        if(source_obj.transition_selection_area.opacity() == 1 && source_obj.dependency_count == 0){
            source_obj.transition_selection_area.opacity(0);
        }
    }
}

function isDependencyAllowed(source_obj){
    if(source_obj.dependency_count >= MAX_DEPENDENCY_COUNT){
        return false;
    } else {
        return true;
    }
}

// assigns verticalOffset to value based on source obj dependency count
function getVerticalOffset(source_obj){
    var verticalOffset;
    var parallelOffset = 0;
    if(source_obj.type == 'Transition'){
        parallelOffset = source_obj.offset * 5;
    }
    switch(source_obj.dependency_count){
        case 0:
            verticalOffset = 0;
            break;
        case 1:
            verticalOffset = 50;
            break;
        case 2:
            verticalOffset = -50;
            break;
    }
    return verticalOffset += parallelOffset;
}

// Add new Service dependency function, should only be called by place and transition
function addNewDataDependency(component, source_element, source_obj, component_obj, component_group, tooltipLayer) {
    var offset;
    var add;
    var stub_x;
    var dependency_name;

    var stub;
    var data_stub_provide;
    var data_symbol_provide;
    var data_stub_use;
    var data_symbol_use;

    var verticalOffset;

    // get index
    var index;
    if (component_obj.dependency_list.length == 0){
        index = 1;
    } else {
        index = component_obj.dependency_list[component_obj.dependency_list.length - 1].index + 1;
    }

    // provide connection going right of a place
    if(source_obj.type == 'Place'){
        // create the dependency object
        var dependency_obj = new Dependency('DATA_PROVIDE', "Dependency_" + index);
        component_obj.dependency_list.push(dependency_obj);
        offset = component.getWidth();
        add = 20;
        stub_x = -5;
        dependency_name = dependency_obj.type + " Provide Dependency from " + source_obj.name;
        // set vertical offset for dependency port
        verticalOffset = getVerticalOffset(source_obj);
    } else if (source_obj.type == 'Transition') {
        // create the dependency object
        var dependency_obj = new Dependency('DATA_USE', "Dependency_" + index);
        component_obj.dependency_list.push(dependency_obj);
        // use connection going left of a transition
        offset = 0;
        add = -20;
        stub_x = 0;
        dependency_name = dependency_obj.type + " Use Dependency from " + source_obj.name;
        // set vertical offset for dependency port
        verticalOffset = getVerticalOffset(source_obj);
        // toggle transition selection area opacity
        showTransitionSelectionArea(source_obj);
    };

    // set index
    dependency_obj.index = index;

    // set source obj of dependency stub
    dependency_obj.source_obj = source_obj;
    // add dependency obj to source_obj dep list
    source_obj.dependency_obj_list.push(dependency_obj);

    // increment source obj dependency count
    source_obj.dependency_count++;

    dependency_obj.component_obj = component_obj;

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), (component.getX() + offset * component.scaleX()), source_element.getY() + verticalOffset],
        stroke: 'black',
        strokeWidth: 1,
        name: 'dependency',
        tension: 0,
        dash: [10, 5],
        listening: true
    });

    var stem = new Konva.Line({
        points: [component.getX() + offset * component.scaleX(), source_element.getY() + verticalOffset, (component.getX() + offset * component.scaleX()) + add, source_element.getY() + verticalOffset],
        stroke: 'black',
        strokeWidth: 1,
        name: 'stem',
        tension: 0,
    });

    // create a new dependency_group
    var dependency_group = new Konva.Group({
        name: 'dependency_group'
    });

    // add dependency (dashed line) and stem to dependency group
    dependency_group.add(dependency);
    dependency_group.add(stem);

    // stub for provide dependency
    if(source_obj.type == 'Place'){
        // Data type
        // make invisible circle for hover
        stub = getDataStubHover();
        data_stub_provide = getDataStubProvide();
        // symbol is invisbile until connection has been established
        data_symbol_provide = getDataSymbolProvide();
        data_symbol_provide.opacity(0);
        dependency_obj.dep_symbol_konva = data_symbol_provide;
        dependency_obj.dep_stub_konva = stub;
        // add all to dependency group
        dependency_group.add(stub);
        dependency_group.add(data_stub_provide);
        dependency_group.add(data_symbol_provide);

    }
    else if(source_obj.type == 'Transition') {
        // invisible stub for selection
        stub = getDataStubHover();
        data_stub_use = getDataStubUse();
        data_stub_use.opacity(0);
        data_symbol_use = getDataSymbolUse();
        dependency_obj.dep_symbol_konva = data_symbol_use;
        dependency_obj.dep_stub_konva = stub;
        dependency_obj.dep_stub_use_konva = data_stub_use;
        // add all to dependency group
        dependency_group.add(stub);
        dependency_group.add(data_stub_use);
        dependency_group.add(data_symbol_use);
    };

    function getDataStubHover(){
        var stub = new Konva.Circle({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3],
            radius: 8,
            stroke: 'black',
            strokeWidth: 1,
            name: 'stub',
            ShadowBlur: 1,
            opacity: 0
        });
        return stub;
    }

    function getDataStubProvide(){
        var stub = new Konva.Line({
            points: [(dependency.points()[2] + add) - 5, dependency.points()[3] + 5,
                     (dependency.points()[2] + add), dependency.points()[3],
                     (dependency.points()[2] + add) - 5, dependency.points()[3] - 5],
            stroke: 'black',
            strokeWidth: 2,
            name: 'stub',
            lineCap: 'round',
            lineJoin: 'round',
            tension : 0,
            opacity: 1
        });
        return stub;
    }

    function getDataStubUse(){
        var DataStubUse = new Konva.Line({
            points: [(dependency.points()[2] + add) - 15, dependency.points()[3] + 5,
                     (dependency.points()[2] + add) - 10, dependency.points()[3],
                     (dependency.points()[2] + add) - 15, dependency.points()[3] - 5],
            stroke: 'black',
            strokeWidth: 1,
            name: 'stub',
            lineCap: 'round',
            lineJoin: 'round',
            tension : 0,
            opacity: 1
        });
        return DataStubUse;
    }

    function getDataSymbolProvide(){
        var DataSymbolProvide = new Konva.Line({
            points: [(dependency.points()[2] + add), dependency.points()[3] + 10,
                     (dependency.points()[2] + add) + 10, dependency.points()[3],
                     (dependency.points()[2] + add), dependency.points()[3] - 10],
            stroke: 'black',
            strokeWidth: 1,
            name: 'DataSymbolProvide',
            lineCap: 'round',
            lineJoin: 'round',
            tension : 0
        });
        return DataSymbolProvide;
    }

    function getDataSymbolUse(){
        var DataSymbolUse = new Konva.Line({
            points: [(dependency.points()[2] + add) - 10, dependency.points()[3] + 10,
                     (dependency.points()[2] + add), dependency.points()[3],
                     (dependency.points()[2] + add) - 10, dependency.points()[3] - 10],
            stroke: 'black',
            strokeWidth: 2,
            name: 'DataSymbolUse',
            lineCap: 'round',
            lineJoin: 'round',
            tension : 0
        });
        return DataSymbolUse;
    }

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

    // if mouse is over a stub
    stub.on('mousemove', function () {
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(component_obj.name + " - " + dependency_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });

    stub.on('mouseenter', function () {
        window.addEventListener('keydown', removeStub);
    });

    // hide the tooltip on mouse out
    stub.on('mouseout', function(){
        tooltip.hide();
        tooltipLayer.draw();
        window.removeEventListener('keydown', removeStub);
    });

    function removeStub(ev){
        // keyCode Delete key = 46
        if (ev.keyCode === 46 || ev.keyCode == 8) {
            if (confirm('Are you sure you want to delete this dependency?')){
                // Delete it!
                //dependency_group.destroy();
                tooltip.destroy();

                // remove connection if created from dependency stub

                // set source_obj dependency boolean to false
                source_obj.dependency = false;

                // remove the depedency obj from its components dependency list
                //removeDependencyObj(component_obj, dependency_obj);
                deletor(dependency_obj);
            } else {
                // Do nothing!
                return;
            }
        }
    };

    // when the source element moves
    source_element.on('xChange yChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              component.getX() + offset * component.scaleX(),
                              source_element.getY() + verticalOffset]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY() + verticalOffset,
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY() + verticalOffset]);

        // invisible stub for selection
        stub.position({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3]
        });
        if(data_stub_provide != null){
            // update the provide points
            data_stub_provide.setPoints([(dependency.points()[2] + add) - 5, dependency.points()[3] + 5,
                                         (dependency.points()[2] + add), dependency.points()[3],
                                         (dependency.points()[2] + add) - 5, dependency.points()[3] - 5]);
            data_symbol_provide.setPoints([(dependency.points()[2] + add), dependency.points()[3] + 10,
                                          (dependency.points()[2] + add) + 10, dependency.points()[3],
                                          (dependency.points()[2] + add), dependency.points()[3] - 10]);
        }
        if(data_stub_use != null){
            // update the use points
            data_stub_use.setPoints([(dependency.points()[2] + add) - 15, dependency.points()[3] + 5,
                                     (dependency.points()[2] + add) - 10, dependency.points()[3],
                                     (dependency.points()[2] + add) - 15, dependency.points()[3] - 5]);
            data_symbol_use.setPoints([(dependency.points()[2] + add) - 10, dependency.points()[3] + 10,
                                       (dependency.points()[2] + add), dependency.points()[3],
                                       (dependency.points()[2] + add) - 10, dependency.points()[3] - 10]);
        }
        //layer.draw();
    });

     // when the source element moves
     component.on('xChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              component.getX() + offset * component.scaleX(),
                              source_element.getY() + verticalOffset]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY() + verticalOffset,
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY() + verticalOffset]);

        stub.position({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3]
        });
        if(data_stub_provide != null){
            // update the provide points
            data_stub_provide.setPoints([(dependency.points()[2] + add) - 5, dependency.points()[3] + 5,
                                         (dependency.points()[2] + add), dependency.points()[3],
                                         (dependency.points()[2] + add) - 5, dependency.points()[3] - 5]);
            data_symbol_provide.setPoints([(dependency.points()[2] + add), dependency.points()[3] + 10,
                                           (dependency.points()[2] + add) + 10, dependency.points()[3],
                                           (dependency.points()[2] + add), dependency.points()[3] - 10]);
        }
        if(data_stub_use != null){
            // update the use points
            data_stub_use.setPoints([(dependency.points()[2] + add) - 15, dependency.points()[3] + 5,
                                     (dependency.points()[2] + add) - 10, dependency.points()[3],
                                     (dependency.points()[2] + add) - 15, dependency.points()[3] - 5]);
            data_symbol_use.setPoints([(dependency.points()[2] + add) - 10, dependency.points()[3] + 10,
                                       (dependency.points()[2] + add), dependency.points()[3],
                                       (dependency.points()[2] + add) - 10, dependency.points()[3] - 10]);
        }
    });

    // if a click over stub
    stub.on("click", function(e){
        if (e.evt.button === 0){
            // first left click
            console.log("Left clicked stub: ", source_obj.name);
            // check if source stub is a provide dependency
            if(source_obj.type == 'Place'){
                provide_component_obj = component_obj;
                provide_source_obj = source_obj;
                provide_stub_konva = stub;
                provide_component_group = component_group;
                provide_symbol = data_symbol_provide;
                provide_dependency_type = source_obj.dependency_type;
                provide_dependency_obj = dependency_obj;
                // set pointer to dependency obj stub/symbol
                provide_dependency_obj.dep_stub_konva = provide_symbol;
                console.log("PROVIDE dependency type is " + provide_dependency_type);
                // set source selected true
                source_selected = true;
            }
        }
        else if (e.evt.button === 2){
            console.log("Right clicked stub: ", source_obj.name);
            // check if provide stub was selected prior to create connection
            if(source_selected == true){
                // check if connection is going to USE stub
                if(source_obj.type == 'Transition'){
                    // get the use stub dependency type
                    use_dependency_type = source_obj.dependency_type;
                    console.log("USE dependency type is " + use_dependency_type);
                    // check if source stub and dest stub is the same dependency type
                    if((provide_dependency_type == 'PROVIDE' && use_dependency_type == 'USE') || (provide_dependency_type == 'DATA_PROVIDE' && use_dependency_type == 'DATA_USE')){
                        use_component_obj = component_obj;
                        // check if provide stub component is different from use stub component
                        if(provide_component_obj != use_component_obj){
                            use_source_obj = source_obj;
                            use_stub_konva = stub;
                            use_component_group = component_group;
                            use_dependency_obj = dependency_obj;
                            // set pointer to dependency obj stub/symbol
                            use_dependency_obj.dep_stub_konva = data_stub_use;
                            // check if connection already exists between these two depedencies
                            if(!checkConnectionExist(provide_dependency_obj, use_dependency_obj)){
                                //provide_symbol.opacity(1);
                                provide_dependency_obj.dep_stub_konva.opacity(1);
                                use_dependency_obj.dep_stub_konva.opacity(1);
                                // check if arc is visible
                                // if(provide_symbol.opacity() == 0){
                                //     // make things visible
                                //     provide_symbol.opacity(1);
                                //     data_stub_use.opacity(1);
                                // }
                                // create new connection here
                                connection_obj = addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group, provide_dependency_obj, use_dependency_obj);
                            } else {
                                alert("Connection already exists between these two dependencies");
                            }
                        } else {
                            alert("Cant create connection from " + provide_component_obj.name + " to " + use_component_obj.name);
                        }
                    } else {
                        alert("Incompatible dependency types");
                    }
                } else {
                    alert("Left click Provide dependency stub and Right click Use dependency stub to connect them");
                }
            } else {
                // right clk source was not selected, open window for editing
                console.log("Open window for editing " + source_obj.name + " dependency stub details");
                ipcRend.send("change_stub_details", {component: component_obj.name, stub: dependency_obj.name});
            }
            // reset source and dest
            provide_stub_konva = null;
            use_stub_konva = null;
            source_selected = false;
        }
    });

    // add dependency group to dependency obj
    dependency_obj.dep_group_konva = dependency_group;
    // add dependency group to component group
    component_group.add(dependency_group);
    // move dependency group to bottom
    dependency_group.moveToBottom();
    layer.draw();

    return dependency_obj;
}

// func to check if connection already exists in connection list
function checkConnectionExist(provide_dependency_obj, use_dependency_obj){
    for (var i = 0; i < connection_list.length; i++){
        if((connection_list[i].provide_port_obj == provide_dependency_obj && connection_list[i].use_port_obj == use_dependency_obj) ||  
           (connection_list[i].provide_port_obj.source_obj == provide_dependency_obj.source_obj && connection_list[i].use_port_obj.source_obj == use_dependency_obj.source_obj)){
            return true;
        }
    }
    return false;
}
// Catch new stub name from ipcMain
ipcRend.on("stub->renderer", function(event, args) {
    changeStubName(args.component, args.old_name, args.new_name);
});
