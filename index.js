const electron = require('electron');
const url = require('url');
const path = require('path');

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

	//Quit app when closed
	window.on('closed', function() {
		app.quit()
	});

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
	},
	{
		label: 'Tools',
		submenu:[
			{
				label: 'Generate Code',
				// Keyboard shortcuts for code generation
				accelerator: process.platform == 'darwin' ? 'Command+G' :
				'Ctrl+G',
				click(){
					window.webContents.send("generate_code");
				}
			}
		]
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