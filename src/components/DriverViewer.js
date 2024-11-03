import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './driverViewer.css';

const DriverViewer = () => {
  const [drivers, setDrivers] = useState([]);
  const [editDriver, setEditDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');  // State for search term
  const [searchResult, setSearchResult] = useState(null);  // State for search result
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const result = await window.electron.fetchDrivers();
        if (result.success) {
          setDrivers(result.data);
        } else {
          console.error('Failed to fetch drivers:', result.error);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchDrivers();
  }, []);

  // Update search results when searchTerm changes
  useEffect(() => {
    if (searchTerm === '') {
      setSearchResult(null);  // Reset search result to show all drivers
    } else {
      const result = drivers.find(driver => driver.vehicleNo === searchTerm);
      setSearchResult(result || null);
    }
  }, [searchTerm, drivers]);

  const handleEdit = (driver) => {
    setEditDriver(driver);
  };

  const exportToCSV = (data, filename) => {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        const result = await window.electron.deleteDriver(id);
        if (result.success) {
          setDrivers(drivers.filter(driver => driver.id !== id));
          alert('Driver deleted successfully.');
        } else {
          alert('Failed to delete driver.');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('An error occurred while deleting the driver.');
      }
    }
  };

  const handleSave = async () => {
    try {
      const result = await window.electron.editDriver(editDriver);
      if (result.success) {
        setDrivers(drivers.map(driver => driver.id === editDriver.id ? editDriver : driver));
        setEditDriver(null);
        alert('Driver edited successfully.');
      } else {
        alert('Failed to save driver.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('An error occurred while saving the driver.');
    }
  };

  return (
    <div>
      <h1>Drivers List</h1>

      {/* Search Form */}
      <div className="export-button-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by Vehicle No"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {/* <button onClick={() => setSearchTerm(searchTerm)} className="search-button">Search</button> */}
      </div>
      <button type="button" onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => exportToCSV(drivers, 'drivers.csv')}>Export Drivers</button>
    </div>

      {editDriver ? (
        <div>
          <h2 style={{ textAlign: 'center' }}>Edit Driver</h2>
          <form>
            {Object.keys(editDriver).map((key) => (
              <div key={key}>
                <label>{key}:</label>
                <input
                  type="text"
                  value={editDriver[key]}
                  onChange={(e) => setEditDriver({ ...editDriver, [key]: e.target.value })}
                />
              </div>
            ))}
            <button type="button" onClick={handleSave}>Save</button>
            <button type="button" onClick={() => setEditDriver(null)}>Cancel</button>
          </form>
        </div>
      ) : (
        <div>
          {/* Display Search Result */}
          {searchResult ? (
            <div className="search-result">
              <h2>Search Result:</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Contact No</th>
                    <th>Vehicle No</th>
                    <th>Vehicle Type</th>
                    <th>AC Type</th>
                    <th>Driver No</th>
                    <th>Cab No</th>
                    <th>Seat Count</th>
                    <th>Rate One Way</th>
                    <th>Rate Return</th>
                    <th>No of Hires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{searchResult.id}</td>
                    <td>{searchResult.name}</td>
                    <td>{searchResult.contactNo}</td>
                    <td>{searchResult.vehicleNo}</td>
                    <td>{searchResult.vehicleType}</td>
                    <td>{searchResult.acType}</td>
                    <td>{searchResult.driverNo}</td>
                    <td>{searchResult.cabNo}</td>
                    <td>{searchResult.seatCount}</td>
                    <td>{searchResult.rateOneWay}</td>
                    <td>{searchResult.rateReturn}</td>
                    <td>{searchResult.noOfHires}</td>
                    <td>
                      <div className="table-actions">
                        <button className="edit" onClick={() => handleEdit(searchResult)}>Edit</button>
                        <button className="delete" onClick={() => handleDelete(searchResult.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              {/* Display All Drivers */}
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Contact No</th>
                    <th>Vehicle No</th>
                    <th>Vehicle Type</th>
                    <th>AC Type</th>
                    <th>Driver No</th>
                    <th>Cab No</th>
                    <th>Seat Count</th>
                    <th>Rate One Way</th>
                    <th>Rate Return</th>
                    <th>No of Hires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id}>
                      <td>{driver.id}</td>
                      <td>{driver.name}</td>
                      <td>{driver.contactNo}</td>
                      <td>{driver.vehicleNo}</td>
                      <td>{driver.vehicleType}</td>
                      <td>{driver.acType}</td>
                      <td>{driver.driverNo}</td>
                      <td>{driver.cabNo}</td>
                      <td>{driver.seatCount}</td>
                      <td>{driver.rateOneWay}</td>
                      <td>{driver.rateReturn}</td>
                      <td>{driver.noOfHires}</td>
                      <td>
                        <div className="table-actions">
                          <button className="edit" onClick={() => handleEdit(driver)}>Edit</button>
                          <button className="delete" onClick={() => handleDelete(driver.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverViewer;
