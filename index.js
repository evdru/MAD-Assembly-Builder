const {app, BrowserWindow} = require('electron');
const url = require('url');
const plugin_manager = require('./plugin_manager.js');

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