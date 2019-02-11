// Add new dependency function, should only be called by place and transition
function addNewDependency(component, source_element, component_obj, place_obj, component_group) {

    var dependency = new Konva.Line({
        points: [source_element.getX(), source_element.getY(), (component.getX() * component.scaleX() + component.getWidth()), source_element.getY()],
        stroke: 'black',
        strokeWidth: 1,
        name: "provide_dependency",
        tension: 0,
        dash: [10, 5]
    });

    source_element.on('dragmove', (e) => {
        dependency.setPoints([snapToGrid(source_element.getX()),
                              snapToGrid(source_element.getY()),
                              snapToGrid((component.getX() * component.scaleX() + component.getWidth())),
                              snapToGrid(source_element.getY())]);
        layer.draw();
    });

    component_group.add(dependency);
    dependency.moveToBottom();
    layer.draw();
};