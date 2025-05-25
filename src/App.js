import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import NavBar from './components/NavBar';
import banner from './assets/banner.jpg';
import Container from './components/Container';
import Working from './components/Working';
import Footer from './components/Footer';
import Lost from './components/Lost';
import Service from './components/Service'; 
import Transport from './components/Transport'; 
import Admin from './components/Admin'

function MainLayout() {
  return (
    <>
      <NavBar />
      <div style={{ paddingTop: '70px' }}>
        <img src={banner} style={{ width: '100%', height: '600px' }} alt="Banner" />
        <Container />
        <Working />
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
       
        <Route path="/" element={<MainLayout />} />

       
        <Route path="/lost" element={<Lost />} />
        <Route path="/service" element={<Service />} />
        <Route path="/transport" element={<Transport />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
