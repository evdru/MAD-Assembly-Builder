// Add new connection function, should only be called by provide depedency stub
function addNewConnection(provide_component_obj, provide_source_obj, provide_stub_konva, provide_component_group, use_component_obj, use_source_obj, use_stub_konva, use_component_group) {

    var provide_offset = 15;
    var use_offset = -10;
    var midpoint_x = getMidPointX();
    var midpoint_y = getMidPointY();

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
        if(provide_stub_konva.getAbsolutePosition().y > use_stub_konva.getAbsolutePosition().y || provide_stub_konva.getAbsolutePosition().y < use_stub_konva.getAbsolutePosition().y){
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

    layer.add(connection);
    layer.add(gate1);
    layer.add(gate2);
    layer.draw();
}