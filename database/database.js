const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// Use app.getPath('userData') to store the database in a proper location
const dbPath = path.join(app.getPath('userData'), 'customerData.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database:', err);
  } else {
    console.log('Connected to database.');
  }
});

// Helper function to check and add a column if it doesn't exist
const addColumnIfNotExists = (tableName, columnName, columnDefinition) => {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`Error fetching table info for ${tableName}:`, err);
      return;
    }

    const columnExists = columns.some(column => column.name === columnName);
    if (!columnExists) {
      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (err) => {
        if (err) {
          console.error(`Failed to add ${columnName} column:`, err);
        } else {
          console.log(`Column ${columnName} added successfully.`);
        }
      });
    } else {
      console.log(`Column ${columnName} already exists in ${tableName} table.`);
    }
  });
};

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hireNo TEXT,
    contactNo TEXT,
    name TEXT,
    tripType TEXT,
    date TEXT,
    time TEXT,
    km TEXT,
    vehicleNo TEXT,
    driverContactNo TEXT,
    driverID TEXT,
    amount TEXT,
    cabNo TEXT,
    passenger TEXT,
    extraKm TEXT,
    waiting TEXT,
    noOfHires TEXT,
    pickup TEXT,
    "drop" TEXT
  )`, (err) => {
    if (err) {
      console.error('Failed to create table:', err);
    } else {
      console.log('Table is ready.');
    }
  });
});



db.run(`CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  contactNo TEXT,
  vehicleNo TEXT,
  vehicleType TEXT,
  acType TEXT,
  driverNo TEXT,
  cabNo TEXT,
  seatCount TEXT,
  rateOneWay TEXT,
  rateReturn TEXT,
  noOfHires TEXT
)`, (err) => {
  if (err) {
    console.error('Failed to create table:', err);
  } else {
    console.log('Table is ready.');
  }
});

// Safely add missing columns to the 'customers' table
addColumnIfNotExists('customers', 'additionalKm', 'TEXT');
addColumnIfNotExists('customers', 'additionalDayAmount', 'TEXT');
addColumnIfNotExists('customers', 'fuelAmount', 'TEXT');
addColumnIfNotExists('customers', 'totalAmount', 'TEXT');
addColumnIfNotExists('customers', 'invoiceNumber', 'TEXT');
addColumnIfNotExists('customers', 'noOfDays', 'TEXT');
addColumnIfNotExists('customers', 'stop1', 'TEXT');
addColumnIfNotExists('customers', 'stop2', 'TEXT');
addColumnIfNotExists('customers', 'stop3', 'TEXT');
addColumnIfNotExists('customers', 'stop4', 'TEXT');
addColumnIfNotExists('customers', 'nic', 'TEXT');


// Modify customers table to add new columns
// db.run(`ALTER TABLE customers ADD COLUMN additionalKm TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add additionalKm column:', err);
//   } else {
//     console.log('Column additionalKm added successfully.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN additionalDayAmount TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add additionalDayAmount column:', err);
//   } else {
//     console.log('Column additionalDayAmount added successfully.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN fuelAmount TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add fuelAmount column:', err);
//   } else {
//     console.log('Column fuelAmount added successfully.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN totalAmount TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add totalAmount column:', err);
//   } else {
//     console.log('Column totalAmount added successfully.');
//   }
// });

// Close the database connection when done
// db.close((err) => {
//   if (err) {
//     console.error('Failed to close the database connection:', err);
//   } else {
//     console.log('Database connection closed.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN invoiceNumber TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add invoiceNumber column:', err);
//   } else {
//     console.log('Column invoiceNumber added successfully.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN noOfDays TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add noOfDays column:', err);
//   } else {
//     console.log('Column noOfDays added successfully.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN stop1 TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add stop1 column:', err);
//   } else {
//     console.log('Column stop1 added successfully.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN stop2 TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add stop2 column:', err);
//   } else {
//     console.log('Column stop2 added successfully.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN stop3 TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add stop3 column:', err);
//   } else {
//     console.log('Column stop3 added successfully.');
//   }
// });

// db.run(`ALTER TABLE customers ADD COLUMN stop4 TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add stop4 column:', err);
//   } else {
//     console.log('Column stop4 added successfully.');
//   }
// });

// Modify customers table to add NIC column
// db.run(`ALTER TABLE customers ADD COLUMN nic TEXT;`, (err) => {
//   if (err) {
//     console.error('Failed to add NIC column:', err);
//   } else {
//     console.log('Column NIC added successfully.');
//   }
// });



module.exports = db;
