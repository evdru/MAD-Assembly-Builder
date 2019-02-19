// Add new Service dependency function, should only be called by place and transition
function addNewServiceDependency(component, source_element, source_obj, component_obj, component_group, tooltipLayer) {
    var offset;
    var add;
    var stub_x;

    // provide connection going right of a place
    if(source_obj.type == 'Place') {
        // create the dependency object
        var dependency_obj = new Dependency('PROVIDE', "Dependency_" + (component_obj.dependency_list.length + 1));
        component_obj.dependency_list.push(dependency_obj);
        console.log('Created new PROVIDE dependency dock'); 
        offset = component.getWidth();
        add = 20;
        stub_x = 0;
    } else if (source_obj.type == 'Transition') {
        // create the dependency object
        var dependency_obj = new Dependency('USE', "Dependency_" + (component_obj.dependency_list.length + 1));
        component_obj.dependency_list.push(dependency_obj); 
        console.log('Created new USE dependency dock');
        // use connection going left of a transition
        offset = 0;
        add = -20;
        stub_x = -15;
    };

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), (component.getX() + offset * component.scaleX()), source_element.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'dependency',
        tension: 0,
        dash: [10, 5],
        listening: true
    });

    var stem = new Konva.Line({
        points: [component.getX() + offset * component.scaleX(), source_element.getY(), (component.getX() + offset * component.scaleX()) + add, source_element.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'stem',
        tension: 0,
    });

    // stub for provide dependency
    if(source_obj.type == 'Place'){
        var stub = getServiceStub();
        var symbol = getServiceSymbol();
        symbol.opacity(0);
    }
    else if(source_obj.type == 'Transition') {
        // stub for use dependency
        var stub = getServiceStub();
        stub.opacity(0);
        var symbol = getServiceSymbol();
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
        if (ev.keyCode === 46) {
            if (confirm('Are you sure you want to delete this dependency?')){
                // Delete it!
                dependency.destroy();
                stem.destroy();
                stub.destroy();
                symbol.destroy();
                tooltip.destroy();
                layer.draw();

                // remove connection if created from dependency stub

                // set source_obj dependency boolean to false
                source_obj.dependency = false;

                // remove the depedency obj from its components dependency list
                removeDependencyObj(component_obj, dependency_obj);
                layer.batchDraw();
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
                              source_element.getY()]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY(),
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY()]);
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
                              source_element.getY()]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY(),
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY()]);

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
            console.log("Left clicked stub: ", source_obj.name);
            // check if stub is a provide
            if(source_obj.type == 'Place'){
                provide_component_obj = component_obj;
                provide_source_obj = source_obj;
                provide_stub_konva = stub;
                provide_component_group = component_group;
                provide_symbol = symbol;
                provide_dependency_type = source_obj.dependency_type;
                console.log("PROVIDE dependency type is " + provide_dependency_type);
                // set source selected true
                source_selected = true;
            }
        } else if (e.evt.button === 2) {
            // check if provide stub was selected prior
            if(source_selected){
                // make sure connection is going to USE stub
                if(source_obj.type == 'Transition'){
                    // get the use stub depedency type
                    use_dependency_type = source_obj.dependency_type;
                    console.log("USE dependency type is " + use_dependency_type);
                    // check if source stub and dest stub is the same dependency type
                    if((provide_dependency_type == 'PROVIDE' && use_dependency_type == 'USE') || (provide_dependency_type == 'DATA_PROVIDE' && use_dependency_type == 'DATA_USE')){
                        use_component_obj = component_obj;
                        // Check if connection is going to a different component
                        if(provide_component_obj != use_component_obj){
                            use_source_obj = source_obj;
                            use_stub_konva = stub;
                            use_component_group = component_group;
                            // check if arc is visible
                            if(provide_symbol.opacity() == 0){
                                // make it visible
                                provide_symbol.opacity(1);
                                use_stub_konva.opacity(1);
                            }
                            // create new connection here
                            connection = addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group);
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
                console.log("Open window for editing " + source_obj.name + " stub details");
                ipcRenderer.send("change_stub_details", {component: component_obj.name, stub: dependency_obj.name});
            }
            // reset source and dest
            provide_stub_konva = null;
            use_stub_konva = null;
            source_selected = false;
        }
    });

    // add arc if exists
    if(symbol != null){
        component_group.add(symbol);
    }
    component_group.add(stem);
    component_group.add(stub);
    component_group.add(dependency);
    dependency.moveToBottom();
    layer.draw();

    // Catch new stub name from ipcMain
    ipcRenderer.on("stub->renderer", function(event, args) {
        changeStubName(args.component, args.old_name, args.new_name);
    });
}

