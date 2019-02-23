const electron = require('electron');
const url = require('url');
const plugin_manager = require('./JS/plugin_manager.js');
const path = require('path');
const ipcMain = electron.ipcMain;

const {app, BrowserWindow, Menu} = electron;

let window;
var place_args = 'global';
var component_args = 'global';
var transition_args = 'global';
var stub_args = 'global'

function boot() {
	// Create new window
	window = new BrowserWindow()
	window.maximize()
	window.loadURL(url.format({
		pathname: path.join(__dirname, './HTML/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	// Populate Plugins Dropdown with valid Plugins
	populate_plugins();

	//Quit app when closed
	window.on('closed', function() {
		app.quit()
	});

	// Build menu from template
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	// Insert menu
	Menu.setApplicationMenu(mainMenu)
};

function populate_plugins() {
	// Add all valid plugins to the Plugins menu
	for (var menu = 0; menu < mainMenuTemplate.length; menu++) {
		// Ensuring the location of Plugins menu
		if (mainMenuTemplate[menu].label == 'Plugins') {
			for (var index = 0; index < plugin_manager[0].length; index++) {

				// New Plugin Constructed
				const new_plugin = {
					label: plugin_manager[0][index],
					accelerator: 'CmdOrCtrl+' + index,
					driver_path: plugin_manager[1][index],
					plugin_number: index,
					message: plugin_manager[0][index].toLocaleLowerCase().replace(/ /g,"_"),
					click(MenuItem){			
						window.webContents.send(MenuItem.message);
						console.log('The following Plugin has been activated: ' + MenuItem.label);
					}
				}

				// Adding New Plugin to the Plugins menu
				mainMenuTemplate[menu].submenu.push(new_plugin);
			}
		}
	}
}

const mainMenuTemplate = [
	{
		label: 'File',
		submenu:[
			{
				label: 'Quit',
				// Keyboard shortcuts for quit
				accelerator: process.platform == 'darwin' ? 'Command+Q' :
				'Ctrl+Q',
				click(){
					app.quit();
				}
			}
		]
	},
	{
		label: 'Plugins',
		submenu:[]
	}
];

// if mac, add empty object to menu
if(process.platform == 'darwin'){
	mainMenuTemplate.unshift({});
}

// Add developer tools item if not in production
if(process.env.NODE_ENV !== 'production'){
	mainMenuTemplate.push({
		label: 'Developer Tools',
		submenu:[
			{
				label: 'Toggle DevTools',
				// Keyboard shortcuts for DevTools
				accelerator: process.platform == 'darwin' ? 'Command+I' :
				'Ctrl+I',
				click(item, focusedWindow){
					focusedWindow.toggleDevTools();
				}
			},
			{
				role: 'reload'
			}
		]
	});
}

// Catch dependency port right clk
ipcMain.on("set_dependency_type", function(event, args) {
	console.log("Logging: set_dependency_type from main thread");
	// Create new dialog
	const {dialog} = require('electron');

	const options = {
		type: 'question',
		buttons: ['Cancel', 'SERVICE', 'DATA'],
		title: 'Question',
		message: 'What kind of dependency port do you wish to create?'
	};

	//Synchronous usage
	let response = dialog.showMessageBox(options)
	console.log(response)
	var dependency_type;
	switch(response){
		case 0:
			dependency_type = 'cancel';
			break;
		case 1:
			dependency_type = 'service';
			break;
		case 2:
			dependency_type = 'data';
			break;
		default:
			dependency_type = 'cancel';
	}
	event.returnValue = dependency_type;
});

// Catch place right click
ipcMain.on("change_place_details", function(event, args) {
	console.log("Logging: change_place_details from main thread");
	place_args = args;
	// Create new window
	var place_window = new BrowserWindow({
		width: 350,
		height: 400
	})
	place_window.loadURL(url.format({
		pathname: path.join(__dirname, './HTML/change_place_details.html'),
		protocol: 'file:',
		slashes: true
	}));
});

ipcMain.on("place->main", function(event, args) {
	window.webContents.send("place->renderer", {component: place_args.component, place: place_args.place, name: args.name});
});

// Catch component right click
ipcMain.on("change_component_details", function(event, args) {
	console.log("Logging: change_component_details from main thread");
	component_args = args;
	// Create new window
	var component_window = new BrowserWindow({
		width: 350,
		height: 200
	})
	component_window.loadURL(url.format({
		pathname: path.join(__dirname, './HTML/change_component_details.html'),
		protocol: 'file:',
		slashes: true
	}));
});

ipcMain.on("component->main", function(event, args) {
	window.webContents.send("component->renderer", {component: component_args.component, name: args.name, konva: component_args.konva});
});

// Catch transition right click
ipcMain.on("change_transition_details", function(event, args) {
	console.log("Logging: change_transition_details from main thread");
	transition_args = args;
	// Create new window
	var transition_window = new BrowserWindow({
		width: 400,
		height: 450
	})
	transition_window.loadURL(url.format({
		pathname: path.join(__dirname, './HTML/change_transition_details.html'),
		protocol: 'file:',
		slashes: true
	}));
});

ipcMain.on("transition->main", function(event, args) {
	window.webContents.send("transition->renderer", {component: transition_args.component, transition: transition_args.transition, name: args.name, old_func: transition_args.function,  new_func: args.function, dependency_status: args.dependency_status, dependency_type: args.dependency_type});
});

// Catch stub right click
ipcMain.on("change_stub_details", function(event, args) {
	console.log("Logging: change_stub_details from main thread");
	stub_args = args;
	// Create new window
	var stub_window = new BrowserWindow({
		width: 350,
		height: 200
	})
	stub_window.loadURL(url.format({
		pathname: path.join(__dirname, './HTML/change_stub_details.html'),
		protocol: 'file:',
		slashes: true
	}));
});

ipcMain.on("stub->main", function(event, args) {
	console.log(args.name);
	window.webContents.send("stub->renderer", {component: stub_args.component, old_name: stub_args.stub, new_name: args.name});
});

// Listen for app to be ready
app.on('ready', boot);