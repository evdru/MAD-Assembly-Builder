const rm_electron = require('electron');
const rm_ipcRenderer = rm_electron.ipcRenderer;

rm_ipcRenderer.on('readme', function() {
    console.log("Open the readme window")
    // Open the new window that will contain the readme.
    rm_ipcRenderer.send('open_readme_window')
});