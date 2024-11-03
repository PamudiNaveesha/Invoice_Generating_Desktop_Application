import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './customer.css';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';

const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Customer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hireNo: '',
    contactNo: '',
    name: '',
    nic: '',
    tripType: 'oneWay',
    date: '',
    time: '',
    km: '',
    vehicleNo: '',
    driverContactNo: '',
    driverID: '',
    amount: '',
    cabNo: '',
    passenger: '',
    waiting: '',
    noOfHires: '',
    pickup: '',
    drop: '',
    pickupCoords: { lat: 0, lng: 0 },
    dropCoords: { lat: 0, lng: 0 },
    noOfDays: '',
    stop1: '',
    stop1Coords: { lat: 0, lng: 0 },
    stop2: '',
    stop2Coords: { lat: 0, lng: 0 },
    stop3: '',
    stop3Coords: { lat: 0, lng: 0 },
    stop4: '',
    stop4Coords: { lat: 0, lng: 0 },
    additionalKm: '',
    additionalDayAmount: '',
    fuelAmount: '',
    totalAmount: '',
  });

  const [activeLocation, setActiveLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [errors, setErrors] = useState({
    contactNo: '',
    name: '',
    passenger: ''
  });
  const [error, setError] = useState('');  // For overall form errors
  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [position, setPosition] = useState({ lat: 7.8731, lng: 80.7718 }); // Sri Lanka center

  // Function to fetch the maximum hire ID and set the next hire number
  const fetchMaxIdAndSetHireNo = async () => {
    try {
      const result = await window.electron.fetchCustomers();
      if (result.success) {
        setCustomers(result.data);
        const maxId = result.data.length > 0 ? Math.max(...result.data.map(customer => customer.id)) : 0;
        const nextHireNo = maxId + 1;
        setFormData(prevFormData => ({
          ...prevFormData,
          hireNo: String(nextHireNo)
        }));
      } else {
        console.error('Failed to fetch customers:', result.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchMaxIdAndSetHireNo(); // Initialize hire number on component load

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

  useEffect(() => {
    const calculateTotalDistance = () => {
      let totalDistance = 0;

      const coords = [
        formData.pickupCoords,
        formData.stop1Coords.lat !== 0 ? formData.stop1Coords : null,
        formData.stop2Coords.lat !== 0 ? formData.stop2Coords : null,
        formData.stop3Coords.lat !== 0 ? formData.stop3Coords : null,
        formData.stop4Coords.lat !== 0 ? formData.stop4Coords : null,
        formData.dropCoords,
      ].filter(coord => coord);

      for (let i = 0; i < coords.length - 1; i++) {
        totalDistance += haversineDistance(coords[i], coords[i + 1]);
      }

      return totalDistance;
    };

    if (formData.pickupCoords.lat !== 0 && formData.dropCoords.lat !== 0) {
      const distance = calculateTotalDistance();
      setFormData((prevFormData) => {
        const updatedFormData = { ...prevFormData, km: distance.toFixed(2) };
        const driver = drivers.find(d => d.vehicleNo === updatedFormData.vehicleNo);
        if (driver) {
          const ratePerKm = formData.tripType === 'oneWay' ? driver.rateOneWay : driver.rateReturn;
          const amount = distance * ratePerKm;
          updatedFormData.amount = amount.toFixed(2);
        }
        return updatedFormData;
      });
    }
  }, [formData.pickupCoords, formData.dropCoords, formData.stop1Coords, formData.stop2Coords, formData.stop3Coords, formData.stop4Coords, formData.vehicleNo, formData.tripType, drivers]);

  const handleSearch = async () => {
    if (searchTerm) {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${searchTerm}&format=json&limit=5`);
      setSearchResults(response.data);
    }
  };

  const handleSelectLocation = (result) => {
    const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    
    console.log("Selected location:", result.display_name, coords); // Debugging output

    handleMapClick(coords);  // Update form data with selected location coordinates
    setPosition(coords);      // Center the map on the selected location
    
    if (map) {
        map.panTo(coords);    // Pan the map to the selected location
        console.log("Map panned to:", coords);  // Debugging output
    } else {
        console.error("Map instance is not available");
    }
  };

  const updateNoOfHires = (nic) => {
    // Calculate the number of hires for the customer based on NIC
    const nicCount = customers.filter(customer => customer.nic === nic).length;

    // Update the formData with the calculated noOfHires
    setFormData(prevFormData => ({
      ...prevFormData,
      noOfHires: nicCount
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    // Validation for contactNo (only digits, exactly 10 digits)
    if (name === 'contactNo') {
      const isNumeric = /^\d+$/.test(value);
      if (!isNumeric || value.length > 10) {
        setErrors(prevErrors => ({ ...prevErrors, contactNo: 'Contact number must be 10 digits long and only contain numbers.' }));
      } else if (value.length === 10) {
        setErrors(prevErrors => ({ ...prevErrors, contactNo: '' })); // Clear error when valid
      }
  
      // Limit to 10 digits
      if (value.length <= 10 && isNumeric) {
        setFormData(prevFormData => ({
          ...prevFormData,
          contactNo: value
        }));
      }
    }
    
    // Validation for name (only letters allowed)
    else if (name === 'name') {
      const isLetter = /^[A-Za-z\s]+$/.test(value); // Allows letters and spaces
      if (!isLetter) {
        setErrors(prevErrors => ({ ...prevErrors, name: 'Name must contain only letters.' }));
      } else {
        setErrors(prevErrors => ({ ...prevErrors, name: '' })); // Clear error when valid
      }
  
      if (isLetter) {
        setFormData(prevFormData => ({
          ...prevFormData,
          name: value
        }));
      }
    }
  
    // Validation for passenger (only digits allowed)
    else if (name === 'passenger') {
      const isNumeric = /^\d+$/.test(value);
      if (!isNumeric) {
        setErrors(prevErrors => ({ ...prevErrors, passenger: 'Passenger field must contain only digits.' }));
      } else {
        setErrors(prevErrors => ({ ...prevErrors, passenger: '' })); // Clear error when valid
      }
  
      if (isNumeric) {
        setFormData(prevFormData => ({
          ...prevFormData,
          passenger: value
        }));
      }
    }
  
    // All other fields
    else {
      setFormData(prevFormData => ({
        ...prevFormData,
        [name]: value
      }));
    }
  
    // Update the `nic` related logic
    if (name === 'nic') {
      updateNoOfHires(value);
    }
  };
  

  const handleRadioChange = (e) => {
    setFormData({ ...formData, tripType: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generatePDF();
    handleClearForm();  // Clear form data after generating the invoice
    fetchMaxIdAndSetHireNo(); // Set next hire number
  };

  const handleVehicleNoChange = (e) => {
    const selectedVehicleNo = e.target.value;
    const driver = drivers.find(d => d.vehicleNo === selectedVehicleNo);
    // const vehicleCount = customers.filter(customer => customer.vehicleNo === selectedVehicleNo).length;

    if (driver) {
      const ratePerKm = formData.tripType === 'oneWay' ? driver.rateOneWay : driver.rateReturn;
      const amount = formData.km * ratePerKm;

      setFormData({
        ...formData,
        vehicleNo: selectedVehicleNo,
        driverContactNo: driver.contactNo,
        driverID: driver.driverNo,
        amount: amount.toFixed(2),
        // noOfHires: vehicleCount
      });
    } else {
      setFormData({
        ...formData,
        vehicleNo: selectedVehicleNo,
        driverContactNo: '',
        driverID: '',
        amount: '',
        // noOfHires: vehicleCount
      });
    }
  };

  const handleCancel = () => {
    handleClearForm();
  };

  const handleClearForm = () => {
    setFormData({
      hireNo: '',
      contactNo: '',
      name: '',
      tripType: 'oneWay',
      date: '',
      time: '',
      km: '',
      vehicleNo: '',
      driverContactNo: '',
      driverID: '',
      amount: '',
      cabNo: '',
      passenger: '',
      waiting: '',
      noOfHires: '',
      pickup: '',
      drop: '',
      pickupCoords: { lat: 0, lng: 0 },
      dropCoords: { lat: 0, lng: 0 },
      noOfDays: '',
      stop1: '',
      stop1Coords: { lat: 0, lng: 0 },
      stop2: '',
      stop2Coords: { lat: 0, lng: 0 },
      stop3: '',
      stop3Coords: { lat: 0, lng: 0 },
      stop4: '',
      stop4Coords: { lat: 0, lng: 0 },
    });
  };

  const handleSave = async () => {
    // List of required fields
    const requiredFields = [
      'contactNo', 'name', 'nic', 'date', 'vehicleNo', 'pickup', 'drop'
    ];

    // Check if any required field is empty
    const newErrors = {};
    requiredFields.forEach(field => {
      if (!formData[field]) {
        // newErrors[field] = `${field} is required.`;
        newErrors[field] = true;  // Mark the field as invalid without setting a message
      }
    });

    // If any field is empty, set overall error and prevent save
    if (Object.keys(newErrors).length > 0) {
      // Reset the errors state to avoid retaining previous irrelevant errors
      setErrors(newErrors);
      setError('Please fill out all required fields.');
      return; // Prevent the save operation
    }

    // Clear overall error if all fields are valid
    setError('');

    try {
      const result = await window.electron.saveCustomer(formData);
      if (result.success) {
        setFormData(prevFormData => ({
          ...prevFormData,
          invoiceNumber: result.invoiceNumber
        }));
        alert(`Data saved successfully. Invoice Number: ${result.invoiceNumber}`);
      } else {
        alert('Failed to save data.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save data.');
    }
  };

  const generatePDF = () => {
    const { invoiceNumber } = formData;
  
    const doc = new jsPDF();
    const pageMargin = 10;
    const contentMargin = 15;
    const width = doc.internal.pageSize.getWidth() - pageMargin * 2;
    const height = doc.internal.pageSize.getHeight() - pageMargin * 2;
    doc.rect(pageMargin, pageMargin, width, height);
  
    // Use process.env.PUBLIC_URL to ensure correct image paths
    const imgCabService = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAeAB4AAD/4QL6RXhpZgAATU0AKgAAAAgABAE7AAIAAAAQAAABSodpAAQAAAABAAABWpydAAEAAAAgAAAC0uocAAcAAAEMAAAAPgAAAAAc6gAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUGFtdWRpIE5hdmVlc2hhAAAFkAMAAgAAABQAAAKokAQAAgAAABQAAAK8kpEAAgAAAAMzMAAAkpIAAgAAAAMzMAAA6hwABwAAAQwAAAGcAAAAABzqAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAyMDI0OjA4OjEwIDAxOjExOjEyADIwMjQ6MDg6MTAgMDE6MTE6MTIAAABQAGEAbQB1AGQAaQAgAE4AYQB2AGUAZQBzAGgAYQAAAP/hBCJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+DQo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIj48cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPjxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSJ1dWlkOmZhZjViZGQ1LWJhM2QtMTFkYS1hZDMxLWQzM2Q3NTE4MmYxYiIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIi8+PHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9InV1aWQ6ZmFmNWJkZDUtYmEzZC0xMWRhLWFkMzEtZDMzZDc1MTgyZjFiIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iPjx4bXA6Q3JlYXRlRGF0ZT4yMDI0LTA4LTEwVDAxOjExOjEyLjI5ODwveG1wOkNyZWF0ZURhdGU+PC9yZGY6RGVzY3JpcHRpb24+PHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9InV1aWQ6ZmFmNWJkZDUtYmEzZC0xMWRhLWFkMzEtZDMzZDc1MTgyZjFiIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iPjxkYzpjcmVhdG9yPjxyZGY6U2VxIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+PHJkZjpsaT5QYW11ZGkgTmF2ZWVzaGE8L3JkZjpsaT48L3JkZjpTZXE+DQoJCQk8L2RjOmNyZWF0b3I+PC9yZGY6RGVzY3JpcHRpb24+PC9yZGY6UkRGPjwveDp4bXBtZXRhPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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';
    const imgExpress = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAeAB4AAD/4QL6RXhpZgAATU0AKgAAAAgABAE7AAIAAAAQAAABSodpAAQAAAABAAABWpydAAEAAAAgAAAC0uocAAcAAAEMAAAAPgAAAAAc6gAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUGFtdWRpIE5hdmVlc2hhAAAFkAMAAgAAABQAAAKokAQAAgAAABQAAAK8kpEAAgAAAAM5OAAAkpIAAgAAAAM5OAAA6hwABwAAAQwAAAGcAAAAABzqAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAyMDI0OjA4OjEwIDAxOjEwOjQzADIwMjQ6MDg6MTAgMDE6MTA6NDMAAABQAGEAbQB1AGQAaQAgAE4AYQB2AGUAZQBzAGgAYQAAAP/hBCJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+DQo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIj48cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPjxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSJ1dWlkOmZhZjViZGQ1LWJhM2QtMTFkYS1hZDMxLWQzM2Q3NTE4MmYxYiIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIi8+PHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9InV1aWQ6ZmFmNWJkZDUtYmEzZC0xMWRhLWFkMzEtZDMzZDc1MTgyZjFiIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iPjx4bXA6Q3JlYXRlRGF0ZT4yMDI0LTA4LTEwVDAxOjEwOjQzLjk4MzwveG1wOkNyZWF0ZURhdGU+PC9yZGY6RGVzY3JpcHRpb24+PHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9InV1aWQ6ZmFmNWJkZDUtYmEzZC0xMWRhLWFkMzEtZDMzZDc1MTgyZjFiIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iPjxkYzpjcmVhdG9yPjxyZGY6U2VxIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+PHJkZjpsaT5QYW11ZGkgTmF2ZWVzaGE8L3JkZjpsaT48L3JkZjpTZXE+DQoJCQk8L2RjOmNyZWF0b3I+PC9yZGY6RGVzY3JpcHRpb24+PC9yZGY6UkRGPjwveDp4bXBtZXRhPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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';

    // Load the images into the PDF
    doc.addImage(imgExpress, 'JPEG', pageMargin + contentMargin, pageMargin + 5, 50, 20);
    doc.addImage(imgCabService, 'JPEG', pageMargin + width - 60, pageMargin + 5, 50, 20);
  
    doc.setFontSize(18);
    doc.text('Invoice', pageMargin + width / 2, 50, null, null, 'center');
  
    doc.setFontSize(11);
    doc.text(`Hire No: ${formData.hireNo}`, pageMargin + contentMargin, 60);
    doc.text(`Invoice No: ${invoiceNumber}`, pageMargin + contentMargin, 70);
    doc.text(`Customer Name: ${formData.name}`, pageMargin + contentMargin, 80);
    doc.text(`From: ${formData.pickup}`, pageMargin + contentMargin, 90);
    doc.text(`To: ${formData.drop}`, pageMargin + contentMargin, 100);
    doc.text(`Driver No: ${formData.driverID}`, pageMargin + width - 50, 60);
    doc.text(`Date: ${formData.date}`, pageMargin + width - 50, 70);
    doc.text(`Time: ${formData.time}`, pageMargin + width - 50, 80);
  
    doc.autoTable({
      startY: 110,
      margin: { left: pageMargin + contentMargin, right: pageMargin + contentMargin },
      head: [['Description', 'Details', 'Amount (Rs)']],
      body: [
        ['Initial Km for the trip', formData.km, formData.amount],
        ['Extra Km', formData.additionalKm, formData.extraKm],
        ['Additional Days', '', formData.additionalDayAmount],
        ['Total Fare Payable', '', formData.amount],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      tableWidth: 'auto',
    });
  
    doc.setFontSize(11);
    doc.text('Payment Details:', pageMargin + contentMargin, doc.lastAutoTable.finalY + 20);
    doc.text(`Account Name: W S C Fernando`, pageMargin + contentMargin, doc.lastAutoTable.finalY + 30);
    doc.text(`Account No: 034020341623`, pageMargin + contentMargin, doc.lastAutoTable.finalY + 40);
    doc.text(`Bank: HNB`, pageMargin + contentMargin, doc.lastAutoTable.finalY + 50);
    doc.text(`Branch: Kalutara`, pageMargin + contentMargin, doc.lastAutoTable.finalY + 60);
  
    doc.setFontSize(11);
    doc.text('Thank you for joining with cab.lk', pageMargin + width / 2, doc.lastAutoTable.finalY + 80, null, null, 'center');
  
    doc.save('invoice.pdf');
  };
  
  

  const handleSetLocationClick = (locationType) => {
    setActiveLocation(locationType);
  };

  const handleMapClick = async (coords) => {
    if (!activeLocation) return;

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=Your_API_Key`
        );

        if (response.data.status === "OK") {
            const address = response.data.results[0]?.formatted_address || `${coords.lat}, ${coords.lng}`;
            console.log("Geocoded Address:", address); // Log the address for debugging

            setFormData((prevFormData) => {
                if (activeLocation === 'pickup') {
                    return { ...prevFormData, pickupCoords: coords, pickup: address };
                } else if (activeLocation === 'drop') {
                    return { ...prevFormData, dropCoords: coords, drop: address };
                } else if (activeLocation === 'stop1') {
                    return { ...prevFormData, stop1Coords: coords, stop1: address };
                } else if (activeLocation === 'stop2') {
                    return { ...prevFormData, stop2Coords: coords, stop2: address };
                } else if (activeLocation === 'stop3') {
                    return { ...prevFormData, stop3Coords: coords, stop3: address };
                } else if (activeLocation === 'stop4') {
                    return { ...prevFormData, stop4Coords: coords, stop4: address };
                }
                return prevFormData;
            });

        } else {
            console.error("Geocoding failed:", response.data.status);
        }

    } catch (error) {
        console.error('Geocoding error:', error);
    }

    setActiveLocation(null);
};



  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
    mapInstance.panTo(position); // Center the map on Sri Lanka initially
  };

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = async () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;

      if (location) {
        const newCoords = {
          lat: location.lat(),
          lng: location.lng(),
        };
        handleMapClick(newCoords);
        setPosition(newCoords);
        map.panTo(newCoords);
      } else {
        const address = autocomplete.getPlace().formatted_address || autocomplete.getPlace().name;
        const geocodeResponse = await geocodeAddress(address);
        if (geocodeResponse) {
          const { lat, lng } = geocodeResponse;
          const newCoords = { lat, lng };
          handleMapClick(newCoords);
          setPosition(newCoords);
          map.panTo(newCoords);
        }
      }
    }
  };

  const geocodeAddress = async (address) => {
    const geocodeApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=Your_API_Key`;
    try {
      const response = await axios.get(geocodeApiUrl);
      if (response.data.status === 'OK') {
        const { lat, lng } = response.data.results[0].geometry.location;
        return { lat, lng };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  return (
    <div className="customer-container">
      <h1>Hires Page</h1>
      <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
        <div>
          <label>Hire No:</label>
          <input type="text" name="hireNo" value={formData.hireNo} readOnly />
        </div>
        <div>
          <label className="required">Contact No:</label>
          <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} />
          {errors.contactNo && <span style={{ color: 'red' }}>{errors.contactNo}</span>}
        </div>
        <div>
          <label className="required">Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} />
          {errors.name && <span style={{ color: 'red' }}>{errors.name}</span>}
        </div>
        <div>
        <label className="required">NIC:</label>
        <input type="text" name="nic" value={formData.nic} onChange={handleChange} />
      </div>
        <div>
          <label>Trip Type:</label>
          <label>
            <input
              type="radio"
              name="tripType"
              value="oneWay"
              checked={formData.tripType === 'oneWay'}
              onChange={handleRadioChange}
            />
            One Way
          </label>
          <label>
            <input
              type="radio"
              name="tripType"
              value="returnTrip"
              checked={formData.tripType === 'returnTrip'}
              onChange={handleRadioChange}
            />
            Return Trip
          </label>
        </div>
        <div>
          <label className="required">Date:</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} />
        </div>
        <div>
          <label>Time:</label>
          <input type="time" name="time" value={formData.time} onChange={handleChange} />
        </div>
        <div>
          <label>Km:</label>
          <input type="text" name="km" value={formData.km} onChange={handleChange} readOnly />
        </div>
        <div>
          <label className="required">Vehicle No:</label>
          <select name="vehicleNo" value={formData.vehicleNo} onChange={handleVehicleNoChange}>
            <option value="">Select Vehicle No</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.vehicleNo}>{driver.vehicleNo}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Driver Contact No:</label>
          <input type="text" name="driverContactNo" value={formData.driverContactNo} readOnly />
        </div>
        <div>
          <label>Driver ID:</label>
          <input type="text" name="driverID" value={formData.driverID} readOnly />
        </div>
        <div>
          <label>Amount:</label>
          <input type="text" name="amount" value={formData.amount} onChange={handleChange} readOnly />
        </div>
        {/* <div>
          <label>Cab No:</label>
          <input type="text" name="cabNo" value={formData.cabNo} onChange={handleChange} />
        </div> */}
        <div>
          <label>Passenger:</label>
          <input type="text" name="passenger" value={formData.passenger} onChange={handleChange} />
          {errors.passenger && <span style={{ color: 'red' }}>{errors.passenger}</span>}
        </div>
        <div>
          <label>Waiting:</label>
          <input type="text" name="waiting" value={formData.waiting} onChange={handleChange} />
        </div>
        <div>
          <label>No Of Hires:</label>
          <input type="text" name="noOfHires" value={formData.noOfHires} readOnly />
        </div>
        <div>
          <label className="required">Pickup:</label>
          <input
            type="text"
            name="pickup"
            value={formData.pickup}
            onChange={handleChange}
            placeholder="Click on map to set pickup location"
          />
        </div>
        <div>
          <button type="button" onClick={() => handleSetLocationClick('pickup')}>Set Pickup Location</button>
        </div>
        <div>
          <label className="required">Drop:</label>
          <input
            type="text"
            name="drop"
            value={formData.drop}
            onChange={handleChange}
            placeholder="Click on map to set drop location"
          />
        </div>
        <div>
          <button type="button" onClick={() => handleSetLocationClick('drop')}>Set Drop Location</button>
        </div>

        <div>
          <input
            type="text"
            placeholder="Search for a location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" onClick={handleSearch}>Search</button>
        </div>

        {searchResults.length > 0 && (
          <ul>
            {searchResults.map((result, index) => (
              <li key={index} onClick={() => handleSelectLocation(result)} style={{ cursor: 'pointer' }}>
                {result.display_name}
              </li>
            ))}
          </ul>
        )}

        <div>
          <label>No of Days:</label>
          <select name="noOfDays" value={formData.noOfDays} onChange={handleChange} disabled={formData.tripType === 'oneWay'}>
            <option value="">Select No of Days</option>
            {[...Array(31).keys()].map(day => (
              <option key={day} value={day + 1}>{day + 1}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Stop 1:</label>
          <input type="text" name="stop1" value={formData.stop1} onChange={handleChange} disabled={formData.tripType === 'oneWay'} />
        </div>
        <div>
          <button type="button" onClick={() => handleSetLocationClick('stop1')} disabled={formData.tripType === 'oneWay'}>Set Stop 1 Location</button>
        </div>
        <div>
          <label>Stop 2:</label>
          <input type="text" name="stop2" value={formData.stop2} onChange={handleChange} disabled={formData.tripType === 'oneWay'} />
        </div>
        <div>
          <button type="button" onClick={() => handleSetLocationClick('stop2')} disabled={formData.tripType === 'oneWay'}>Set Stop 2 Location</button>
        </div>
        <div>
          <label>Stop 3:</label>
          <input type="text" name="stop3" value={formData.stop3} onChange={handleChange} disabled={formData.tripType === 'oneWay'} />
        </div>
        <div>
          <button type="button" onClick={() => handleSetLocationClick('stop3')} disabled={formData.tripType === 'oneWay'}>Set Stop 3 Location</button>
        </div>
        <div>
          <label>Stop 4:</label>
          <input type="text" name="stop4" value={formData.stop4} onChange={handleChange} disabled={formData.tripType === 'oneWay'} />
        </div>
        <div>
          <button type="button" onClick={() => handleSetLocationClick('stop4')} disabled={formData.tripType === 'oneWay'}>Set Stop 4 Location</button>
        </div>
        
        <div className="button-group">
          <button type="button" onClick={() => navigate(-1)}>Back</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
          <button type="button" onClick={handleSave}>Save</button>
          <button type="submit">Generate Invoice</button>
        </div>
      {/* </form> */}

      <div className="map-container">
        <h2>Map</h2>
        <LoadScript googleMapsApiKey="Your_API_Key" libraries={['places']}>
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              placeholder="Enter a location"
              style={{
                boxSizing: 'border-box',
                border: '1px solid transparent',
                width: '240px',
                height: '32px',
                padding: '0 12px',
                borderRadius: '3px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                fontSize: '14px',
                outline: 'none',
                textOverflow: 'ellipsis',
                position: 'absolute',
                left: '50%',
                marginLeft: '-120px',
              }}
            />
          </Autocomplete>
          <GoogleMap
              onLoad={onMapLoad}
              mapContainerStyle={{ width: '100%', height: '400px' }}
              center={position}
              zoom={8}
              onClick={(e) => {
                  const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                  handleMapClick(coords);
                  setPosition(coords);
              }}
          >
              {formData.pickupCoords.lat !== 0 && <Marker position={formData.pickupCoords} />}
              {formData.dropCoords.lat !== 0 && <Marker position={formData.dropCoords} />}
              {[formData.stop1Coords, formData.stop2Coords, formData.stop3Coords, formData.stop4Coords].map(
                  (coords, index) => coords.lat !== 0 && <Marker key={index} position={coords} />
              )}
          </GoogleMap>

        </LoadScript>
      </div>
      </form>
    </div>
  );
};

export default Customer;
