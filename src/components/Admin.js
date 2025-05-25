import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import AdminLogin from './AdminLogin';
const AdminDashboard = () => {
  const [allReports, setAllReports] = useState([]);
  const [currentView, setCurrentView] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for login status

  // !! IMPORTANT: Replace with your deployed Google Apps Script URL !!
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyiikADJd5LCVGM9_K17uyl778_dkClT_vJrX_Dldw_TnV5j5QnAaK7MokQGh9lb3Hu/exec';

  useEffect(() => {
    // Check login status on component mount
    const adminStatus = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    setIsLoggedIn(adminStatus);
    if (adminStatus) {
      fetchReports();
    }
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getReports`);
      const data = await response.json();
      
      if (data.status === 'success') {
        const sortedReports = data.reports.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setAllReports(sortedReports);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredReports = () => {
    let filtered = allReports;
    
    if (currentView === 'damaged') {
      filtered = allReports.filter(report => report.reportType === "Damaged Material" || report.reportType === "Service Required");
    } else if (currentView === 'lost') {
      filtered = allReports.filter(report => report.reportType === "Lost Item");
    } else if (currentView === 'transport') { // Filter for Transport reports
      filtered = allReports.filter(report => report.reportType === "Transport Report");
    }

    if (searchTerm) {
      filtered = filtered.filter(report => 
        (report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.itemName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.classroom?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.branch?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        // Add search for transport specific fields
        (report.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.driverName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.issueDescription?.toLowerCase().includes(searchTerm.toLowerCase())) 
      );
    }

    return filtered;
  };

  // Analytics data preparation
  const getAnalyticsData = () => {
    const reportTypes = {
      'Lost Items': allReports.filter(r => r.reportType === 'Lost Item').length,
      'Damaged Materials': allReports.filter(r => r.reportType === 'Damaged Material').length,
      'Transport Reports': allReports.filter(r => r.reportType === 'Transport Report').length, // Corrected to match backend type
      'Service Required': allReports.filter(r => r.reportType === 'Service Required').length // Added Service Required
    };

    const statusData = {
      'Completed': allReports.filter(r => r.status === 'done').length,
      'Pending': allReports.filter(r => r.status !== 'done').length
    };

    const branchData = {};
    allReports.forEach(report => {
      const branch = report.branch || 'Unknown';
      branchData[branch] = (branchData[branch] || 0) + 1;
    });

    // Monthly trend data (last 6 months)
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthReports = allReports.filter(report => {
        const reportDate = new Date(report.timestamp);
        return reportDate.getMonth() === date.getMonth() && 
               reportDate.getFullYear() === date.getFullYear();
      });
      
      monthlyData.push({
        month: monthName,
        reports: monthReports.length,
        // Add specific report type counts for the monthly trend
        lost: monthReports.filter(r => r.reportType === 'Lost Item').length,
        damaged: monthReports.filter(r => r.reportType === 'Damaged Material').length,
        transport: monthReports.filter(r => r.reportType === 'Transport Report').length,
        service: monthReports.filter(r => r.reportType === 'Service Required').length,
      });
    }

    return {
      reportTypes: Object.entries(reportTypes).map(([name, value]) => ({ name, value })),
      statusData: Object.entries(statusData).map(([name, value]) => ({ name, value })),
      branchData: Object.entries(branchData).map(([name, value]) => ({ name, value })),
      monthlyData
    };
  };

  const handleEdit = (report) => {
    setEditingReport({...report});
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const updateData = {
        action: 'updateReport',
        id: editingReport.id,
        rowIndex: editingReport.rowIndex,
        reportType: editingReport.reportType,
        reporterName: editingReport.reporterName,
        reporterPhone: editingReport.reporterPhone,
        branch: editingReport.branch,
        status: editingReport.status,
        additionalNotes: editingReport.additionalNotes
      };

      // Conditionally add fields based on report type
      if (editingReport.reportType === "Damaged Material") {
        updateData.classroom = editingReport.classroom;
        updateData.itemName = editingReport.itemName; // Ensure itemName is passed
      } else if (editingReport.reportType === "Lost Item") {
        updateData.location = editingReport.location;
        updateData.itemName = editingReport.itemName; // Ensure itemName is passed
      } else if (editingReport.reportType === "Transport Report") {
        updateData.vehicleNumber = editingReport.vehicleNumber;
        updateData.driverName = editingReport.driverName;
        updateData.issueDescription = editingReport.issueDescription;
      } else if (editingReport.reportType === "Service Required") {
        updateData.locationDetails = editingReport.locationDetails; // Match backend field
        updateData.equipmentName = editingReport.equipmentName; // Match backend field
        updateData.issueDescription = editingReport.issueDescription;
      }


      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Send as text/plain for Apps Script to parse JSON
        body: JSON.stringify(updateData)
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // Fallback for non-JSON responses from Apps Script (e.g., plain "success" string)
        data = text.includes('success') ? { status: 'success' } : { status: 'error' };
      }

      if (data.status === 'success') {
        // Re-fetch all reports to ensure data consistency after update
        fetchReports(); 
        setShowModal(false);
        showToast('Changes saved successfully!');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error("Error saving report:", error);
      showToast('Error saving changes', true);
    }
  };

  const showToast = (message, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    fetchReports(); // Fetch reports after successful login
  };

  const logout = () => {
    sessionStorage.removeItem('isAdminLoggedIn'); // Clear session storage
    sessionStorage.removeItem('adminUsername'); // Clear session storage
    setIsLoggedIn(false); // Set login status to false
    // If you have a separate route for the user portal, you can navigate there
    // window.location.href = '/user-portal.html'; 
  };

  const filteredReports = getFilteredReports();
  const analyticsData = getAnalyticsData();
  const COLORS = ['#1a73e8', '#0f9d58', '#f4b400', '#db4437', '#ab47bc']; // Added more colors for more types

  const renderAnalytics = () => (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="title">Analytics Dashboard</h1>
        <p className="subtitle">Overview of all reports and trends</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{allReports.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{allReports.filter(r => r.status === 'done').length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{allReports.filter(r => r.status !== 'done').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.round((allReports.filter(r => r.status === 'done').length / allReports.length) * 100) || 0}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Report Types Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analyticsData.reportTypes}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {analyticsData.reportTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {analyticsData.reportTypes.map((entry, index) => (
              <div key={entry.name} className="legend-item">
                <div className="legend-color" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>Reports by Branch</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.branchData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px'
                }}
              />
              <Bar dataKey="value" fill="#1a73e8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px'
                }}
              />
              <Line type="monotone" dataKey="reports" stroke="#1a73e8" strokeWidth={2} name="Total Reports" />
              <Line type="monotone" dataKey="lost" stroke="#f4b400" strokeWidth={2} name="Lost Items" />
              <Line type="monotone" dataKey="damaged" stroke="#0f9d58" strokeWidth={2} name="Damaged Materials" />
              <Line type="monotone" dataKey="transport" stroke="#db4437" strokeWidth={2} name="Transport Reports" />
              <Line type="monotone" dataKey="service" stroke="#ab47bc" strokeWidth={2} name="Service Required" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Status Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.statusData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#fff" />
              <YAxis dataKey="name" type="category" stroke="#fff" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px'
                }}
              />
              <Bar dataKey="value" fill="#0f9d58" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isLoggedIn ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} onBackToUser={() => { /* Add logic for back to user portal, e.g., navigate to a different route */ }} />
      ) : (
        <div className="container">
          <div className="sidebar">
            <div className="logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
              Admin Dashboard
            </div>
            
          
            <div className={`nav-item ${currentView === 'all' ? 'active' : ''}`} 
                 onClick={() => setCurrentView('all')}>All Reports</div>
            <div className={`nav-item ${currentView === 'damaged' ? 'active' : ''}`} 
                 onClick={() => setCurrentView('damaged')}>Damaged/Service Reports</div>
            <div className={`nav-item ${currentView === 'lost' ? 'active' : ''}`} 
                 onClick={() => setCurrentView('lost')}>Lost Items</div>
            <div className={`nav-item ${currentView === 'transport' ? 'active' : ''}`} // New Nav Item for Transport
                 onClick={() => setCurrentView('transport')}>Transport Reports</div>
            <div className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`} 
                 onClick={() => setCurrentView('analytics')}>Analytics</div>
            <div className="nav-item" onClick={fetchReports}>Refresh Data</div>
            <div className="nav-item logout" onClick={logout}>Logout</div>
          </div>
          
          <div className="main">
            {currentView === 'analytics' ? renderAnalytics() : (
              <>
                <div className="header">
                  <h1 className="title">Reports Overview</h1>
                  <input 
                    type="text" 
                    className="search" 
                    placeholder="Search reports..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="tab-container">
                  <div className={`tab ${currentView === 'all' ? 'active' : ''}`} 
                       onClick={() => setCurrentView('all')}>All Reports</div>
                  <div className={`tab ${currentView === 'damaged' ? 'active' : ''}`} 
                       onClick={() => setCurrentView('damaged')}>Damaged/Service</div>
                  <div className={`tab ${currentView === 'lost' ? 'active' : ''}`} 
                       onClick={() => setCurrentView('lost')}>Lost Items</div>
                  <div className={`tab ${currentView === 'transport' ? 'active' : ''}`} // New Tab for Transport
                       onClick={() => setCurrentView('transport')}>Transport</div>
                </div>
                
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Reporter</th>
                        {/* Conditionally render header based on report type to show specific columns */}
                        {currentView === 'transport' ? (
                          <>
                            <th>Vehicle No.</th>
                            <th>Driver</th>
                            <th>Issue</th>
                          </>
                        ) : (
                          <>
                            <th>Item</th>
                            <th>Location</th>
                          </>
                        )}
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={currentView === 'transport' ? "7" : "6"}> {/* Adjust colspan */}
                            <div className="loader">
                              <div className="spinner"></div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={currentView === 'transport' ? "7" : "6"} style={{textAlign: 'center', padding: '2rem'}}> {/* Adjust colspan */}
                            No reports found.
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((report) => (
                          <tr key={report.id}>
                            <td>{new Date(report.timestamp).toLocaleDateString()}</td>
                            <td>
                                {report.reportType === "Damaged Material" ? "Damaged" :
                                 report.reportType === "Lost Item" ? "Lost" :
                                 report.reportType === "Transport Report" ? "Transport" :
                                 report.reportType === "Service Required" ? "Service" : report.reportType}
                            </td>
                            <td>{report.reporterName || ''}</td>
                            {report.reportType === "Transport Report" ? (
                              <>
                                <td>{report.vehicleNumber || '-'}</td>
                                <td>{report.driverName || '-'}</td>
                                <td>{report.issueDescription || '-'}</td>
                              </>
                            ) : (
                              <>
                                <td>{report.itemName || report.equipmentName || ''}</td> {/* Combine item/equipment name */}
                                <td>{report.classroom || report.location || report.locationDetails || "-"}</td> {/* Combine location fields */}
                              </>
                            )}
                            <td>
                              <span className={`status ${report.status === "done" ? "status-done" : "status-pending"}`}>
                                {report.status === "done" ? "Completed" : "Pending"}
                              </span>
                            </td>
                            <td className="actions">
                              <button className="btn btn-sm btn-primary" onClick={() => handleEdit(report)}>
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Edit Modal */}
          {showModal && editingReport && (
            <div className="modal active">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Edit {editingReport.reportType}</h2>
                  <span style={{cursor: 'pointer'}} onClick={() => setShowModal(false)}>✕</span>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Reporter Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingReport.reporterName || ''}
                      onChange={(e) => setEditingReport({...editingReport, reporterName: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingReport.reporterPhone || ''}
                      onChange={(e) => setEditingReport({...editingReport, reporterPhone: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Branch</label>
                    <select 
                      className="form-control" 
                      value={editingReport.branch || ''}
                      onChange={(e) => setEditingReport({...editingReport, branch: e.target.value})}
                    >
                      <option value="">Select Branch</option>
                      <option value="FET Campus">FET Campus</option>
                      <option value="PU Block">PU Block</option>
                      <option value="Aerospace Campus">Aerospace Campus</option>
                    </select>
                  </div>
                  
                  {/* Conditional fields based on report type */}
                  {editingReport.reportType === "Damaged Material" && (
                    <>
                      <div className="form-group">
                        <label>Item Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingReport.itemName || ''}
                          onChange={(e) => setEditingReport({...editingReport, itemName: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Classroom/Location</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingReport.classroom || ''}
                          onChange={(e) => setEditingReport({...editingReport, classroom: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  {editingReport.reportType === "Lost Item" && (
                    <>
                      <div className="form-group">
                        <label>Item Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingReport.itemName || ''}
                          onChange={(e) => setEditingReport({...editingReport, itemName: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Known Location</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingReport.location || ''}
                          onChange={(e) => setEditingReport({...editingReport, location: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  {editingReport.reportType === "Transport Report" && (
                    <>
                      <div className="form-group">
                        <label>Vehicle Number</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingReport.vehicleNumber || ''}
                          onChange={(e) => setEditingReport({...editingReport, vehicleNumber: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Driver Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingReport.driverName || ''}
                          onChange={(e) => setEditingReport({...editingReport, driverName: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Issue Description</label>
                        <textarea 
                          className="form-control" 
                          rows="3"
                          value={editingReport.issueDescription || ''}
                          onChange={(e) => setEditingReport({...editingReport, issueDescription: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  {editingReport.reportType === "Service Required" && (
                    <>
                      <div className="form-group">
                        <label>Equipment/Item Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingReport.equipmentName || ''}
                          onChange={(e) => setEditingReport({...editingReport, equipmentName: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Location Details</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingReport.locationDetails || ''}
                          onChange={(e) => setEditingReport({...editingReport, locationDetails: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Issue Description</label>
                        <textarea 
                          className="form-control" 
                          rows="3"
                          value={editingReport.issueDescription || ''}
                          onChange={(e) => setEditingReport({...editingReport, issueDescription: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      className="form-control" 
                      value={editingReport.status || 'pending'}
                      onChange={(e) => setEditingReport({...editingReport, status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                      <option value="in_progress">In Progress</option> {/* Added In Progress Status */}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={editingReport.additionalNotes || ''}
                      onChange={(e) => setEditingReport({...editingReport, additionalNotes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div className={`toast show ${toastError ? 'error' : ''}`}>
              {toastMessage}
            </div>
          )}
<>
          <style jsx global>{`
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background: #1a1a2e;
    }

    *, *::before, *::after {
      box-sizing: inherit;
    }
  `}</style>

  <style jsx>{`
    .container {
      display: flex;
      width: 100vw;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: white;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }

    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, #16213e 0%, #0f3460 100%);
      display: flex;
      flex-direction: column;
      padding: 2rem 0;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 2rem;
      margin-bottom: 3rem;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .nav-item {
      padding: 1rem 2rem;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 3px solid transparent;
      display: flex;
      align-items: center;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      border-left-color: #1a73e8;
    }

    .nav-item.active {
      background: rgba(26, 115, 232, 0.2);
      border-left-color: #1a73e8;
      color: #4fc3f7;
    }

    .nav-item.logout {
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #f44336;
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .search {
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      width: 300px;
    }

    .analytics-container {
      padding: 2rem;
      overflow-y: auto;
      height: 100%;
    }

    .analytics-header {
      margin-bottom: 2rem;
    }

    .analytics-header .title {
      font-size: 2rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1a73e8;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .chart-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .chart-card h3 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .tab-container {
      display: flex;
      padding: 0 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .tab {
      padding: 1rem 1.5rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab.active {
      border-bottom-color: #1a73e8;
      color: #4fc3f7;
    }

    .table-container {
      flex: 1;
      overflow: auto;
      padding: 2rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      overflow: hidden;
    }

    th,
    td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    th {
      background: rgba(255, 255, 255, 0.1);
      font-weight: 600;
    }

    .status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-pending {
      background: rgba(244, 180, 0, 0.2);
      color: #f4b400;
    }

    .status-done {
      background: rgba(15, 157, 88, 0.2);
      color: #0f9d58;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #1a73e8;
      color: white;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #1a1a2e;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #0f9d58;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 6px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 1001;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.error {
      background: #f44336;
    }

    .loader {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid #1a73e8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }

      100% {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .chart-card {
        min-width: 300px;
      }
    }
  `}</style>
</>


        </div>
      )}
    </>
  );
};

export default AdminDashboard;
