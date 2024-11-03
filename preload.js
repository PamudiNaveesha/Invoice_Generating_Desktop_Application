// Import Electron modules
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process using `contextBridge`
contextBridge.exposeInMainWorld('electron', {
  // Customer-related IPC handlers
  saveCustomer: async (formData) => {
    console.log('saveCustomer called with:', formData);
    try {
      const result = await ipcRenderer.invoke('save-customer', formData);
      console.log('Save result:', result);
      return result;
    } catch (error) {
      console.error('Error in saveCustomer:', error);
      throw error;
    }
  },
  fetchCustomers: async () => {
    console.log('fetchCustomers called');
    try {
      const result = await ipcRenderer.invoke('fetch-customers');
      console.log('Fetch result:', result);
      return result;
    } catch (error) {
      console.error('Error in fetchCustomers:', error);
      throw error;
    }
  },
  editCustomer: async (customer) => {
    console.log('editCustomer called with:', customer);
    try {
      const result = await ipcRenderer.invoke('edit-customer', customer);
      console.log('Edit result:', result);
      return result;
    } catch (error) {
      console.error('Error in editCustomer:', error);
      throw error;
    }
  },
  deleteCustomer: async (id) => {
    console.log('deleteCustomer called with ID:', id);
    try {
      const result = await ipcRenderer.invoke('delete-customer', id);
      console.log('Delete result:', result);
      return result;
    } catch (error) {
      console.error('Error in deleteCustomer:', error);
      throw error;
    }
  },
  fetchHireNumbers: async () => {
    console.log('fetchHireNumbers called');
    try {
      const result = await ipcRenderer.invoke('fetch-hire-numbers');
      console.log('Fetch hire numbers result:', result);
      return result;
    } catch (error) {
      console.error('Error in fetchHireNumbers:', error);
      throw error;
    }
  },

  // Driver-related IPC handlers
  saveDriver: async (formData) => {
    console.log('saveDriver called with:', formData);
    try {
      const result = await ipcRenderer.invoke('save-driver', formData);
      console.log('Save result:', result);
      return result;
    } catch (error) {
      console.error('Error in saveDriver:', error);
      throw error;
    }
  },
  fetchDrivers: async () => {
    console.log('fetchDrivers called');
    try {
      const result = await ipcRenderer.invoke('fetch-drivers');
      console.log('Fetch result:', result);
      return result;
    } catch (error) {
      console.error('Error in fetchDrivers:', error);
      throw error;
    }
  },
  editDriver: async (driver) => {
    console.log('editDriver called with:', driver);
    try {
      const result = await ipcRenderer.invoke('edit-driver', driver);
      console.log('Edit result:', result);
      return result;
    } catch (error) {
      console.error('Error in editDriver:', error);
      throw error;
    }
  },
  deleteDriver: async (id) => {
    console.log('deleteDriver called with ID:', id);
    try {
      const result = await ipcRenderer.invoke('delete-driver', id);
      console.log('Delete result:', result);
      return result;
    } catch (error) {
      console.error('Error in deleteDriver:', error);
      throw error;
    }
  }
});

// Maintain the existing functionality of the new preload script
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});

console.log('Preload script loaded.');
