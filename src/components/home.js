import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

const Home = () => {
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className="home-container">
      <div className="left-column">
      <h1 className="app-name">Invoice Generator</h1>
        <button onClick={() => navigateTo('/driver')} className="nav-button">Add Driver</button>
        <button onClick={() => navigateTo('/customer')} className="nav-button">Add New Hire</button>
        {/* <button onClick={() => navigateTo('/hires')} className="nav-button">Update Existing Hires</button> */}
        <button onClick={() => navigateTo('/driver-viewer')} className="nav-button">Drivers List</button>
        <button onClick={() => navigateTo('/customer-viewer')} className="nav-button">Hires List</button>
      </div>
      <div
        className="right-column"
        style={{ backgroundImage: `url('${process.env.PUBLIC_URL}/images/background2.jpg')` }} // Ensure this path is correct
      >
        {/* <div className="overlay">
          <div className="text-container">
            <h1 className="app-name">Invoice Generator</h1>
            <h2 className="company-name">Express Lanka Tours</h2>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Home;
