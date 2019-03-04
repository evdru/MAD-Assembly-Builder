// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sd_electron = require('electron');
const sd_ipcRenderer = sd_electron.ipcRenderer;

var sd_app = electron.remote; 
var sd_dialog = app.dialog;
var sd_comp_list = component_list;
var sd_con_list = connection_list;

sd_ipcRenderer.on('simulate_deployment', function() {

    // check if component exists
    if(sd_comp_list.length > 0) {
        console.log("Creating and adding animation layer to stage...");
        // animation layer
        var animLayer = new Konva.Layer();
        stage.add(animLayer);
    } else {
        console.log("Assembly has no components... exiting.");
        return;
    }
    // create a konva group for tokens
    var tokenGroup = new Konva.Group();
    
    // for every component
    for (var i = 0; i < sd_comp_list.length; i++) {
        if (sd_comp_list[i].place_list.length > 0){
            // create a token for every component
            createTokens(sd_comp_list[i], tokenGroup);
        } else {
            console.log(sd_comp_list[i].name + " did not have a place!");
        } 
    };
    animLayer.add(tokenGroup);
    animLayer.draw();
    return;
});

function createTokens(component, tokenGroup){
    // check if current component has first place
    var tokenPos = component.place_list[0].place_konva.getAbsolutePosition();
    // create a token on the first place
    console.log("Creating token for " + component.name + " at " + component.place_list[0].name);
    console.log("Place 1 position is " + tokenPos.x + " " + tokenPos.y);
    var token = new Konva.Circle({
        x: tokenPos.x,
        y: tokenPos.y,
        radius: 8,
        fill: getRandomColor(),
        opacity: 1
    });
    tokenGroup.add(token);
    //component.component_group_konva.add(token);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }