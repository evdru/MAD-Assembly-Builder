// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sd_electron = require('electron');
const sd_ipcRenderer = sd_electron.ipcRenderer;

var sd_app = electron.remote; 
var sd_dialog = app.dialog;
var sd_comp_list = [];
var sd_con_list = [];
var token_list = [];
var simulator_mode = true;

class Token{
    constructor(name, start_position){
        this.name = name;
        this.start_position;
        this.konva_circle;
    }
}

sd_ipcRenderer.on('simulate_deployment', function() {

    // set references to global lists
    sd_comp_list = component_list;
    sd_con_list = connection_list;
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
    var simulationGroup = new Konva.Group();

    // create simulator button
    simulatorLabel = createSimulatorLabel();
    simulationGroup.add(simulatorLabel);
    // create play button
    playLabel = createPlayButton();
    simulationGroup.add(playLabel);
    // create pause button
    pauseLabel = createPauseButton();
    simulationGroup.add(pauseLabel);
    // create reset button
    resetLabel = createResetButton();
    simulationGroup.add(resetLabel);
    // create edit mode button
    editButton = createEditModeButton();
    simulationGroup.add(editButton);

    animLayer.add(simulationGroup);

    editButton.on('click', function(e){
        // for every component
        for (var i = 0; i < sd_comp_list.length; i++) {
            setListening(sd_comp_list[i]);
            simulator_mode = false;
        }
        resetHighlights();
        destroyTokens();
        simulationGroup.destroy();
        animLayer.destroy();
        sd_comp_list = [];
        sd_con_list = [];
        console.log("clicked on edit mode label");
    });

    // simulatorLabel.on('click', function(e){
    //     // for every component
    //     for (var i = 0; i < sd_comp_list.length; i++) {
    //         setNotListening(sd_comp_list[i]);
    //         simulator_mode = true;
    //     }
    //     console.log("clicked on simulator mode label");
    // });
    
    // for every component
    for (var i = 0; i < sd_comp_list.length; i++) {
        // check if component has places
        if (sd_comp_list[i].place_list.length > 0){
            // set not listening 
            setNotListening(sd_comp_list[i]);
            // create a token for every component
            var place_num = 0;
            var tokenColor = getRandomColor();
            var token = createTokens(sd_comp_list[i], playLabel, pauseLabel, resetLabel, place_num, animLayer, tokenColor);
        } else {
            console.log(sd_comp_list[i].name + " did not have a place!");
        } 
    };

    // animLayer.add(tokenGroup);
    animLayer.draw();
    return;
});

function createPlayButton(){
     // play label
     var playLabel = new Konva.Label({
        x: 150,
        y: 10,
        opacity: 1
    });

    playLabel.add(new Konva.Tag({
        fill: 'green',
        stroke: 'black',
       strokeWidth: 2
    }));

    playLabel.add(new Konva.Text({
        text: 'PLAY',
        fontFamily: 'Calibri',
        fontSize: 36,
        padding: 5,
        fill: 'black'
    }));
    return playLabel;
}

function createPauseButton(){
     // pause label
     var pauseLabel = new Konva.Label({
        x: 250,
        y: 10,
        opacity: 1
    });

    pauseLabel.add(new Konva.Tag({
        fill: 'RED',
        stroke: 'black',
       strokeWidth: 2
    }));

    pauseLabel.add(new Konva.Text({
        text: 'PAUSE',
        fontFamily: 'Calibri',
        fontSize: 36,
        padding: 5,
        fill: 'black'
    }));
    return pauseLabel;
}

function createResetButton(){
    // reset label
    var resetLabel = new Konva.Label({
       x: 375,
       y: 10,
       opacity: 1
   });

   resetLabel.add(new Konva.Tag({
       fill: 'BLUE',
       stroke: 'black',
       strokeWidth: 2
   }));

   resetLabel.add(new Konva.Text({
       text: 'RESET',
       fontFamily: 'Calibri',
       fontSize: 36,
       padding: 5,
       fill: 'black'
   }));
   return resetLabel;
}

function createSimulatorLabel(){
    // simulator label
    var simulatorLabel = new Konva.Label({
        x: 520,
        y: 10,
        opacity: 1
    });

    simulatorLabel.add(new Konva.Tag({
        fill: 'white'
    }));

    simulatorLabel.add(new Konva.Text({
        text: 'SIMULATOR MODE',
        fontFamily: 'Calibri',
        fontSize: 36,
        padding: 5,
        fill: 'black'
    }));
    return simulatorLabel;
}

function createEditModeButton(){
    // edit mode label
    var editLabel = new Konva.Label({
        x: 900,
        y: 10,
        opacity: 1
    });

    editLabel.add(new Konva.Tag({
        fill: 'white'
    }));

    editLabel.add(new Konva.Text({
        text: 'Go back to EDIT mode',
        fontFamily: 'Calibri',
        fontSize: 36,
        padding: 5,
        fill: 'black'
    }));
    return editLabel;
}

