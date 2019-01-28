<<<<<<< HEAD
const {app, BrowserWindow} = require('electron');
const url = require('url');

let win = null;

function boot() {
	window = new BrowserWindow()
	window.maximize()
	window.loadURL(url.format({
		pathname: 'index.html',
		slashes: true
	}))
};
=======
const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu} = electron;

let window;

function boot() {
	// Create new window
	window = new BrowserWindow()
	window.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));

	// Build menu from template
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	// Insert menu
	Menu.setApplicationMenu(mainMenu)
};

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
	}
];
>>>>>>> Adding custom main menu template and keyboard shortcuts for quit

// Listen for app to be ready
app.on('ready', boot);