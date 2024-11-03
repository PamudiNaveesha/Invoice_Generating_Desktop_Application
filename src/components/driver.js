import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Import useNavigate
import './driver.css';


const Driver = () => {
  const navigate = useNavigate();  // Initialize useNavigate
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '',
    vehicleNo: '',
    vehicleType: 'Choose...',
    acType: 'Choose...',
    driverNo: '',
    cabNo: '',
    seatCount: '',
    rateOneWay: '',
    rateReturn: '',
    noOfHires: ''
  });
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  // const [isEditingOneWay, setIsEditingOneWay] = useState(false);
  // const [isEditingReturn, setIsEditingReturn] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validation logic
    switch (name) {
      case 'name':
        // Allow letters and spaces only
        if (/^[A-Za-z\s]*$/.test(value)) {
          setFormData({ ...formData, [name]: value });
        } else {
          setError('Name can contain letters and spaces only.');
        }
        break;
      case 'contactNo':
        // Allow only numbers and restrict to 10 digits
        if (/^\d{0,10}$/.test(value)) {
          setFormData({ ...formData, [name]: value });
        } else {
          setError('Contact No must be exactly 10 digits.');
        }
        break;
      case 'driverNo':
        // Restrict to a maximum of 15 characters
        if (value.length <= 15) {
          setFormData({ ...formData, [name]: value });
        } else {
          setError('Driver ID cannot exceed 15 characters.');
        }
        break;
      case 'seatCount':
      case 'rateOneWay':
      case 'rateReturn':
        // Allow only numbers
        if (/^\d*$/.test(value)) {
          setFormData({ ...formData, [name]: value });
        } else {
          setError(`${name} must contain numbers only.`);
        }
        break;
      default:
        setFormData({ ...formData, [name]: value });
        break;
    }
  };

  // const handleRateChange = (e) => {
  //   const { name, value } = e.target;
  //   if (name === 'rateOneWay') {
  //     setIsEditingOneWay(true);
  //     setIsEditingReturn(false);
  //   } else if (name === 'rateReturn') {
  //     setIsEditingReturn(true);
  //     setIsEditingOneWay(false);
  //   }
  //   setFormData({ ...formData, [name]: value });
  // };

  const handleCancel = () => {
    setFormData({
      name: '',
      contactNo: '',
      vehicleNo: '',
      vehicleType: 'Choose...',
      acType: 'Choose...',
      driverNo: '',
      cabNo: '',
      seatCount: '',
      rateOneWay: '',
      rateReturn: '',
      noOfHires: ''
    });
    setError(''); // Clear any existing error messages
  };

  const handleSave = async () => {
    // Check if any required field is empty
    const requiredFields = [
      'name', 'contactNo', 'vehicleNo', 'vehicleType', 
      'acType', 'driverNo', 'seatCount', 
      'rateOneWay', 'rateReturn'
    ];
    const isEmptyField = requiredFields.some(field => !formData[field]);

    if (isEmptyField) {
      setError('Please fill out all required fields.');
      return; // Prevent the save operation
    }


    try {
      const result = await window.electron.saveDriver(formData);
      if (result.success) {
        alert('Driver details saved successfully.');
        setFormData({  // Reset form data to initial state after successful save
          name: '',
          contactNo: '',
          vehicleNo: '',
          vehicleType: 'Car',
          acType: 'AC',
          driverNo: '',
          cabNo: '',
          seatCount: '',
          rateOneWay: '',
          rateReturn: '',
          noOfHires: ''
        });
        setError(''); // Clear any existing error messages
        fetchDrivers(); // Fetch updated list of drivers after saving
      } else {
        alert('Failed to save driver details.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save driver details.');
    }
  };  

  const fetchDrivers = async () => {
    try {
      const result = await window.electron.fetchDrivers();
      if (result.success) {
        setDrivers(result.data);
      } else {
        alert('Failed to fetch driver details.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Failed to fetch driver details.');
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  return (
    <div>
      <h1>Driver Page</h1>
      <form>
      {error && <p className="error-message">{error}</p>}  {/* Display error message if any */}
        <div>
          <label className="required">Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label className="required">Contact No:</label>
          <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} required />
        </div>
        <div>
          <label className="required">Vehicle No:</label>
          <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} required />
        </div>
        <div>
          <label className="required">Vehicle Type:</label>
          <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} required >
            <option value="Choose">Choose...</option>
            <option value="Tuk">Tuk</option>
            <option value="Car">Car</option>
            <option value="Van">Van</option>
            <option value="Van">Truck</option>
            <option value="Bus">Bus</option>
          </select>
        </div>
        <div>
          <label className="required">AC Type:</label>
          <select name="acType" value={formData.acType} onChange={handleChange} required >
            <option value="Choose">Choose...</option>
            <option value="AC">AC</option>
            <option value="Non AC">Non AC</option>
          </select>
        </div>
        <div>
          <label className="required">Driver ID:</label>
          <input type="text" name="driverNo" value={formData.driverNo} onChange={handleChange} required />
        </div>
        {/* <div>
          <label>Cab No:</label>
          <input type="text" name="cabNo" value={formData.cabNo} onChange={handleChange} />
        </div> */}
        <div>
          <label className="required">Seat Count:</label>
          <input type="text" name="seatCount" value={formData.seatCount} onChange={handleChange} required />
        </div>
        <div>
          <label>Rate per Km:</label>
          <div>
            <label className="required">One Way:</label>
            <input 
              type="text" 
              name="rateOneWay" 
              value={formData.rateOneWay} 
              onChange={handleChange}
              required
              // onChange={handleRateChange} 
              // disabled={isEditingReturn} 
            />
          </div>
          <div>
            <label className="required">Return:</label>
            <input 
              type="text" 
              name="rateReturn" 
              value={formData.rateReturn || ''}
              onChange={handleChange} 
              required 
              // onChange={handleRateChange} 
              // disabled={isEditingOneWay} 
            />
          </div>
        </div>
        {/* <div>
          <label>No of Hires with Us:</label>
          <input type="text" name="noOfHires" value={formData.noOfHires} onChange={handleChange} />
        </div> */}
        <div>
          <button type="button" onClick={() => navigate(-1)}>Back</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
          <button type="button" onClick={handleSave}>Save</button>
        </div>
      </form>

      {/* <h2>Driver Details</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact No</th>
            <th>Vehicle No</th>
            <th>Vehicle Type</th>
            <th>AC Type</th>
            <th>Driver No</th>
            <th>Cab No</th>
            <th>Seat Count</th>
            <th>Rate (One Way)</th>
            <th>Rate (Return)</th>
            <th>No of Hires</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id}>
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
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
};

export default Driver;
