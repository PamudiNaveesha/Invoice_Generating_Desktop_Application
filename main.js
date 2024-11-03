// Handle Squirrel events for creating shortcuts on Windows
if (require('electron-squirrel-startup')) return; // Prevent running twice during installation

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database/database.js');

let mainWindow;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preload script
      nodeIntegration: false,  // Node.js should not be directly available in the renderer
      contextIsolation: true,  // Enable context isolation to use contextBridge
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'build/index.html'));

  // Open DevTools to debug
  // mainWindow.webContents.openDevTools();  // Add this line to open Developer Tools
  
  // mainWindow.on('closed', () => {
  //   mainWindow = null;
  // });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// --- Database and IPC Handlers (From Previous `main.js`) ---

// Handle customer saving
ipcMain.handle('save-customer', async (event, formData) => {
    try {
      const result = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS count FROM customers', [], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count + 1);
          }
        });
      });
      
      const invoiceNumber = String(result).padStart(5, '0');
  
      const query = `INSERT INTO customers (
        hireNo, contactNo, name, tripType, date, time, km, vehicleNo, driverContactNo, driverID, amount, cabNo, passenger, extraKm, waiting, noOfHires, pickup, "drop", additionalKm, additionalDayAmount, fuelAmount, totalAmount, invoiceNumber, noOfDays, stop1, stop2, stop3, stop4, nic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
      const params = [
        formData.hireNo, formData.contactNo, formData.name, formData.tripType, formData.date, formData.time, formData.km, formData.vehicleNo,
        formData.driverContactNo, formData.driverID, formData.amount, formData.cabNo, formData.passenger, formData.extraKm, formData.waiting,
        formData.noOfHires, formData.pickup, formData.drop, formData.additionalKm, formData.additionalDayAmount, formData.fuelAmount,
        formData.totalAmount, invoiceNumber, formData.noOfDays, formData.stop1, formData.stop2, formData.stop3, formData.stop4, formData.nic
      ];
  
      await new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        });
      });
  
      console.log(`Data saved successfully with Invoice Number: ${invoiceNumber}`);
      return { success: true, invoiceNumber };
    } catch (error) {
      console.error('Error saving customer data:', error);
      return { success: false, error };
    }
  });
  
  // Fetch customers
  ipcMain.handle('fetch-customers', async () => {
    const query = `SELECT * FROM customers`;
    try {
      const customers = await new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      return { success: true, data: customers };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return { success: false, error };
    }
  });
  
  // Fetch hire numbers
  ipcMain.handle('fetch-hire-numbers', async () => {
    const query = `SELECT hireNo FROM customers`;
    try {
      const hireNumbers = await new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const hireNos = rows.map(row => row.hireNo);
            resolve(hireNos);
          }
        });
      });
      return { success: true, data: hireNumbers };
    } catch (error) {
      console.error('Error fetching hire numbers:', error);
      return { success: false, error };
    }
  });

  ipcMain.handle('edit-customer', async (event, formData) => {
    const query = `
      UPDATE customers 
      SET
        hireNo = ?, contactNo = ?, name = ?, tripType = ?, date = ?, time = ?, km = ?, vehicleNo = ?, driverContactNo = ?, 
        driverID = ?, amount = ?, cabNo = ?, passenger = ?, extraKm = ?, waiting = ?, noOfHires = ?, pickup = ?, "drop" = ?, 
        additionalKm = ?, additionalDayAmount = ?, fuelAmount = ?, totalAmount = ?, invoiceNumber = ?, noOfDays = ?, stop1 = ?, 
        stop2 = ?, stop3 = ?, stop4 = ?
      WHERE id = ?
    `;
    const params = [
      formData.hireNo, formData.contactNo, formData.name, formData.tripType, formData.date, formData.time, formData.km, formData.vehicleNo,
      formData.driverContactNo, formData.driverID, formData.amount, formData.cabNo, formData.passenger, formData.extraKm, formData.waiting,
      formData.noOfHires, formData.pickup, formData.drop, formData.additionalKm, formData.additionalDayAmount, formData.fuelAmount,
      formData.totalAmount, formData.invoiceNumber, formData.noOfDays, formData.stop1, formData.stop2, formData.stop3, formData.stop4,
      formData.id
    ];

    try {
      await new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      console.log('Customer data updated successfully.');
      return { success: true };
    } catch (error) {
      console.error('Error updating customer data:', error);
      return { success: false, error };
    }
  });
  
  
  



  ipcMain.handle('save-driver', async (event, formData) => {
    console.log('Saving driver data:', formData);
    const query = `INSERT INTO drivers (
      name, contactNo, vehicleNo, vehicleType, acType, driverNo, cabNo, seatCount, rateOneWay, rateReturn, noOfHires
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      formData.name, formData.contactNo, formData.vehicleNo, formData.vehicleType, formData.acType, formData.driverNo, formData.cabNo, formData.seatCount, formData.rateOneWay, formData.rateReturn, formData.noOfHires
    ];
    
    try {
      await new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        });
      });
      console.log('Driver data saved successfully.');
      return { success: true };
    } catch (error) {
      console.error('Error saving driver data:', error);
      return { success: false, error };
    }
  });

  ipcMain.handle('fetch-drivers', async () => {
    console.log('Fetching drivers from database.');
    const query = `SELECT * FROM drivers`;
    try {
      const drivers = await new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      return { success: true, data: drivers };
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return { success: false, error };
    }
  });



  // Add the following inside the app.on('ready', () => { ... }) block

