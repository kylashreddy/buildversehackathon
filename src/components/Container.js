import React from 'react';
import { useNavigate } from 'react-router-dom';

const InfoSections = () => {
  const navigate = useNavigate();  // Initialize navigate hook

  const cardStyle = {
    flex: 1,
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: 'rgba(173, 216, 230, 0.3)',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={cardStyle}>
          <h3>Lost</h3>
          <p>Information about lost items.</p>
          <ul>
            <li>Classrooms and labs</li>
            <li>Dormitories</li>
            <li>Cafeterias and dining halls</li>
            <li>Sports facilities</li>
            <li>Library services</li>
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/lost')}
          >
            Report Lost Item
          </button>
        </div>

        <div style={cardStyle}>
          <h3>Campus Services</h3>
          <p>Report issue with facilities, equipment or campus services.</p>
          <ul>
            <li>Left in classrooms or common areas</li>
            <li>Missing from specified locations</li>
            <li>Valuable personal belongings</li>
            <li>ID cards and documents</li>
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/service')}
          >
            Report Service
          </button>
        </div>

        <div style={cardStyle}>
          <h3>Transportation</h3>
          <p>Report issue with campus transport service.</p>
          <ul>
            <li>Campus shuttle delays</li>
            <li>Bus route issues</li>
            <li>Parking concerns</li>
            <li>Driver behavior</li>
            <li>Vehicle conditions</li>
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/transport')}  // example path
          >
            Report Transportation Issue
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoSections;
