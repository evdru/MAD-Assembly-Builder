const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var app = electron.remote; 
var dialog = app.dialog;
var comp_list = component_list;
var con_list = connection_list;

ipcRenderer.on('generate_code', function() {
    /** Loop through the component list, for every component create a new file
     * string, open the dialog box, save that string to the newly chosen file 
     */
    for (var i = 0; i < comp_list.length; i++) {
        createComponentString(comp_list[i]);
    };
    createAssemblyString(comp_list);
});

function createComponentString(component) {
    var content = "";
    //Append to content
	content += "from mad import *\n";
	content += "import time\n\n";
    content += "class " + capitalize(component.name) + "(Component):\n";

    //Create places list
    content += "\tdef create(self):\n";
    content += "\t\tself.places = [\n";
    for (var i = 0; i < component.place_list.length; i++) {
        if (component.place_list[i].type === "Place") {
            if (i == component.place_list.length - 1) {
                content += "\t\t\t'" + component.place_list[i].name + "'\n";
            } else {
                content += "\t\t\t'" + component.place_list[i].name + "',\n";
            };
        };
    };
    content += "\t\t]\n\n";

    //Create transitions dictionary
    content += "\t\tself.transitions = {\n";
    for (var j = 0; j < component.transition_list.length; j++) {
        if (component.transition_list[j].type === "Transition") {
            if (j == component.transition_list.length - 1) {
                content += "\t\t\t'" + component.transition_list[j].name + "': ('" + component.transition_list[j].src.name + "', '" + component.transition_list[j].dest.name + "', self." + component.transition_list[j].func + ")\n";
            } else {
                content += "\t\t\t'" + component.transition_list[j].name + "': ('" + component.transition_list[j].src.name + "', '" + component.transition_list[j].dest.name + "', self." + component.transition_list[j].func + "),\n";
            };
        };
    };
    content += "\t\t}\n\n";

    //Create dependencies dictionary via connection list
    content += "\t\tself.dependencies = {\n";

    if (con_list.length != 0) {
        //First: check for provide depencencies
        for (var k = 0; k < con_list.length; k++) {
            if (con_list[k].provide_port_obj.component_obj.name === component.name) {
                if (content.includes(con_list[k].provide_port_obj.name)) {
                    continue;
                } else {
                    content += "\t\t\t'" + con_list[k].provide_port_obj.name + "': (DepType." + con_list[k].provide_port_obj.type + ", ['" + con_list[k].provide_port_obj.source_obj.name + "']),\n";
                };
            };
        };

        //Second: check for use dependencies
        for (var l = 0; l < con_list.length; l++) {
            if (con_list[l].use_port_obj.component_obj.name === component.name) {
                if (content.includes(con_list[l].use_port_obj.name)) {
                    continue;
                } else {
                    content += "\t\t\t'" + con_list[l].use_port_obj.name + "': (DepType." + con_list[l].use_port_obj.type + ", ['" + con_list[l].use_port_obj.source_obj.name + "']),\n";
                };
            };
        };

        //Delete the last comma from the dependency dictionary and then append the closing bracket and new tabs/lines.
        content = content.slice(0, -2);
        content += "\n\t\t}\n\n";
    } else {
        content += "\t\t}\n\n";
    }
    

    //Create functions
    for (var m = 0; m < component.transition_list.length; m++) {
        if (component.transition_list[m].type === "Transition") {
            content += "\tdef " + component.transition_list[m].func + "(self):\n";
            content += "\t\ttime.sleep(" + getRndInteger(0, 11) + ")\n\n";
        };
    };

    //Create the file & write to the file
    generateCode(content, component.name);
};

//Write the content string to a file
function generateCode(content, component_name) {
    dialog.showSaveDialog(
        {defaultPath: "~/" + component_name.toLowerCase() + ".py"},
        function (fileName) {
          // do your stuff here
            if (fileName === undefined) {
                console.log("You didn't save a file.");
                return;
            }
            // fileName is a string that contains the path and filename created in the save file dialog.  
            fs.writeFile(fileName, content, (err) => {
                if (err) {
                    alert("An error ocurred creating the file " + err.message)
                };  
                console.log(component_name + " has been succesfully saved!");
            });
      });
};

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

function createAssemblyString(comp_list) {
    var content = "";
    
    //Import MAD
    content += "from mad import *\n\n";
    
    //Import component files and classes
    for (var i = 0; i < comp_list.length; i++) {
        content += "from " + comp_list[i].name.toLowerCase() + " import " + capitalize(comp_list[i].name) + "\n";
        if (i == comp_list.length - 1) {
            content += "\n";
        }
    }
    
    //Add actual functionality
    content += "if __name__ == '__main__':\n";
    
    //Create new classes of imported types
    for (var j = 0; j < comp_list.length; j++) {
        content += "\t" + comp_list[j].name.toLowerCase() + " = " + capitalize(comp_list[j].name) + "()\n\n";
    }

    //Add components to the assembly
    content += "\tassembly = Assembly()\n";
    for (var k = 0; k < comp_list.length; k++) {
        content += "\tassembly.addComponent('" + comp_list[k].name.toLowerCase() + "', " + comp_list[k].name.toLowerCase() + ")\n";
    }

    //Add connections to the assembly
    for (var l = 0; l < con_list.length; l++) {
        connection = con_list[l];
        content += "\tassembly.addConnection(" + connection.provide_port_obj.component_obj.name.toLowerCase() + ", '" + connection.provide_port_obj.name + "', " + connection.use_port_obj.component_obj.name.toLowerCase() + ", '" + connection.use_port_obj.name + "')\n";
        if (l == con_list.length - 1) {
            content += "\n";
        }
    }

    content += "\tmad = Mad(assembly)\n";
    content += "\tmad.run()\n";

    generateAssemblyCode(content);
}

//Write the content string to a file
function generateAssemblyCode(content) {
    dialog.showSaveDialog(
        {defaultPath: "~/assembly.py"},
        function (fileName) {
          // do your stuff here
            if (fileName === undefined) {
                console.log("You didn't save a file.");
                return;
            }
            // fileName is a string that contains the path and filename created in the save file dialog.  
            fs.writeFile(fileName, content, (err) => {
                if (err) {
                    alert("An error ocurred creating the file " + err.message)
                };  
                console.log("The assembly has been succesfully saved!");
            });
      });
};

// Function to capitalize the first letter of a string
function capitalize(string) {
    if (typeof string !== 'string') {
        return ''
    }
    return string.charAt(0).toUpperCase() + string.slice(1)
}