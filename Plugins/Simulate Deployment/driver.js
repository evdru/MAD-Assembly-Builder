// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sd_electron = require('electron');
const Timer = require('tiny-timer');
const sd_ipcRenderer = sd_electron.ipcRenderer;

var sd_app = electron.remote; 
var sd_dialog = app.dialog;
var sd_comp_list = [];
var sd_con_list = [];
var token_list = [];
var token_tweens = [];
var simulator_mode = true;

class Token{
    constructor(name, start_position){
        this.name = name;
        this.start_position = start_position;
        this.konva_circle;
        this.tween_konva;
    }
}

sd_ipcRenderer.on('simulate_deployment', function() {
    bootstrap();
});

function bootstrap() {
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

    // Send message to main thread to change to the simulator menu
    sd_ipcRenderer.send('enter_simulator_mode');

    // create a konva group for tokens
    var simulationGroup = new Konva.Group();

    // create simulator button
    simulatorLabel = createSimulatorLabel();
    simulationGroup.add(simulatorLabel);

    animLayer.add(simulationGroup);

    sd_ipcRenderer.on('exit_simulator_mode', function(e){
        // for every component
        for (var i = 0; i < sd_comp_list.length; i++) {
            setListening(sd_comp_list[i]);
            simulator_mode = false;
        }
        resetHighlights();
        destroyTokens();
        destroyTokenTweens();
        simulationGroup.destroy();
        animLayer.destroy();
        sd_comp_list = [];
        sd_con_list = [];
        console.log("clicked on edit mode label");
    });

    // create global timer
    // let timer = new Timer({ interval: 500, stopwatch: true });

    // for every component
    for (var i = 0; i < sd_comp_list.length; i++) {
        // check if component has places
        if (sd_comp_list[i].place_list.length > 0){
            // create timer label
            timerLabel = createTimerLabel(sd_comp_list[i].component_group_konva, sd_comp_list[i].konva_component);
            simulationGroup.add(timerLabel);
            // set not listening 
            setNotListening(sd_comp_list[i]);
            // create a token for every component
            var place_num = 0;
            var tokenColor = getRandomColor();
            tokenHandler(sd_comp_list[i], place_num, animLayer, tokenColor);
        } else {
            console.log(sd_comp_list[i].name + " did not have a place!");
        }
    };

    // timer event listeners
    // timer.on('tick', (ms) => console.log('tick', ms))
    // timer.on('tick', (ms) =>  timerLabel.text(ms));
    // timer.on('done', () => console.log('done!'))
    // timer.on('statusChanged', (status) => console.log('status:', status))
    // timer.start(5000) // run for 5 seconds

    // animLayer.add(tokenGroup);
    animLayer.draw();
}

function tokenHandler(component, place_num, animLayer, tokenColor){
    // get position of current place
    var tokenPos = component.place_list[place_num].place_konva.getAbsolutePosition();

    // if first place
    if(place_num == 0){
        // show that the place has been reached
        placeFinishedAnim(component.place_list[place_num].place_konva);
    }

    console.log("Creating tokens for " + component.name + " at " + component.place_list[0].name);
    console.log(component.place_list[place_num].name + " has " + component.place_list[place_num].transition_outbound_list.length + " outbound transitions")

    // create token for every outbound transition
    for (var tran_num = 0; tran_num < component.place_list[place_num].transition_outbound_list.length; tran_num++){

        var token = createToken(tokenPos, tokenColor);
        // create token obj
        var token_obj = new Token(token_list.length + 1, tokenPos);
        // add konva cricle ref to token obj
        token_obj.konva_circle = token;
        // add konva token to animLayer
        animLayer.add(token);

        var transition = component.place_list[place_num].transition_outbound_list[tran_num].tran_konva;
        var tran_pos = transition.getAbsolutePosition();
        var mid_pos_x = tran_pos.x + transition.points()[2];
        var mid_post_y = tran_pos.y + transition.points()[3];
        var offset = component.place_list[place_num].transition_outbound_list[tran_num].offset;
        var current_tween = startTokenTransition(component, token, mid_pos_x, mid_post_y, offset, place_num, tran_num, tokenColor, animLayer, transition, tran_pos);
        
        // finishTokenTransition(component, token, dest_pos_x, dest_post_y, offset, playLabel, pauseLabel, resetLabel, place_num, tran_num, tokenColor, animLayer);
    }
}

function createToken(tokenPos, tokenColor){
    var token = new Konva.Circle({
        x: tokenPos.x,
        y: tokenPos.y,
        radius: 8,
        fill: tokenColor,
        opacity: 1
    });
    return token;
}