// ipcMain.handle('edit-customer', async (event, customer) => {
//   console.log('Editing customer data:', customer);
//   const query = `UPDATE customers SET hireNo = ?, contactNo = ?, name = ?, tripType = ?, date = ?, time = ?, km = ?, vehicleNo = ?, driverContactNo = ?, driverID = ?, amount = ?, cabNo = ?, passenger = ?, extraKm = ?, waiting = ?, noOfHires = ?, pickup = ?, "drop" = ? WHERE id = ?`;
//   const params = [
//     customer.hireNo, customer.contactNo, customer.name, customer.tripType, customer.date, customer.time, customer.km, customer.vehicleNo, customer.driverContactNo, customer.driverID, customer.amount, customer.cabNo, customer.passenger, customer.extraKm, customer.waiting, customer.noOfHires, customer.pickup, customer.drop, customer.id
//   ];

//   try {
//     await new Promise((resolve, reject) => {
//       db.run(query, params, function (err) {
//         if (err) {
//           reject(err);
//         } else {
//           resolve({ id: this.lastID });
//         }
//       });
//     });
//     console.log('Customer data updated successfully.');
//     return { success: true };
//   } catch (error) {
//     console.error('Error updating customer data:', error);
//     return { success: false, error };
//   }
// });

ipcMain.handle('delete-customer', async (event, id) => {
  console.log('Deleting customer data with ID:', id);
  const query = `DELETE FROM customers WHERE id = ?`;

  try {
    await new Promise((resolve, reject) => {
      db.run(query, [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
    console.log('Customer data deleted successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error deleting customer data:', error);
    return { success: false, error };
  }
});

// Handle editing a driver
ipcMain.handle('edit-driver', async (event, driver) => {
  const query = `
    UPDATE drivers 
    SET name = ?, contactNo = ?, vehicleNo = ?, vehicleType = ?, acType = ?, driverNo = ?, 
        cabNo = ?, seatCount = ?, rateOneWay = ?, rateReturn = ?, noOfHires = ? 
    WHERE id = ?
  `;
  const params = [
    driver.name, driver.contactNo, driver.vehicleNo, driver.vehicleType, driver.acType, driver.driverNo,
    driver.cabNo, driver.seatCount, driver.rateOneWay, driver.rateReturn, driver.noOfHires, driver.id
  ];

  try {
    await new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    console.log('Driver data updated successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error updating driver data:', error);
    return { success: false, error };
  }
});

// Handle deleting a driver
ipcMain.handle('delete-driver', async (event, id) => {
  const query = `DELETE FROM drivers WHERE id = ?`;

  try {
    await new Promise((resolve, reject) => {
      db.run(query, [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    console.log('Driver data deleted successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error deleting driver data:', error);
    return { success: false, error };
  }
});




// });
