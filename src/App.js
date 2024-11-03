import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/home';
import Customer from './components/customer';
import Driver from './components/driver';
import CustomerViewer from './components/CustomerViewer';
import DriverViewer from './components/DriverViewer';
import './index.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/driver" element={<Driver />} />
        <Route path="/customer-viewer" element={<CustomerViewer />} />
        <Route path="/driver-viewer" element={<DriverViewer />} />
      </Routes>
    </Router>
  );
};

export default App;