// func to move the current token first half of the transition
function startTokenTransition(component, token, mid_pos_x, mid_post_y, offset, place_num, tran_num, tokenColor, animLayer, transition, tran_pos){
    // get current tran obj
    var curr_tran_obj = component.place_list[place_num].transition_outbound_list[tran_num];
    // get new place for current transition
    var new_pos = curr_tran_obj.dest;
    // find index of dest place
    var next_index = component.place_list.indexOf(component.place_list[place_num].transition_outbound_list[tran_num].dest);
    console.log("next index is " + next_index);

    // set dest pos
    var dest_pos_x = tran_pos.x + transition.points()[4];
    var dest_post_y = tran_pos.y + transition.points()[5];

    // get this transitions duration
    var tran_duration = getRandomDuration(curr_tran_obj.duration_min, curr_tran_obj.duration_max);
    console.log("current transition duration MIN is " + curr_tran_obj.duration_min);
    console.log("current transition duration MAX is " + curr_tran_obj.duration_max);

    // declare ref for tween
    var current_tween;

    // the tween has to be created after the node has been added to the layer
    var start_tween = new Konva.Tween({
        node: token,
        duration: tran_duration / 2,
        // offsetX: offset,
        x: mid_pos_x,
        y: mid_post_y,
        opacity: 1,
        onFinish: function() {
            // move token to final pos
            current_tween = finishTokenTransition(component, token, dest_pos_x, dest_post_y, offset, place_num, tran_num, tokenColor, animLayer, tran_duration);
            start_tween.destroy();
        }
    });
    // add start_tween to tween list
    token_tweens.push(start_tween);

    // set ref for curr tween
    current_tween = start_tween;

    start_tween.play();

    return current_tween;
}

function finishTokenTransition(component, token, dest_pos_x, dest_post_y, offset, place_num, tran_num, tokenColor, animLayer, tran_duration){
    
    // get current tran obj
    var curr_tran_obj = component.place_list[place_num].transition_outbound_list[tran_num];
    // get new place for current transition
    var new_pos = curr_tran_obj.dest;
    // find index of dest place
    var next_index = component.place_list.indexOf(component.place_list[place_num].transition_outbound_list[tran_num].dest);
    console.log("next index is " + next_index);

    console.log("new place name is " + new_pos.name + " and index is " + new_pos.index);

    // the tween has to be created after the node has been added to the layer
    var finish_tween = new Konva.Tween({
        node: token,
        duration: tran_duration / 2,
        // offsetX: offset,
        x: dest_pos_x,
        y: dest_post_y,
        easing: Konva.Easings.EaseOut,
        opacity: 1,
        onFinish: function() {
            token.destroy();
            animLayer.draw();
            if(new_pos.place_konva.stroke() == 'black'){
                // show that the new place has been reached
                placeFinishedAnim(new_pos.place_konva);
            }
            // check if new pos has outbound transitions
            if (new_pos.transition_outbound_list.length > 0 && offset == 0){
                tokenHandler(component, next_index, animLayer, tokenColor);
            }
            if(new_pos == component.place_list[component.place_list.length - 1]){
                componentFinishedAnim(component);
            }
            // finish_tween.destroy();
        }
    });
    // add tween to tween list
    token_tweens.push(finish_tween);
    
    // tween starts playing
    finish_tween.play();

    return finish_tween;
}

function placeFinishedAnim(place){
    console.log("created place tween");
    var place_tween = new Konva.Tween({
        node: place,
        duration: 2,
        stroke: 'green',
        strokeWidth: 1,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOpacity: 1,
        easing: Konva.Easings.EaseOut,
        onFinish: function() {
            setTimeout(function(){ place_tween.reverse(); }, 4000);
        }
    });
    place_tween.play();
}

function componentFinishedAnim(component){
    console.log("created component tween");
    var component_tween = new Konva.Tween({
        node: component.konva_component,
        duration: 4,
        stroke: 'blue',
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOpacity: 1,
        easing: Konva.Easings.EaseInOut,
        onFinish: function() {
            setTimeout(function(){ component_tween.reverse(); }, 4000);
        }
    });
    component_tween.play();
}

// returns a random time between a lower and upper bound
function getRandomDuration(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function start(startTime) {
  startTime = new Date();
};

function end(endTime) {
  endTime = new Date();
  var timeDiff = endTime - startTime; //in ms
  // strip the ms
  timeDiff /= 1000;

  // get seconds 
  var seconds = Math.round(timeDiff);
  console.log(seconds + " seconds");
}

function createTimerLabel(component_group, component_konva){

    var comp_absolute_pos = component_konva.getAbsolutePosition();

    var timer = new Konva.Text({
        x: comp_absolute_pos.x + ((component_konva.getWidth() / 2) * component_konva.scaleX()) - 70,
        y: comp_absolute_pos.y + (component_konva.getHeight() * component_konva.scaleY()),
        opacity: 1,
        text: '00:00:00',
        fontFamily: 'Calibri',
        fontSize: 36,
        padding: 5,
        fill: 'black'
    });

    return timer;
}

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

function playAllTokenTweens(){
    for (var i = 0; i < token_tweens.length; i++) {
        token_tweens[i].play();
    }
}

function pauseAllTokenTweens(){
    for (var i = 0; i < token_tweens.length; i++) {
        token_tweens[i].pause();
    }
}

function destroyTokens(){
    for (var i = 0; i < token_list.length; i++) {
        token_list[i].konva_circle.destroy();
        token_list.splice( token_list.indexOf(token_list[i]), 1 );
    }
}

function destroyTokenTweens(){
    // destory every tween
    for (var i = 0; i < token_tweens.length; i++) {
        token_tweens[i].destroy();
    }
    token_tweens = [];
}

function destroyTokenTweensExceptFirst(){
    // destory every tween but the first one
    for (var i = 1; i < token_tweens.length; i++) {
        token_tweens[i].destroy();
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