const electron = require("electron");
const ipc = electron.ipcRenderer;

var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var app = require('electron').remote; 
var dialog = app.dialog;

var comp_list = component_list;

ipc.on('generate_code', function(ev) {
    console.log("Made it to Script_2");

    /** Loop through the component list, for every component create a new file
     * string, open the dialog box, save that string to the newly chosen file 
     */
    for (var i = 0; i < comp_list.length; i++) {
        createString(comp_list[i]);
    };

});

function createString(component) {
    var content = "";
    //Append to content
	content += "from mad import *\n";
	content += "import time\n";
	content += "import os\n";
	content += "import subprocess\n\n";
    content += "class " + component.name + "(Component):\n";
    console.log(component.name);
    
    //Create places list
    content += "\tdef create(self):\n";
    content += "\t\tself.places = [\n";
    for (var i = 0; i < component.children_list.length; i++) {
        if (component.children_list[i].type === "Place") {
            if (i == component.children_list.length - 1) {
                content += "\t\t\t'" + component.children_list[i].name + "'\n";
            } else {
                content += "\t\t\t'" + component.children_list[i].name + "',\n";
            };
        };
    };
    content += "\t\t]\n\n";

    //Create transitions dictionary
    content += "\t\tself.transitions = {\n";
    for (var j = 0; j < component.children_list.length; j++) {
        if (component.children_list[j].type === "Transition") {
            if (j == component.children_list.length - 1) {
                content += "\t\t\t'" + component.children_list[j].name + "': ('" + component.children_list[j].src + "', '" + component.children_list[j].dest + "', self." + component.children_list[j].func + ")\n";
            } else {
                content += "\t\t\t'" + component.children_list[j].name + "': ('" + component.children_list[j].src + "', '" + component.children_list[j].dest + "', self." + component.children_list[j].func + "),\n";
            };
        };
    };
    content += "\t\t}\n\n";

    //Create dependencies dictionary
    content += "\t\tself.dependencies = {}\n\n";

    //Create functions
    for (var k = 0; k < component.children_list.length; k++) {
        if (component.children_list[k].type === "Transition") {
            content += "\tdef " + component.children_list[k].func + "(self):\n";
            content += "\t\ttime.sleep(" + getRndInteger(0, 11) + ")\n\n";
        };
    };

    //Create the file & write to the file
    generateCode(content);
};

function generateCode(content) {
    // You can obviously give a direct path without use the dialog (C:/Program Files/path/myfileexample.txt)
    dialog.showSaveDialog((fileName) => {
        if (fileName === undefined) {
            console.log("You didn't save a file");
            return;
        }
        // fileName is a string that contains the path and filename created in the save file dialog.  
        fs.writeFile(fileName, content, (err) => {
            if (err) {
                alert("An error ocurred creating the file "+ err.message)
            };  
            console.log("The file has been succesfully saved");
        });
    });
};

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};