var ipcRenderer = require('electron').ipcRenderer;
document.addEventListener("DOMContentLoaded", function () {
   ipcRenderer.sendToHost('html-content' , document.body.innerHTML);
});
