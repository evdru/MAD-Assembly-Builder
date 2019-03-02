// NOTE: The variables must have unique names, particular to the plugin
// or else the plugin will not work

const sd_electron = require('electron');
const sd_ipcRenderer = sd_electron.ipcRenderer;

var sd_app = electron.remote; 
var sd_dialog = app.dialog;
var sd_comp_list = component_list;
var sd_con_list = connection_list;

sd_ipcRenderer.on('simulate_deployment', function() {
    
    for (var i = 0; i < sd_comp_list.length; i++) {
        createTokens(sd_comp_list[i]);
    };
    return;

});

function createTokens(component){
    if (confirm("Press a button!")) {
        txt = "You pressed OK!";
    } else {
    txt = "You pressed Cancel!";
    }
    console.log(component.name);
}