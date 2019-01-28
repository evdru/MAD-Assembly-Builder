var layer = "global";
var stage = "global";
let component_count = 0;
let place_count = 0;
var component_list = [];
var place_list = [];

function initialize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height
    });
    
    layer = new Konva.Layer();
    stage.add(layer);
    
    stage.on('click tap', function (e) {
        // if click on empty area - remove all transformers
        if (e.target === stage) {
            stage.find('Transformer').destroy();
            layer.draw();
            return;
        }
        // do nothing if clicked NOT on our rectangles
        if (!e.target.hasName('rect')) {
            return;
        }
        // remove old transformers
        // TODO: we can skip it if current rect is already selected
        stage.find('Transformer').destroy();
    
        // create new transformer
        var tr = new Konva.Transformer();
        layer.add(tr);
        tr.attachTo(e.target);
        layer.draw();
    });
};

function addNewComponent() {
    var component = new Konva.Rect({
        x: 500,
        y: 500,
        width: 100,
        height: 100,
        stroke: 'black',
        strokeWidth: 0.5,
        name: 'component',
        draggable: true
    });
    layer.add(component);
    layer.draw();

    component_count++;
    component_list.push(component)

    stage.on('click tap', function (e) {
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
        var tr = new Konva.Transformer();
        layer.add(tr);
        tr.attachTo(e.target);
        layer.draw();
    });
};

function addNewPlace() {
    var place = new Konva.Circle({
        x: 500,
        y: 500,
        radius: 30,
        stroke: 'black',
        strokeWidth: 1,
        name: 'place',
        draggable: true
    });
    layer.add(place);
    layer.draw();

    place_count++;
    place_list.push(place);
};