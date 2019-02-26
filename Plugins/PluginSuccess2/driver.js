console.log('PluginSuccess2 has been activated.');

ipcRenderer.on('pluginsuccess2', function() {
    window.alert('Plugin Success 2!');
});
console.log('PluginSuccess2 has been activated.');

module.exports = [success_data];