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

    // create simulator button
    simulatorLabel = createSimulatorLabel();
    animLayer.add(simulatorLabel);
    // create play button
    playLabel = createPlayButton();
    animLayer.add(playLabel);
    // create pause button
    pauseLabel = createPauseButton();
    animLayer.add(pauseLabel);
    
    // for every component
    for (var i = 0; i < sd_comp_list.length; i++) {
        // check if component has places
        if (sd_comp_list[i].place_list.length > 0){
            // create a token for every component
            var token = createTokens(sd_comp_list[i], playLabel, pauseLabel, animLayer);

        } else {
            console.log(sd_comp_list[i].name + " did not have a place!");
        } 
    };

    // animLayer.add(tokenGroup);
    animLayer.draw();
    return;
});

function createSimulatorLabel(){
    // simulator label
    var simulatorLabel = new Konva.Label({
        x: 400,
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

function createPlayButton(){
     // play label
     var playLabel = new Konva.Label({
        x: 150,
        y: 10,
        opacity: 1
    });

    playLabel.add(new Konva.Tag({
        fill: 'green'
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
        fill: 'RED'
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

function createTokens(component, playLabel, pauseLabel, animLayer){
    // check if current component has first place
    var tokenPos = component.place_list[0].place_konva.getAbsolutePosition();
    // create a token on the first place
    console.log("Creating tokens for " + component.name + " at " + component.place_list[0].name);
    console.log("Place 1 position is " + tokenPos.x + " " + tokenPos.y);
    var tokenColor = getRandomColor();

    // create token for every outbound transition
    for (var tran_num = 0; tran_num < component.place_list[0].transition_outbound_list.length; tran_num++){
        var token = new Konva.Circle({
            x: tokenPos.x,
            y: tokenPos.y,
            radius: 8,
            fill: tokenColor,
            opacity: 1
        });
        animLayer.add(token);

        var transition = component.place_list[0].transition_outbound_list[0].tran_konva;
        var tran_pos = transition.getAbsolutePosition();
        var dest_pos_x = tran_pos.x + transition.points()[2];
        var dest_post_y = tran_pos.y + transition.points()[3];
        moveToken(token, dest_pos_x, dest_post_y, playLabel, pauseLabel);
        var dest_pos_x = tran_pos.x + transition.points()[4];
        var dest_post_y = tran_pos.y + transition.points()[5];
        moveToken(token, dest_pos_x, dest_post_y, playLabel, pauseLabel);
    }
    return token;
}

function moveToken(token, dest_pos_x, dest_post_y, playLabel, pauseLabel){
    // the tween has to be created after the node has been added to the layer
    var tween = new Konva.Tween({
        node: token,
        duration: 3,
        x: dest_pos_x,
        y: dest_post_y,
        opacity: 1,
        // onFinish: function() {
        //     console.log('tween finished!');
        // }
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
