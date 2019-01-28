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

app.on('ready', boot);