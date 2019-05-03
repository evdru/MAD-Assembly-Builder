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
var tween_obj_list = [];
var timer_label_list = [];
var tween_duration_dict = {};
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
    constructor(name, tween_list, component, tokenColor, timerLabel){
        this.name = name;
        this.tween_list = tween_list;
        this.component = component;
        this.tokenColor = tokenColor;
        this.timerLabel = timerLabel;
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
        //resetHighlights(animLayer); // tween still plays
        destroyTokens();
        destroyTweenObjList();
        resetConnectionsAndDependencies();
        resetTransitionCurrentDuration();
        sd_comp_list = [];
        sd_con_list = [];
        token_list = [];
        tween_obj_list = [];
        tween_duration_dict = {};
        simulationGroup.destroy();
        animLayer.destroy();
        stopwatch.stop();
        simulator_mode = false;
        console.log("clicked on edit mode label");
    });

    // start global timer
    var stopwatch = new Stopwatch();
    stopwatch.start();
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
            // create tween obj name
            var tween_name = "tween " + i;
            // create tween list
            var tween_list = [];
            // create tween obj
            var tween_obj = new Tween(tween_name, tween_list, sd_comp_list[i], tokenColor, timerLabel);
            // build the animation
            buildTokenTween(tween_obj, animLayer);
            // tokenHandler(sd_comp_list[i], place_num, animLayer, tokenColor, timerLabel);
            tween_obj_list.push(tween_obj);
        } else {
            console.log(sd_comp_list[i].name + " did not have a place!");
        }
    };

    // Fires every 50ms by default. Change setting the 'refreshRateMS' options
    stopwatch.onTime(function(time) {
        updateTimerLabels(time);
    });

    // animLayer.add(tokenGroup);
    animLayer.draw();
}

function buildTokenTween(tween_obj, animLayer){
    // create tweenMax
    var tweenline = new TimelineMax({onCompleteParams:[tween_obj], onComplete: finishTween} );
    // add tweenMax to tweenlist
    tween_obj.tween_list.push(tweenline);
    // create reference to this tweens parent component
    var component_obj = tween_obj.component;
    component_obj.place_list = sortPlaceList(component_obj);

    // for every place in components place list
    for (var place_num = 0; place_num < component_obj.place_list.length; place_num++){
        // set max delay for current place
        setTransitionMaxDelay(component_obj.place_list[place_num]);
        // add label to timeline for when this place's outbound transitions should start
        tweenline.add('place_' + place_num + '_delay', getPlaceDelay(component_obj.place_list[place_num]));
        // set current place obj reference
        var curr_place_obj = component_obj.place_list[place_num];
        // for every outbound transition out of the current place
        for (var tran_num = 0; tran_num < component_obj.place_list[place_num].transition_outbound_list.length; tran_num++){
            // set current tran obj reference
            var curr_tran_obj = component_obj.place_list[place_num].transition_outbound_list[tran_num];
            // get current duration
            var getDuration = getRandomDuration(curr_tran_obj.duration_min, curr_tran_obj.duration_max);
            curr_tran_obj.current_duration = getDuration;
            // get token starting position
            var tokenStartPos = component_obj.place_list[place_num].place_konva.getAbsolutePosition();
            // create token
            var token = createToken(tokenStartPos, tween_obj.tokenColor);
            animLayer.add(token);
            token_list.push(token);
            // get reference to transtion konva line
            var transition = component_obj.place_list[place_num].transition_outbound_list[tran_num].tran_konva;
            // get transition konva line position
            var tran_pos = transition.getAbsolutePosition();
            var mid_pos_x = tran_pos.x + transition.points()[2];
            var mid_post_y = tran_pos.y + transition.points()[3];
            var dest_post_x = tran_pos.x + transition.points()[4];
            var dest_post_y = tran_pos.y + transition.points()[5];
            
            // tween to next place
            var tween = TweenMax.to(token, getDuration, { konva: { bezier: {curviness:3, values:[{x:mid_pos_x, y:mid_post_y}, {x:dest_post_x, y:dest_post_y}] }}, onStartParams:[token, curr_tran_obj], onStart: startTween, onCompleteParams:[token, curr_place_obj], onComplete: endTween });
            // subTweenLine.add(tween, 0);
            tweenline.add(tween, 'place_' + place_num + '_delay');
        }
        // tweenline.add(subTweenLine, 'place_' + place_num + '_delay');
    }
}

// sets the max delay from one place to another place in tween_duration_dict
function setTransitionMaxDelay(curr_place){

    // first place in graph
    if(curr_place.transition_inbound_list.length == 0) {
        tween_duration_dict[curr_place.name] = 0;
    }
    
    var max_place_delay = 0;
    // for every inbound transition into place
    for (var tran_num = 0; tran_num < curr_place.transition_inbound_list.length; tran_num++){
        var src_place_delay = getPlaceDelay(curr_place.transition_inbound_list[tran_num].src);
        var current_place_delay = src_place_delay + curr_place.transition_inbound_list[tran_num].current_duration;
        // find the previous place with highest duration
        if(current_place_delay > max_place_delay){
            max_place_delay = current_place_delay;
        }
    }

    // add the place name to delay dict with max delay to it
    tween_duration_dict[curr_place.name] = max_place_delay;
}

// return the delay from one place to another place from tween duration dict
function getPlaceDelay(place_obj){
    return tween_duration_dict[place_obj.name];
}

function isInDurationDict(place_obj){
    return tween_duration_dict[place_obj.name] != undefined;
}

function addDelayToDict(place_obj, place_delay){
    tween_duration_dict[place_obj.name] = place_delay;
}

