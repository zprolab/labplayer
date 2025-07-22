const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveListeningRecord: (record, folderPath) => 
    ipcRenderer.invoke('save-listening-record', record, folderPath),
  
  selectMusicFolder: () => 
    ipcRenderer.invoke('select-music-folder'),
});