// Add new connection function, should only be called by provide depedency stub
function addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group) {

    var provide_offset = 10;
    var use_offset = -10;
    var midpoint_x = ((provide_stub_konva.getAbsolutePosition().x + provide_offset) + (use_stub_konva.getAbsolutePosition().x + use_offset)) / 2;

    // connection being made, set use stub opacity to 1
    use_stub_konva.opacity(1);

    var connection = new Konva.Line({
        points: [provide_stub_konva.getAbsolutePosition().x + provide_offset, 
                 provide_stub_konva.getAbsolutePosition().y, 
                 midpoint_x,
                 provide_stub_konva.getAbsolutePosition().y,
                 midpoint_x,
                 use_stub_konva.getAbsolutePosition().y,
                 use_stub_konva.getAbsolutePosition().x + use_offset, 
                 use_stub_konva.getAbsolutePosition().y],
        stroke: 'black',
        strokeWidth: 1,
        name: 'connection',
        lineCap: 'round',
        lineJoin: 'round',
        tension : 0
    });

    // when the provide dependency moves
    provide_stub_konva.on('xChange yChange', (e) => {
        // recalculate the midpoint
        midpoint_x = ((provide_stub_konva.getAbsolutePosition().x + provide_offset) + (use_stub_konva.getAbsolutePosition().x + use_offset)) / 2;
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x + provide_offset, 
                              provide_stub_konva.getAbsolutePosition().y, 
                              midpoint_x,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              use_stub_konva.getAbsolutePosition().y,
                              use_stub_konva.getAbsolutePosition().x + use_offset, 
                              use_stub_konva.getAbsolutePosition().y]);
    });

    // when the provide component moves
    provide_component_group.on('xChange yChange', (e) => {
        // recalculate the midpoint
        midpoint_x = ((provide_stub_konva.getAbsolutePosition().x + provide_offset) + (use_stub_konva.getAbsolutePosition().x + use_offset)) / 2;
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x + provide_offset, 
                              provide_stub_konva.getAbsolutePosition().y, 
                              midpoint_x,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              use_stub_konva.getAbsolutePosition().y,
                              use_stub_konva.getAbsolutePosition().x + use_offset,
                              use_stub_konva.getAbsolutePosition().y]);
    });

    // when the provide dependency moves
    use_stub_konva.on('xChange yChange', (e) => {
        // recalculate the midpoint
        midpoint_x = ((provide_stub_konva.getAbsolutePosition().x + provide_offset) + (use_stub_konva.getAbsolutePosition().x + use_offset)) / 2;
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x + provide_offset, 
                              provide_stub_konva.getAbsolutePosition().y, 
                              midpoint_x,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              use_stub_konva.getAbsolutePosition().y,
                              use_stub_konva.getAbsolutePosition().x + use_offset, 
                              use_stub_konva.getAbsolutePosition().y]);
    });

    // when the provide component moves
    use_component_group.on('xChange yChange', (e) => {
        // recalculate the midpoint
        midpoint_x = ((provide_stub_konva.getAbsolutePosition().x + provide_offset) + (use_stub_konva.getAbsolutePosition().x + use_offset)) / 2;
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x + provide_offset, 
                              provide_stub_konva.getAbsolutePosition().y, 
                              midpoint_x,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              use_stub_konva.getAbsolutePosition().y,
                              use_stub_konva.getAbsolutePosition().x + use_offset, 
                              use_stub_konva.getAbsolutePosition().y]);
    });

    layer.add(connection);
    layer.draw();

}