// Add new connection function, should only be called by provide depedency stub
function addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group) {

    var connection = new Konva.Line({
        points: [provide_stub_konva.getAbsolutePosition().x, provide_stub_konva.getAbsolutePosition().y, use_stub_konva.getAbsolutePosition().x, use_stub_konva.getAbsolutePosition().y],
        stroke: 'black',
        strokeWidth: 1,
        name: 'connection',
        lineCap: 'round',
        lineJoin: 'round',
        tension : 1
    });

    // when the provide dependency moves
    provide_stub_konva.on('xChange yChange', (e) => {
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x, 
                              provide_stub_konva.getAbsolutePosition().y, 
                              use_stub_konva.getAbsolutePosition().x, 
                              use_stub_konva.getAbsolutePosition().y]);
    });

    // when the provide component moves
    provide_component_group.on('xChange yChange', (e) => {
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x, 
                              provide_stub_konva.getAbsolutePosition().y, 
                              use_stub_konva.getAbsolutePosition().x, 
                              use_stub_konva.getAbsolutePosition().y]);
    });

    // when the provide dependency moves
    use_stub_konva.on('xChange yChange', (e) => {
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x,
                              provide_stub_konva.getAbsolutePosition().y, 
                              use_stub_konva.getAbsolutePosition().x, 
                              use_stub_konva.getAbsolutePosition().y]);
    });

    // when the provide component moves
    use_component_group.on('xChange yChange', (e) => {
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x, 
                              provide_stub_konva.getAbsolutePosition().y, 
                              use_stub_konva.getAbsolutePosition().x, 
                              use_stub_konva.getAbsolutePosition().y]);
    });

    layer.add(connection);
    layer.draw();

}