function sortPlaceList(component_obj){
    var roots = findRoots(component_obj.place_list);
    var new_place_list = [];
    for(var root = 0; root < roots.length; root++){
        traversePlaces(roots[root], new_place_list);
    }
    return new_place_list;
}

function traversePlaces(place_obj, new_place_list){
    if(containsObject(place_obj, new_place_list)){
        new_place_list.move(new_place_list.indexOf(place_obj), new_place_list.length)
    } else {
        new_place_list.push(place_obj);
    }
    traverseTransitions(place_obj);
    function traverseTransitions(place_obj){
        for(var tran_num = 0; tran_num < place_obj.transition_outbound_list.length; tran_num++){
            traversePlaces(place_obj.transition_outbound_list[tran_num].dest, new_place_list);
        }
    }
}

function containsObject(obj, list) {
    var x;
    for (x in list) {
        if (list.hasOwnProperty(x) && list[x] === obj) {
            return true;
        }
    }
    return false;
}

// returns places with empty inbound_transition lists
function findRoots(place_list) {

    var roots = [];

    for(var place_index = 0; place_index < place_list.length; place_index++) {
        if(place_list[place_index].transition_inbound_list.length == 0) {
            roots.push(place_list[place_index]);
        }
    }

    return roots;

};

Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

function startTween(token, transition_obj){
    showToken(token);
    // check if transition obj has dependency
    enableDependencyObj(transition_obj);
    transitionAnim(transition_obj);
    checkConnectionStatus();
}

function enableDependencyObj(source_obj){
    // set every dependency obj connected to this source obj to true
    for(var dependency = 0; dependency < source_obj.dependency_obj_list.length; dependency++){
        source_obj.dependency_obj_list[dependency].enabled = true;
    }
};

function endTween(token, place_obj){
    hideToken(token);
    enableDependencyObj(place_obj);
    // play place tween
    //placeFinishedAnim(place_obj.place_konva);
    checkConnectionStatus();
}

function showToken(token){
    token.show();
}

function hideToken(token){
    token.hide();
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
    var totalSeconds = elapsedMilliseconds / 1000;
    var totalMinutes = totalSeconds / 60;
    var elapsedMinutes = Math.trunc(totalMinutes);
    var elapsedSeconds = totalSeconds;
    if(totalSeconds >= 60) {elapsedSeconds -= (60 * elapsedMinutes); }
    
    for (var i = 0; i < timer_label_list.length; i++){
        timer_label_list[i].text(Math.trunc(elapsedMinutes) + ":" + Math.trunc(elapsedSeconds));
    }
}

// reset every curr duration of every tran obj to 0
function resetTransitionCurrentDuration(){
    for (var i = 0; i < sd_comp_list.length; i++) {
        for (var j = 0; j < sd_comp_list[i].transition_list.length; j++) {
            sd_comp_list[i].transition_list[j].current_duration = 0;
        }
    }
}

function finishTween(tween_obj){
    stopTimerLabel(tween_obj.timerLabel);
    componentFinishedAnim(tween_obj.component);
}

// remove the timerLabel from the list
function stopTimerLabel(timerLabel){
    timer_label_list.splice( timer_label_list.indexOf(timerLabel), 1 );
}

function checkConnectionStatus(){
    for (var i = 0; i < sd_con_list.length; i++){
        if(sd_con_list[i].provide_port_obj.enabled == true && sd_con_list[i].use_port_obj.enabled == true){
            sd_con_list[i].enabled = true;
            connectionEnabledAnim(sd_con_list[i]);
        }
    }
    layer.draw();
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

function transitionAnim(transition_obj){
    console.log("created transition tween");
    var transition_tween = new Konva.Tween({
        node: transition_obj.tran_konva,
        duration: transition_obj.current_duration / 2,
        stroke: 'blue',
        strokeWidth: 1,
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOpacity: 1,
        easing: Konva.Easings.BackEaseOut,
        onFinish: function() {
            setTimeout(function(){ transition_tween.reverse(); }, 1000);
        }
    });
    transition_tween.play();
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
        easing: Konva.Easings.BackEaseOut,
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
        stroke: 'green',
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
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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

function resetHighlights(animLayer){
    for (var i = 0; i < sd_comp_list.length; i++) {
        sd_comp_list[i].konva_component.stroke('black');
        for (var j = 0; j < sd_comp_list[i].place_list.length; j++){
            // show that the new place has been reached
            sd_comp_list[i].place_list[j].place_konva.stroke('black');
            //sd_comp_list[i].place_list[j].place_konva.strokeWidth(1);
        }
    }
    animLayer.draw();
}

function resetConnectionsAndDependencies(){
    for (var i = 0; i < sd_con_list.length; i++){
        if(sd_con_list[i].enabled == true){
            sd_con_list[i].gate1_konva.opacity(1);
            sd_con_list[i].gate2_konva.opacity(1);
            sd_con_list[i].enabled = false;
            sd_con_list[i].connection_line_konva.stroke('black');
            resetDependencyEnabled(sd_con_list[i].provide_port_obj, sd_con_list[i].use_port_obj);
        }
    }
    layer.draw();
}

function resetDependencyEnabled(provide_dep_obj, use_dep_obj){
    provide_dep_obj.enabled = false;
    use_dep_obj.enabled = false;
}

function destroyTokens(){
    for (var i = 0; i < token_list.length; i++) {
        token_list[i].destroy();
        token_list.splice( token_list.indexOf(token_list[i]), 1 );
        i--;
    }
}

function destroyTweenObjList(){
    // destory every tween
    for (var i = 0; i < tween_obj_list.length; i++) {
        tween_obj_list[i].tween_list = [];
        tween_obj_list.splice( tween_obj_list.indexOf(tween_obj_list[i]), 1 );
        i--;
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