// Add new Service dependency function, should only be called by place and transition
function addNewDataDependency(component, source_element, source_obj, component_obj, component_group, tooltipLayer) {
    var offset;
    var add;
    var stub_x;
    var depedency_name;

    var stub;
    var data_stub_provide;
    var data_symbol_provide;
    var data_stub_use;
    var data_symbol_use;

    // provide connection going right of a place
    if(source_obj.type == 'Place'){
        // create the dependency object
        var dependency_obj = new Dependency('DATA_PROVIDE', "Dependency_" + (component_obj.dependency_list.length + 1));
        component_obj.dependency_list.push(dependency_obj);
        console.log('Created new DATA_PROVIDE dependency dock');
        offset = component.getWidth();
        add = 20;
        stub_x = -5;
        depedency_name = dependency_obj.type + " Provide Dependency from " + source_obj.name;
    } else if (source_obj.type == 'Transition') {
        // create the dependency object
        var dependency_obj = new Dependency('DATA_USE', "Dependency_" + (component_obj.dependency_list.length + 1));
        component_obj.dependency_list.push(dependency_obj);
        console.log('Created new DATA_USE dependency dock');
        // use connection going left of a transition
        offset = 0;
        add = -20;
        stub_x = 0;
        depedency_name = dependency_obj.type + " Use Dependency from " + source_obj.name;
    };

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), (component.getX() + offset * component.scaleX()), source_element.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'dependency',
        tension: 0,
        dash: [10, 5],
        listening: true
    });

    var stem = new Konva.Line({
        points: [component.getX() + offset * component.scaleX(), source_element.getY(), (component.getX() + offset * component.scaleX()) + add, source_element.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'stem',
        tension: 0,
    });

    // stub for provide dependency
    if(source_obj.type == 'Place'){
        // Data type
        // make invisible circle for hover
        stub = getDataStubHover();
        data_stub_provide = getDataStubProvide();
        // symbol is invisbile until connection has been established
        data_symbol_provide = getDataSymbolProvide();
        data_symbol_provide.opacity(0);
    }
    else if(source_obj.type == 'Transition') {
        // invisible stub for selection
        stub = getDataStubHover();
        data_stub_use = getDataStubUse();
        data_stub_use.opacity(0);
        data_symbol_use = getDataSymbolUse();
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
        if (ev.keyCode === 46) {
            if (confirm('Are you sure you want to delete this dependency?')){
                // Delete it!
                dependency.destroy();
                stem.destroy();
                stub.destroy();
                if (data_stub_provide) {data_stub_provide.destroy()};
                if (data_symbol_provide) {data_symbol_provide.destroy()};
                if (data_stub_use) {data_stub_use.destroy()};
                if (data_symbol_use) {data_symbol_use.destroy()};
                tooltip.destroy();

                // remove connection if created from dependency stub

                // set source_obj dependency boolean to false
                source_obj.dependency = false;

                // remove the depedency obj from its components dependency list
                removeDependencyObj(component_obj, dependency_obj);
                layer.batchDraw();
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
                              source_element.getY()]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY(),
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY()]);

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
                              source_element.getY()]);
        stem.setPoints([component.getX() + offset * component.scaleX(),
                        source_element.getY(),
                        (component.getX() + offset * component.scaleX()) + add,
                        source_element.getY()]);

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
                console.log("PROVIDE dependency type is " + provide_dependency_type);
                // set source selected true
                source_selected = true;
            }
        } 
        else if (e.evt.button === 2){
            console.log("Right clicked stub: ", source_obj.name);
            // check if provide stub was selected prior to create connection
            if(source_selected){
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
                            // make things visible
                            provide_symbol.opacity(1);
                            data_stub_use.opacity(1);
                            // create new connection here
                            connection = addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group);
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
                ipcRenderer.send("change_stub_details", {component: component_obj.name, stub: dependency_obj.name});
            }
            // reset source and dest
            provide_stub_konva = null;
            use_stub_konva = null;
            source_selected = false;
        }
    });

    // stub for provide dependency
    if(data_stub_provide != null && data_symbol_provide != null){
        component_group.add(data_stub_provide);
        component_group.add(data_symbol_provide);
    }
    else if(data_stub_use != null && data_symbol_use != null) {
        component_group.add(data_stub_use);
        component_group.add(data_symbol_use);
    };
    component_group.add(stem);
    component_group.add(stub);
    component_group.add(dependency);
    dependency.moveToBottom();
    layer.draw();

    // Catch new stub name from ipcMain
    ipcRenderer.on("stub->renderer", function(event, args) {
        changeStubName(args.component, args.old_name, args.new_name);
    });
}