// NavBar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const NavBar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar fixed-top" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="container-fluid">
        <a className="navbar-brand">
          <img src={logo} height="55" alt="Logo" />
        </a>

        <button
          className="btn"
          style={{ backgroundColor: 'white', color: '#198754', border: '1px solid #198754' }}
          onClick={() => navigate('/admin')}
        >
          Admin Login
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
