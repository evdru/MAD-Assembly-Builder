// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sd_electron = require('electron');
var Stopwatch = require('timer-stopwatch');
var TweenMax = require("gsap");
const sd_ipcRenderer = sd_electron.ipcRenderer;

var sd_app = electron.remote;
var sd_dialog = app.dialog;
var sd_comp_list = [];
var sd_con_list = [];
var token_list = [];
var token_tweens = [];
var timer_label_list = [];
var simulator_mode = true;

class Token{
    constructor(name, start_position){
        this.name = name;
        this.start_position = start_position;
        this.konva_circle;
        this.tween_konva;
    }
}

class Tween{
    constructor(name, tween_list, component, token, tokenColor){
        this.name = name;
        this.tween_list = tween_list;
        this.component = component;
        this.token = token;
        this.tokenColor = tokenColor;
    }
}

class TimerLabel{
    constructor(name, label_konva, parent_component){
        this.name = name;
        this.label_konva = label_konva;
        this.isRunning = false;
        this.parent_component = parent_component;
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
    stage.add(animLayer);

    sd_ipcRenderer.on('exit_simulator_mode', function(e){
        // for every component
        for (var i = 0; i < sd_comp_list.length; i++) {
            setListening(sd_comp_list[i]);
        }
        resetHighlights();
        destroyTokens();
        destroyTokenTweens();
        resetConnections();
        simulationGroup.destroy();
        animLayer.destroy();
        sd_comp_list = [];
        sd_con_list = [];
        stopwatch.reset();
        simulator_mode = false;
        console.log("clicked on edit mode label");
    });

    // start global timer
    var stopwatch = new Stopwatch();
    stopwatch.start();
    // create tween list
    var tween_list = [];
    // for every component
    for (var i = 0; i < sd_comp_list.length; i++) {
        // check if component has places
        if (sd_comp_list[i].place_list.length > 0){
            // create timer label
            timerLabel = createTimerLabel(sd_comp_list[i].konva_component);
            simulationGroup.add(timerLabel);
            // push timer label obj to global list 
            timer_label_list.push(timerLabel);
            // set not listening 
            setNotListening(sd_comp_list[i]);
            // set token color for this component
            var tokenColor = getRandomColor();
            // get pos of first place
            // get position of first place
            var tokenPos = sd_comp_list[i].place_list[0].place_konva.getAbsolutePosition();
            // create token at first place
            var token = createToken(tokenPos, tokenColor);
            // create tween obj name
            var tween_name = "tween " + i;
            // create tween obj
            var tween_obj = new Tween(tween_name, tween_list, sd_comp_list[i], token, tokenColor);
            // build the animation
            buildTokenTween(tween_obj, animLayer);
            // tokenHandler(sd_comp_list[i], place_num, animLayer, tokenColor, timerLabel);
        } else {
            console.log(sd_comp_list[i].name + " did not have a place!");
        }
    };

    // playTokenTimeLine
    // playTokenTimeLine(tween_list);

    // Fires every 50ms by default. Change setting the 'refreshRateMS' options
    stopwatch.onTime(function(time) {
        updateTimerLabels(time);
    });

    // animLayer.add(tokenGroup);
    animLayer.draw();
}

function buildTokenTween(tween_obj, animLayer){
    
    // create tweenMax
    var tweenline = new TimelineMax();
    // add tweenMax to tweenlist
    tween_obj.tween_list.push(tweenline);
    // create reference to this tweens parent component
    var component_obj = tween_obj.component;
    console.log("Building token tween for " + component_obj.name);
    // set tween delay, tween delay will the sum of all of the previous delays
    var tween_delay = 0;
    // for every place in components place list
    for (var place_num = 0; place_num < component_obj.place_list.length; place_num++){
        // add label to timeline for when this place's outbound transitions should start
        tweenline.add('place_' + place_num + '_delay', getStartTweenDelay(component_obj.place_list[place_num], 0));
        console.log(getStartTweenDelay(component_obj.place_list[place_num]));
        // reset current max tran delay
        var current_max_delay = 0;
        // create sub timeline
        var subTweenLine = new TimelineMax();
        // for every outbound transition out of the current place
        for (var tran_num = 0; tran_num < component_obj.place_list[place_num].transition_outbound_list.length; tran_num++){
            // set current tran obj reference
            var curr_tran_obj = component_obj.place_list[place_num].transition_outbound_list[tran_num];
            // get current duration
            var getDuration = getRandomDuration(curr_tran_obj.duration_min, curr_tran_obj.duration_max);
            curr_tran_obj.current_duration = getDuration;
            // find max transition delay
            if(current_max_delay < getDuration){
                current_max_delay = getDuration;
            }
            // get token starting position
            var tokenStartPos = component_obj.place_list[place_num].place_konva.getAbsolutePosition();
            // create token
            var token = createToken(tokenStartPos, tween_obj.tokenColor);
            animLayer.add(token);
            // get reference to transtion konva line
            var transition = component_obj.place_list[place_num].transition_outbound_list[tran_num].tran_konva;
            // get transition konva line position
            var tran_pos = transition.getAbsolutePosition();
            var mid_pos_x = tran_pos.x + transition.points()[2];
            var mid_post_y = tran_pos.y + transition.points()[3];
            var dest_post_x = tran_pos.x + transition.points()[4];
            var dest_post_y = tran_pos.y + transition.points()[5];
            
            // tween to next place // , 'index_delay'
            var tween = TweenMax.to(token, getDuration, { konva: { bezier: {curviness:3, values:[{x:mid_pos_x, y:mid_post_y}, {x:dest_post_x, y:dest_post_y}] }}, onStartParams:[token], onStart: showToken, onCompleteParams:[token], onComplete: hideToken });
            subTweenLine.add(tween, 0);
        } // 
        tweenline.add(subTweenLine, 'place_' + place_num + '_delay');
        // increment curr delay
        //tween_delay += current_max_delay;
    }
}

// GREEDY
function getStartTweenDelay(curr_place){

    var tween_delay = 0;

    while(curr_place.transition_inbound_list.length != 0){
        var max_tran_duration = 0;
        // get the max duration of all inbound transitions
        for(var tran_num = 0; tran_num < curr_place.transition_inbound_list.length; tran_num++){
            if(curr_place.transition_inbound_list[tran_num].current_duration > max_tran_duration){
                max_tran_duration = curr_place.transition_inbound_list[tran_num].current_duration;
                curr_place = curr_place.transition_inbound_list[tran_num].src;
            }
        }
        tween_delay += max_tran_duration;
        console.log("max_tran_duration is " + max_tran_duration);
        // decrement the current place
    }

    return tween_delay;
}

function showToken(token){
    token.show();
}

function hideToken(token){
    token.hide();
}
function playTokenTimeLine(tween_list){
    // for every tweenline in tween_list
    for (var tween_line_num = 0; tween_line_num < tween_list.length; tween_line_num++){
        tween_list[tween_line_num].play();
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
    token.hide();
    return token;
}

function updateTimerLabels(time){
    var elapsedMilliseconds = time.ms;
    var elapsedSeconds = elapsedMilliseconds / 1000;
    var elapsedMinutes = elapsedSeconds / 60;
    if(elapsedSeconds > 60) {elapsedSeconds -= 60; }
    for (var i = 0; i < timer_label_list.length; i++){
        timer_label_list[i].text(Math.trunc(elapsedMinutes) + ":" + Math.trunc(elapsedSeconds));
    }
}

// remove the timerLabel from the list
function stopTimerLabel(timerLabel, component){
    timer_label_list.splice( timer_label_list.indexOf(timerLabel), 1 );
    component.isRunning = false;
}

function checkConnectionStatus(){
    for (var i = 0; i < sd_con_list.length; i++){
        if(sd_con_list[i].provide_port_obj.enabled == true && sd_con_list[i].use_port_obj.enabled == true){
            sd_con_list[i].enabled = true;
            connectionEnabledAnim(sd_con_list[i]);
        }
    }
}

function connectionEnabledAnim(connection){
    console.log("Connection enabled");
    connection.gate1_konva.opacity(0);
    connection.gate2_konva.opacity(0);
    var connection_tween = new Konva.Tween({
        node: connection.connection_line_konva,
        duration: 2,
        stroke: 'green',
        easing: Konva.Easings.EaseInOut,
        onFinish: function() {
            setTimeout(function(){ connection_tween.reverse(); }, 2000);
        }
    });
    connection_tween.play();
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

function createTimerLabel(component_konva){

    var comp_absolute_pos = component_konva.getAbsolutePosition();

    var timerLabel = new Konva.Text({
        x: comp_absolute_pos.x + ((component_konva.getWidth() / 2) * component_konva.scaleX()) - 30,
        y: comp_absolute_pos.y + (component_konva.getHeight() * component_konva.scaleY()),
        opacity: 1,
        text: '',
        fontFamily: 'Calibri',
        fontSize: 36,
        padding: 5,
        align: 'center',
        fill: 'black'
    });

    return timerLabel;
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
        x: 150,
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

function resetConnections(){
    for (var i = 0; i < sd_con_list.length; i++){
        if(sd_con_list[i].enabled == true){
            sd_con_list[i].gate1_konva.opacity(1);
            sd_con_list[i].gate2_konva.opacity(1);
            sd_con_list[i].enabled = false;
            sd_con_list[i].connection_line_konva.stroke('black');
            resetDependencyEnabled(sd_con_list[i].provide_port_obj, sd_con_list[i].use_port_obj);
        }
    }
}

function resetDependencyEnabled(provide_dep_obj, use_dep_obj){
    provide_dep_obj.enabled = false;
    use_dep_obj.enabled = false;
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