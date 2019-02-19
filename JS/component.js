// Adds a new component to the stage
function addNewComponent(posX, posY) {

    // create a new component group every time a component is created
    var component_group = new Konva.Group({
        x: posX,
        y: posY,
        width: 300,
        height: 350,
        draggable: true,
        name: 'component_group'
    });

    // create the konva node
    var component = new Konva.Rect({
        x: 0,
        y: 0,
        width: 300,
        height: 350,
        stroke: 'black',
        name: 'component',
        strokeWidth: 0.5
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

    var tooltipLayer = new Konva.Layer();
    tooltipLayer.add(tooltip);
    stage.add(tooltipLayer);

    // create a component object and add it to the global list
    var component_obj = new Component('Component', "Component_" + (component_list.length + 1), posX, posY, component_group);
    component_list.push(component_obj);

    component_group.add(component);
    layer.add(component_group);
    layer.draw();

    stage.on('click', function (e) {
        if (e.evt.button === 0) {
            // if click on empty area - remove all transformers
            if (e.target === stage) {
                stage.find('Transformer').destroy();
                layer.draw();
                return;
            }
            // do nothing if clicked NOT on our rectangles
            if (!e.target.hasName('component')) {
                return;
            }
            // remove old transformers
            // TODO: we can skip it if current rect is already selected
            stage.find('Transformer').destroy();

            // create new transformer
            var tr = new Konva.Transformer({rotateEnabled: false});
            e.target.getParent().add(tr);
            tr.attachTo(e.target);
            layer.draw();
        }
    });

    // when component is being dragged
    component_group.on('dragmove', (e) => {
        tooltip.hide();
        tooltipLayer.draw();
    });

    // When drag end entire component group snap to grid
    // easier alignment for component connections
    component_group.on('dragend', (e) => {
        component_group.position({
          x: snapToGrid(component_group.x()),
          y: snapToGrid(component_group.y())
        });
        layer.batchDraw();
    });

    // if mouse is over a component
    component.on('mousemove', function () {
        //console.log(component_obj.name + " over");
        var mousePos = stage.getPointerPosition();
        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });
        tooltip.text(component_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();
    });

    // hide the tooltip on mouse out
    component.on("mouseout", function(){
        //console.log(component_obj.name + " out");
        component.stroke('black');
        component.strokeWidth(1);
        tooltip.hide();
        tooltipLayer.draw();
        //layer.draw();
    });

    // if double click on component
    component.on('dblclick', function (e){
        if (e.evt.button === 0){
            console.log("dbl left click on component click");
            // what is transform of parent element?
            var transform = component.getParent().getAbsoluteTransform().copy();
            // to detect relative position we need to invert transform
            transform.invert();
            // now we find relative point
            var pos = stage.getPointerPosition();
            var placePos = transform.point(pos);
            // grow component here
            var place = addNewPlace(component_group, component, placePos, component_obj, tooltipLayer);
            //layer.add(component_group);
            layer.draw();
        }
    });

    component.on("click", function(e){
        if (e.evt.button === 2){
            // highlight the component
            component.stroke('blue');
            component.strokeWidth(3);
            component.draw();
            // open window for editing
            console.log("Open window for editing component details");
            ipcRenderer.send("change_component_details", {component: component_obj.name});
        };
    });

    // Catch new component name from ipcMain
    ipcRenderer.on("component->renderer", function(event, args) {
        changeComponentName(args.component, args.name);
    });
};
