// Helper functions for Electron integration
declare global {
  interface Window {
    electronAPI?: {
      saveListeningRecord: (record: any, folderPath: string) => Promise<any>;
      selectMusicFolder: () => Promise<any>;
    };
  }
}

export const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

export const saveListeningRecord = async (record: any, folderPath: string) => {
  if (isElectron() && window.electronAPI) {
    return await window.electronAPI.saveListeningRecord(record, folderPath);
  }
  return { success: false, error: 'Not running in Electron' };
};

export const selectMusicFolder = async () => {
  if (isElectron() && window.electronAPI) {
    return await window.electronAPI.selectMusicFolder();
  }
  return { success: false, error: 'Not running in Electron' };
};