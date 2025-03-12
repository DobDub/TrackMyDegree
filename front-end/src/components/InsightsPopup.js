import React from 'react';
import '../css/InsightsPopup.css';
import ProgressChart from './ProgressChart'; // Import the chart component



const InsightsPopup = ({ onClose }) => {
  return (
    <div className="insights-popup-overlay">
      <div className="insights-popup-content">
        <h2>Progress Overview</h2>

        {/* Render the Progress Chart */}
        <ProgressChart />

        {/* Close Button */}
        <button onClick={onClose} className="close-popup-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default InsightsPopup;