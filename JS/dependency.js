// Add new dependency function, should only be called by place and transition
function addNewDependency(component, source_element, source_obj, component_obj, component_group) {

    var pos_x;
    var offset;
    console.log(source_element.getX());
    // provide connection
    if(source_obj.type == 'Place'){
        pos_x = component.getX() + (component.getWidth() * component.scaleX());
        offset = 20;
    } else {
        // use connection
        pos_x = component.getX();
        offset = -20;
    };

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), pos_x, source_element.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: 'dependency',
        tension: 0,
        dash: [10, 5],
        listening: true
    });

    var stub = new Konva.Circle({ 
        x: dependency.points()[2] + offset,
        y: dependency.points()[3],
        radius: 10,
        stroke: 'black',
        strokeWidth: 1,
        fill: 'black',
        name: 'stub',
        ShadowBlur: 1,
        listening: true
    });

    // when the source element moves
    source_element.on('xChange yChange dragmove', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              pos_x * component.scaleX(),
                              source_element.getY()]);
        stub.position({
            x: dependency.points()[2] + offset,
            y: dependency.points()[3]
        });
        layer.draw();
    });

     // when the source element moves
     component.on('xChange', (e) => {
        dependency.setPoints([source_element.getX(),
                              source_element.getY(),
                              pos_x * component.scaleX(),
                              source_element.getY()]);
        stub.position({
            x: dependency.points()[2] + offset,
            y: dependency.points()[3]
        });
        layer.draw();
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