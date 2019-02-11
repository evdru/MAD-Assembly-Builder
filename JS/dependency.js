// Add new dependency function, should only be called by place and transition
function addNewDependency(component, source_element, source_obj, component_obj, component_group, tooltipLayer) {

    var offset;
    var add;
    var depedency_name;
    console.log(source_element.getX());
    // provide connection going right of a place
    if(source_obj.type == 'Place'){
        offset = component.getWidth();
        add = 20;
        depedency_name = "Provide Dependency from " + source_obj.name;
    } else {
        // use connection going left of a transition
        offset = 0;
        add = -20;
        depedency_name = "Use Dependency from " + source_obj.name;
    };

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), (component.getX() + offset * component.scaleX()) + add, source_element.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'dependency',
        tension: 0,
        dash: [10, 5],
        listening: true
    });

    var stub = new Konva.Circle({
        x: dependency.points()[2],
        y: dependency.points()[3],
        radius: 10,
        stroke: 'black',
        strokeWidth: 1,
        fill: 'black',
        name: 'stub',
        ShadowBlur: 1,
        listening: true
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
        // layer.draw();
    });

    // when the source element moves
    source_element.on('xChange yChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              component.getX() + offset * component.scaleX(),
                              source_element.getY()]);
        stub.position({
            x: dependency.points()[2] + add,
            y: dependency.points()[3]
        });
        //layer.draw();
    });

     // when the source element moves
     component.on('xChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              component.getX() + offset * component.scaleX(),
                              source_element.getY()]);
        stub.position({
            x: dependency.points()[2] + add,
            y: dependency.points()[3]
        });
        // layer.draw();
    });

    // if a click over stub
    stub.on("click", function(e){
        if (e.evt.button === 0){
            // first left click
            console.log("Left clicked stub: ", source_obj.name);
        };
    });

    component_group.add(stub);
    component_group.add(dependency);
    dependency.moveToBottom();
    layer.draw();
}