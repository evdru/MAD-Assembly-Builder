const electron = require('electron');
const url = require('url');
const plugin_manager = require('./plugin_manager.js');
const path = require('path');
const ipcMain = electron.ipcMain;

const {app, BrowserWindow, Menu} = electron;

let window;

function boot() {
	// Create new window
	window = new BrowserWindow()
	window.maximize()
	window.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
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

// Listen for app to be ready
app.on('ready', boot);