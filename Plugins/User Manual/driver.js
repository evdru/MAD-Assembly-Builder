const um_electron = require('electron');
const um_ipcRenderer = um_electron.ipcRenderer;

um_ipcRenderer.on('user_manual', function() {
    console.log("Open the user manual window")
    // Open the new window that will contain the user manual.
    um_ipcRenderer.send('open_user_manual_window')
});