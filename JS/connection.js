// Add new connection function, should only be called by provide depedency stub
function addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group, provide_dependency_obj, use_dependency_obj) {

    var provide_offset = 15;
    var use_offset = -10;
    var midpoint_x = getMidPointX();
    var midpoint_y = getMidPointY();

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

    var gate1 = new Konva.Line({
        points: getPointsGate1(),
        stroke: 'black',
        strokeWidth: 1,
        name: 'gate',
        lineCap: 'round',
        lineJoin: 'round',
        tension : 0,
        opacity: 1
    });
    var gate2 = new Konva.Line({
        points: getPointsGate2(),
        stroke: 'black',
        strokeWidth: 1,
        name: 'gate',
        lineCap: 'round',
        lineJoin: 'round',
        tension : 0,
        opacity: 1
    });

    // create connection group
    var connection_group = new Konva.Group({
        name: 'connection_group'
    });

    // add konva elements to group
    connection_group.add(connection);
    connection_group.add(gate1);
    connection_group.add(gate2);

    // create the connection object
    var connection_obj = new Connection();

    // set pointers to provide and use dependency ports
    connection_obj.provide_port_obj = provide_dependency_obj;
    connection_obj.use_port_obj = use_dependency_obj;
    connection_obj.gate1_konva = gate1;
    connection_obj.gate2_konva = gate2;
    connection_obj.use_component_name = use_component_obj.name;
    connection_obj.provide_component_name = provide_component_obj.name;
    connection_obj.connection_line_konva = connection;
    connection_obj.connection_group_konva = connection_group;
    // // create pointer to connection_obj from provide_dependency_obj
    provide_dependency_obj.connection_list.push(connection_obj);
    // create pointer to connection_obj from use_dependency_obj
    use_dependency_obj.connection_list.push(connection_obj);

    // add connection to global list
    connection_list.push(connection_obj);
    console.log(connection_list);

    // when the provide dependency moves
    provide_stub_konva.on('xChange yChange', (e) => {
        // recalculate the midpoint
        midpoint_x = getMidPointX();
        midpoint_y = getMidPointY();
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x + provide_offset,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              use_stub_konva.getAbsolutePosition().y,
                              use_stub_konva.getAbsolutePosition().x + use_offset,
                              use_stub_konva.getAbsolutePosition().y]);
        gate1.setPoints(getPointsGate1());
        gate2.setPoints(getPointsGate2());
    });

    // when the provide component moves
    provide_component_group.on('xChange yChange', (e) => {
        // recalculate the midpoint
        midpoint_x = getMidPointX();
        midpoint_y = getMidPointY();
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x + provide_offset,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              use_stub_konva.getAbsolutePosition().y,
                              use_stub_konva.getAbsolutePosition().x + use_offset,
                              use_stub_konva.getAbsolutePosition().y]);
        gate1.setPoints(getPointsGate1());
        gate2.setPoints(getPointsGate2());
    });

    // when the provide dependency moves
    use_stub_konva.on('xChange yChange', (e) => {
        // recalculate the midpoint
        midpoint_x = getMidPointX();
        midpoint_y = getMidPointY();
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x + provide_offset,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              use_stub_konva.getAbsolutePosition().y,
                              use_stub_konva.getAbsolutePosition().x + use_offset,
                              use_stub_konva.getAbsolutePosition().y]);
        gate1.setPoints(getPointsGate1());
        gate2.setPoints(getPointsGate2());
    });

    // when the provide component moves
    use_component_group.on('xChange yChange', (e) => {
        // recalculate the midpoint
        midpoint_x = getMidPointX();
        midpoint_y = getMidPointY();
        connection.setPoints([provide_stub_konva.getAbsolutePosition().x + provide_offset,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              provide_stub_konva.getAbsolutePosition().y,
                              midpoint_x,
                              use_stub_konva.getAbsolutePosition().y,
                              use_stub_konva.getAbsolutePosition().x + use_offset,
                              use_stub_konva.getAbsolutePosition().y]);
        gate1.setPoints(getPointsGate1());
        gate2.setPoints(getPointsGate2());
    });

    function getMidPointX(){
        return ((provide_stub_konva.getAbsolutePosition().x + provide_offset) + (use_stub_konva.getAbsolutePosition().x + use_offset)) / 2;
    }

    function getMidPointY(){
        return ((provide_stub_konva.getAbsolutePosition().y + provide_offset) + (use_stub_konva.getAbsolutePosition().y + use_offset)) / 2;
    }

    function getPointsGate1(){
        var points = [];
        if(provide_stub_konva.getAbsolutePosition().y > use_stub_konva.getAbsolutePosition().y ||
           provide_stub_konva.getAbsolutePosition().y < use_stub_konva.getAbsolutePosition().y) {
            // horizontal gates
            points = [midpoint_x - 15, midpoint_y + 5, midpoint_x + 15, midpoint_y + 5];
        } else {
            // vertical gates
            points = [midpoint_x - 5, midpoint_y - 15, midpoint_x - 5, midpoint_y + 15];
        }
        return points;
    }

    function getPointsGate2(){
        var points = [];
        if(provide_stub_konva.getAbsolutePosition().y > use_stub_konva.getAbsolutePosition().y || provide_stub_konva.getAbsolutePosition().y < use_stub_konva.getAbsolutePosition().y){
            // horizontal gates
            points = [midpoint_x - 15, midpoint_y - 5, midpoint_x + 15, midpoint_y - 5];
        } else {
            // vertical gates
            points = [midpoint_x + 5, midpoint_y - 15, midpoint_x + 5, midpoint_y + 15];
        }
        return points;
    }

    layer.add(connection_group);
    layer.draw();

    return connection_obj;
}
