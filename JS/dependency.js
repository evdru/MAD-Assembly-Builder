// Add new dependency function, should only be called by place and transition
function addNewDependency(component, source_element, source_obj, component_obj, component_group, tooltipLayer) {

    var offset;
    var add;
    var stub_x;
    var depedency_name;
    // provide connection going right of a place
    if(source_obj.type == 'Place'){
        offset = component.getWidth();
        add = 20;
        stub_x = 0;
        depedency_name = "Provide Dependency from " + source_obj.name;
    } else {
        // use connection going left of a transition
        offset = 0;
        add = -20;
        stub_x = -15;
        depedency_name = "Use Dependency from " + source_obj.name;
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

        var arc = new Konva.Arc({
            x: stub.getX(),
            y: stub.getY(),
            innerRadius: 15,
            outerRadius: 16,
            angle: 180,
            stroke: 'black',
            strokeWidth: 1,
            rotation: 270,
            opacity: 0
          });
    } else {
        // stub for use dependency
        var stub = new Konva.Circle({
            x: dependency.points()[2] + add + stub_x,
            y: dependency.points()[3],
            radius: 8,
            stroke: 'black',
            strokeWidth: 1,
            fill: 'black',
            name: 'stub',
            opacity: 0
        });

        var arc = new Konva.Arc({
            x: stub.getX(),
            y: stub.getY(),
            innerRadius: 15,
            outerRadius: 16,
            angle: 180,
            stroke: 'black',
            strokeWidth: 1,
            rotation: 270
          });
    };

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
        tooltip.text(depedency_name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });
    
    // hide the tooltip on mouse out
    stub.on('mouseout', function(){
        tooltip.hide();
        tooltipLayer.draw();
    });

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
        if(arc != null){
            arc.position({
                x: stub.getX(),
                y: stub.getY()
            });
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
        if(arc != null){
            arc.position({
                x: stub.getX(),
                y: stub.getY()
            });
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
                provide_arc = arc;
            }
        } 
        else if (e.evt.button === 2){
            // check if provide stub was selected prior
            console.log("Right clicked stub: ", source_obj.name);
            if(provide_stub_konva != null){
                if(source_obj.type == 'Transition'){
                    use_component_obj = component_obj;
                    use_source_obj = source_obj;
                    use_stub_konva = stub;
                    use_component_group = component_group;
                    // Dont create connection if both stubs are from the same component
                    if(provide_component_obj != use_component_obj){
                        // check if arc is visible
                        if(provide_arc.opacity() == 0){
                            // make it visible
                            provide_arc.opacity(1);
                        }
                        // create new connection here
                        connection = addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group);
                    } else {
                        alert("Cant create connection from " + provide_component_obj.name + " to " + use_component_obj.name);
                    }
                } else {
                    alert("Left click Provide dependency stub and Right click Use dependency stub to connect them");
                }
            }
            // reset source and dest
            provide_stub_konva = null;
            use_stub_konva = null;
        }
    });

    // add arc if exists
    if(arc != null){
        component_group.add(arc);
    }
    component_group.add(stem);
    component_group.add(stub);
    component_group.add(dependency);
    dependency.moveToBottom();
    layer.draw();
}