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

    // selection area used for created USE dependences from this component
    var use_selection_area = new Konva.Rect({
        x: 0,
        y: 0,
        width: 15,
        height: 350,
        opacity: 0,
        name: 'use_selection_area'
    });

    // selection area used for created USE dependences from this component
    var provide_selection_area = new Konva.Rect({
        x: component.getWidth() - 15,
        y: 0,
        width: 15,
        height: 350,
        opacity: 0,
        name: 'provide_selection_area'
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
    var component_obj = new Component('Component', "Component_" + generateNextIndex(component_list));
    component_obj.index = generateNextIndex(component_list);
    component_obj.component_group_konva = component_group;
    component_obj.konva_component = component;
    component_obj.use_selection_area = use_selection_area;
    component_obj.provide_selection_area = provide_selection_area;
    component_obj.tooltipLayer = tooltipLayer;
    component_list.push(component_obj);

    component_group.add(component);
    component_group.add(use_selection_area);
    component_group.add(provide_selection_area);
    layer.add(component_group);
    layer.draw();

    // event1: on left-click
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
            var tr = new Konva.Transformer({
                rotateEnabled: false,
                enabledAnchors: ['middle-right', 'bottom-center', 'bottom-right'] // ¯\_(ツ)_/¯
            });
            e.target.getParent().add(tr);
            tr.attachTo(e.target);
            layer.draw();

        }

    });

    // event2: on right-click
    component.on("click", function(e){

        if (e.evt.button === 2){

            // highlight the component
            component.stroke('blue');
            component.strokeWidth(3);
            component.draw();

            // open window for editing
            ipcRend.send("change_component_details", {component_name: component_obj.name});

        };

    });

    // event3: on double left-click
    component.on('dblclick', function (e){

        if (e.evt.button === 0){

            // what is transform of parent element?
            var transform = component.getParent().getAbsoluteTransform().copy();

            // to detect relative position we need to invert transform
            transform.invert();

            // now we find relative point
            var pos = stage.getPointerPosition();
            var placePos = transform.point(pos);

            // grow component here
            var place_obj = addNewPlace(component_obj, placePos);

            layer.draw();

        }

    });

    // event4: on component position changed
    component.on('xChange yChange', function () {

        // set use selection area position on component move or scale
        use_selection_area.position({
            x: component.getX(),
            y: component.getY()
        });

        use_selection_area.height(component.getHeight() * component.scaleY());

        // set provide selection area position on component move or scale
        provide_selection_area.position({
            x: component.getX() + (component.getWidth() * component.scaleX()) - 15,
            y: component.getY()
        })

        provide_selection_area.height(component.getHeight() * component.scaleY());

    });

    // event5: on component being moved
    component_group.on('dragmove', (e) => {

        tooltip.hide();
        tooltipLayer.draw();

    });

    // event6: on drag end
    component_group.on('dragend', (e) => {

        component_group.position({
          x: snapToGrid(component_group.x()),
          y: snapToGrid(component_group.y())
        });

        layer.batchDraw();

    });

    // event7: on mouse move within component
    component.on('mousemove', function () {

        var mousePos = stage.getPointerPosition();

        tooltip.position({
            x : mousePos.x + 10,
            y : mousePos.y + 10
        });

        tooltip.text(component_obj.name);
        tooltip.show();
        tooltipLayer.batchDraw();

    });

    // event8: on mouse over component
    component.on("mouseover", function(e){

        window.addEventListener('keydown', removeComponent);

    });

    // event9: on mouse out
    component.on("mouseout", function(){

        component.stroke('black');
        component.strokeWidth(1);
        tooltip.hide();
        tooltipLayer.draw();
        window.removeEventListener('keydown', removeComponent);

    });

    function generateNextIndex(component_list) {

        if(component_list.length == 0) {
            return 1;
        } else {
            return component_list[component_list.length-1].index+1;
        }

    }

    function removeComponent(ev){

        // keyCode Delete key
        if (ev.keyCode === 46 || ev.keyCode == 8) {

            if (confirm('Are you sure you want to delete this Component? You will lose everything inside of it.')){
                // Delete it!
                deletor(component_obj);
                //removeComponentObj(component_obj);
                // component_obj.component_group_konva.destroy();
                // layer.batchDraw();
            } else {
                // Do nothing!
                return;
            }

        }

    };

    return component_obj;

};

// Catch new component name from ipcMain
ipcRend.on("component->renderer", function(event, args) {

    changeComponentName(args.component_name, args.name);

});