function resetHighlights(){
    for (var i = 0; i < sd_comp_list.length; i++) {
        for (var j = 0; j < sd_comp_list[i].place_list.length; j++){
            // show that the new place has been reached
            sd_comp_list[i].place_list[j].place_konva.stroke('black');
            sd_comp_list[i].place_list[j].place_konva.strokeWidth(1);
        }
    }
    layer.draw();
}

function destroyTokens(){
    for (var i = 0; i < token_list.length; i++) {
        token_list[i].konva_circle.destroy();
        token_list.splice( token_list.indexOf(token_list[i]), 1 );
    }
}

function setNotListening(component){
    component.component_group_konva.listening(false);
    layer.drawHit();
}

function setListening(component){
    component.component_group_konva.listening(true);
    layer.drawHit();
}

function createTokens(component, playLabel, pauseLabel, resetLabel, place_num, animLayer, tokenColor){
    // check if current component has first place
    var tokenPos = component.place_list[place_num].place_konva.getAbsolutePosition();

    console.log("Creating tokens for " + component.name + " at " + component.place_list[0].name);
    console.log("Place 1 position is " + tokenPos.x + " " + tokenPos.y);

    // create token for every outbound transition
    for (var tran_num = 0; tran_num < component.place_list[place_num].transition_outbound_list.length; tran_num++){
        var token = new Konva.Circle({
            x: tokenPos.x,
            y: tokenPos.y,
            radius: 8,
            fill: tokenColor,
            opacity: 1
        });

        // create token obj
        var token_obj = new Token(token_list.length + 1, tokenPos);
        // add konva cricle ref to token obj
        token_obj.konva_circle = token;
        // add konva token to animLayer
        animLayer.add(token);

        var transition = component.place_list[place_num].transition_outbound_list[tran_num].tran_konva;
        var tran_pos = transition.getAbsolutePosition();
        // var dest_pos_x = tran_pos.x + transition.points()[2];
        // var dest_post_y = tran_pos.y + transition.points()[3];
        //moveToken(token, dest_pos_x, dest_post_y, playLabel, pauseLabel);
        var dest_pos_x = tran_pos.x + transition.points()[4];
        var dest_post_y = tran_pos.y + transition.points()[5];
        moveToken(component, token, dest_pos_x, dest_post_y, playLabel, pauseLabel, resetLabel, place_num, tran_num, tokenColor, animLayer);

    }
    return token;
}

function moveToken(component, token, dest_pos_x, dest_post_y, playLabel, pauseLabel, resetLabel, place_num, tran_num, tokenColor, animLayer){
    // get new place for every transition
    var new_pos = component.place_list[place_num].transition_outbound_list[tran_num].dest;
    
    if(place_num == 0){
        // show that the place has been reached
        component.place_list[place_num].place_konva.stroke('green');
        component.place_list[place_num].place_konva.strokeWidth(3);
        component.place_list[place_num].place_konva.draw();
    }

    console.log("new place name is " + new_pos.name + " and index is " + new_pos.index);
    // the tween has to be created after the node has been added to the layer
    var tween = new Konva.Tween({
        node: token,
        duration: 4,
        x: dest_pos_x,
        y: dest_post_y,
        opacity: 1,
        onFinish: function() {
            if(new_pos.place_konva.stroke() == 'black'){
                // show that the new place has been reached
                new_pos.place_konva.stroke('green');
                new_pos.place_konva.strokeWidth(3);
                new_pos.place_konva.draw();
            }
            // check if new pos has outbound transitions
            if (new_pos.transition_outbound_list.length > 0){
                token.destroy();
                animLayer.batchDraw();
                createTokens(component, playLabel, pauseLabel, resetLabel, new_pos.index - 1, animLayer, tokenColor);
            }
        }
    });

    if (place_num != 0){
        tween.play();
    }

    playLabel.on('click', function(e){
        tween.play();
        console.log("clicked on play label");
    });

    pauseLabel.on('click', function(e){
        tween.pause();
        console.log("clicked on pause label");
    });

    resetLabel.on('click', function(e){
        // tween.reset();
        // resetPlaces();
        // animLayer.batchDraw();
        console.log("clicked on reset label");
    });
}

function finishTransition(token, dest_pos_x, dest_post_y, playLabel, pauseLabel){
    // the tween has to be created after the node has been added to the layer
    var tween = new Konva.Tween({
        node: token,
        duration: 3,
        x: dest_pos_x,
        y: dest_post_y,
        opacity: 1,
    });

    playLabel.on('click', function(e){
        tween.play();
        console.log("clicked on play label");
    });

    pauseLabel.on('click', function(e){
        tween.pause();
        console.log("clicked on pause label");
    });
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
