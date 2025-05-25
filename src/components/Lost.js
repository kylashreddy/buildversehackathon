import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin, Package, User, History, Plus, Eye, Calendar, Phone, Mail, Building } from 'lucide-react';

const LostItemsReport = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loginError, setLoginError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userReports, setUserReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    remember: true
  });

  const [formData, setFormData] = useState({
    reporterName: '',
    reporterPhone: '',
    branch: '',
    incidentDate: '',
    timeLost: '',
    location: '',
    itemCategory: '',
    itemName: '',
    itemDescription: '',
    itemValue: '',
    additionalNotes: ''
  });

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyiikADJd5LCVGM9_K17uyl778_dkClT_vJrX_Dldw_TnV5j5QnAaK7MokQGh9lb3Hu/exec';

  const extractNameFromEmail = (email) => {
    let name = email.split('@')[0];
    name = name.replace(/[^a-zA-Z]/g, ' ');
    name = name.replace(/\b\w/g, l => l.toUpperCase());
    return name.trim() || 'User';
  };

  const fetchUserReports = async (email) => {
    setIsLoadingHistory(true);
    setErrorMessage('');
    const fetchPayload = {
      action: "getUserReports",
      email: email
    };
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fetchPayload),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const transformedReports = (data.reports || []).map(report => ({
            id: report.id || `RPT${Date.now()}`,
            timestamp: report.timestamp || new Date().toISOString(),
            itemName: report.itemName || 'Unknown Item',
            itemCategory: report.itemCategory || 'Other',
            location: report.location || 'Unknown Location',
            status: report.status || 'Under Investigation',
            incidentDate: report.incidentDate || new Date().toISOString().split('T')[0],
            branch: report.branch || 'Unknown Campus',
            itemDescription: report.itemDescription || 'No description provided',
            itemValue: report.itemValue || '',
            reporterPhone: report.reporterPhone || '',
            timeLost: report.timeLost || '',
            additionalNotes: report.additionalNotes || '',
            reporterName: report.reporterName || '',
            reporterEmail: report.reporterEmail || email
          }));
          setUserReports(transformedReports);
        } else {
          console.error('API Error:', data.message || 'Failed to fetch reports');
          setErrorMessage(data.message || 'Failed to load reports. Please try again.');
          setUserReports([]);
        }
      } else {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setErrorMessage('Unable to connect to the server. Please check your internet connection and try again.');
      setUserReports([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(false);
    setIsLoggingIn(true);
    const loginPayload = {
      action: "login",
      email: loginData.email,
      password: loginData.password
    };
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });
      setTimeout(() => {
        const validDomains = ["jainuniversity.ac.in"];
        const domain = loginData.email.split('@')[1];
        if (validDomains.includes(domain)) {
          const extractedName = extractNameFromEmail(loginData.email);
          setUserEmail(loginData.email);
          setUserName(extractedName);
          setFormData(prev => ({ ...prev, reporterName: extractedName }));
          setIsLoggedIn(true);
          setCurrentView('dashboard');
          setIsLoggingIn(false);
          fetchUserReports(loginData.email);
        } else {
          setLoginError(true);
          setIsLoggingIn(false);
        }
      }, 2000);
    } catch (error) {
      setLoginError(true);
      setIsLoggingIn(false);
      console.error('Login Error:', error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('dashboard');
    setUserEmail('');
    setUserName('');
    setUserReports([]);
    setSelectedReport(null);
    setLoginData({ email: '', password: '', remember: true });
    setFormData({
      reporterName: '',
      reporterPhone: '',
      branch: '',
      incidentDate: '',
      timeLost: '',
      location: '',
      itemCategory: '',
      itemName: '',
      itemDescription: '',
      itemValue: '',
      additionalNotes: ''
    });
    const logoutPayload = {
      action: "logout",
      email: userEmail || "unknown"
    };
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logoutPayload),
    }).catch(error => console.error('Logout error:', error));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(false);
    setErrorMessage('');
    setIsSubmitting(true);
    const requiredFields = ['reporterName', 'reporterPhone', 'branch', 'incidentDate', 'location', 'itemCategory', 'itemName', 'itemDescription'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setErrorMessage('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }
    const timestamp = new Date().toISOString();
    const submissionData = {
      action: "submitReport",
      timestamp: timestamp,
      reportType: "Lost Item",
      reporterEmail: userEmail,
      ...formData
    };
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      setSuccessMessage(true);
      setIsSubmitting(false);
      const reporterName = formData.reporterName;
      setFormData({
        reporterName,
        reporterPhone: '',
        branch: '',
        incidentDate: '',
        timeLost: '',
        location: '',
        itemCategory: '',
        itemName: '',
        itemDescription: '',
        itemValue: '',
        additionalNotes: ''
      });
      fetchUserReports(userEmail);
      setTimeout(() => {
        setCurrentView('dashboard');
        setSuccessMessage(false);
      }, 3000);
    } catch (error) {
      setErrorMessage('Error submitting form. Please try again.');
      setIsSubmitting(false);
      console.error('Error:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Found': return '#22c55e';
      case 'Under Investigation': return '#f59e0b';
      case 'Closed': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '2rem 1rem',
      backgroundImage: 'linear-gradient(180deg, #16213e 0%, #0f3460 100%)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: '0.5rem',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    subtitle: {
      fontSize: '1.1rem',
      color: 'rgba(255,255,255,0.9)',
      marginBottom: '0'
    },
    dashboardContainer: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    formContainer: {
      maxWidth: '400px',
      margin: '0 auto',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      padding: '2rem',
      border: '1px solid #e2e8f0'
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      padding: '2rem',
      border: '1px solid #e2e8f0',
      marginBottom: '2rem'
    },
    navBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem 2rem',
      marginBottom: '2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    navButtons: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap'
    },
    navButton: {
      padding: '0.75rem 1.5rem',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      background: 'white',
      color: '#374151',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    navButtonActive: {
      backgroundColor: '#4299e1',
      color: 'white',
      borderColor: '#4299e1'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      color: '#374151'
    },
    welcomeCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    statCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
    },
    statIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem'
    },
    reportsGrid: {
      display: 'grid',
      gap: '1.5rem'
    },
    reportCard: {
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.5rem',
      backgroundColor: 'white',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    reportHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem'
    },
    reportMeta: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginTop: '1rem'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
      color: '#6b7280'
    },
    statusBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      color: 'white'
    },
    message: {
      padding: '1rem',
      borderRadius: '10px',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    successMessage: {
      backgroundColor: '#f0fff4',
      color: '#22543d',
      border: '1px solid #68d391'
    },
    errorMessage: {
      backgroundColor: '#fed7d7',
      color: '#742a2a',
      border: '1px solid #fc8181'
    },
    button: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#4299e1',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      width: '100%'
    },
    buttonSecondary: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    row: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '1.5rem'
    },
    floatLabel: {
      position: 'relative'
    },
    input: {
      width: '100%',
      padding: '1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      backgroundColor: 'white',
      outline: 'none',
      boxSizing: 'border-box'
    },
    label: {
      position: 'absolute',
      left: '1rem',
      top: '1rem',
      fontSize: '1rem',
      color: '#718096',
      transition: 'all 0.3s ease',
      pointerEvents: 'none',
      backgroundColor: 'white',
      padding: '0 0.5rem'
    },
    labelActive: {
      top: '-0.5rem',
      fontSize: '0.8rem',
      color: '#4299e1',
      fontWeight: '600'
    },
    labelRequired: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.5rem'
    },
    select: {
      width: '100%',
      padding: '1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '1rem',
      backgroundColor: 'white',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '1rem',
      backgroundColor: 'white',
      outline: 'none',
      resize: 'vertical',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box',
      minHeight: '100px'
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Lost Items Reporting System</h1>
        <p style={styles.subtitle}>Report, track, and recover lost items with ease</p>
      </div>
      <div style={styles.dashboardContainer}>
        {!isLoggedIn ? (
          <div style={styles.formContainer}>
            <form onSubmit={handleLogin}>
              <div style={styles.formGroup}>
                <label style={styles.labelRequired}>Email</label>
                <input
                  type="email"
                  style={styles.input}
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.labelRequired}>Password</label>
                <input
                  type="password"
                  style={styles.input}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={loginData.remember}
                    onChange={(e) => setLoginData({ ...loginData, remember: e.target.checked })}
                  />
                  Remember me
                </label>
              </div>
              {loginError && (
                <div style={{ ...styles.message, ...styles.errorMessage }}>
                  <AlertCircle size={20} style={{ marginRight: '0.5rem' }} />
                  Invalid email or password. Please try again.
                </div>
              )}
              <button type="submit" style={styles.button} disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <span style={styles.spinner}></span>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div style={styles.navBar}>
              <div style={styles.userInfo}>
                <User size={20} />
                <span>{userName}</span>
                <span>{userEmail}</span>
              </div>
              <div style={styles.navButtons}>
                <button
                  style={currentView === 'dashboard' ? { ...styles.navButton, ...styles.navButtonActive } : styles.navButton}
                  onClick={() => setCurrentView('dashboard')}
                >
                  <Package size={16} />
                  Dashboard
                </button>
                <button
                  style={currentView === 'form' ? { ...styles.navButton, ...styles.navButtonActive } : styles.navButton}
                  onClick={() => setCurrentView('form')}
                >
                  <Plus size={16} />
                  Report Lost Item
                </button>
                <button
                  style={currentView === 'history' ? { ...styles.navButton, ...styles.navButtonActive } : styles.navButton}
                  onClick={() => setCurrentView('history')}
                >
                  <History size={16} />
                  My Reports
                </button>
                <button style={styles.navButton} onClick={handleLogout}>
                  <Eye size={16} />
                  Logout
                </button>
              </div>
            </div>
            {currentView === 'dashboard' && (
              <div style={styles.card}>
                <div style={styles.welcomeCard}>
                  <h2>Welcome, {userName}!</h2>
                  <p>You can report lost items or view your previous reports.</p>
                </div>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#4299e1', color: 'white' }}>
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3>Active Reports</h3>
                      <p>{userReports.filter(r => r.status === 'Under Investigation').length}</p>
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#22c55e', color: 'white' }}>
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <h3>Resolved</h3>
                      <p>{userReports.filter(r => r.status === 'Found').length}</p>
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, backgroundColor: '#6b7280', color: 'white' }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3>Closed</h3>
                      <p>{userReports.filter(r => r.status === 'Closed').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentView === 'form' && (
              <div style={styles.formContainer}>
                <h2>Report a Lost Item</h2>
                {successMessage && (
                  <div style={{ ...styles.message, ...styles.successMessage }}>
                    <CheckCircle size={20} style={{ marginRight: '0.5rem' }} />
                    Your report has been submitted successfully!
                  </div>
                )}
                {errorMessage && (
                  <div style={{ ...styles.message, ...styles.errorMessage }}>
                    <AlertCircle size={20} style={{ marginRight: '0.5rem' }} />
                    {errorMessage}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div style={styles.row}>
                    <div style={styles.formGroup}>
                      <label style={styles.labelRequired}>Reporter Name</label>
                      <input
                        type="text"
                        style={styles.input}
                        value={formData.reporterName}
                        onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.labelRequired}>Reporter Phone</label>
                      <input
                        type="tel"
                        style={styles.input}
                        value={formData.reporterPhone}
                        onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.row}>
                    <div style={styles.formGroup}>
                      <label style={styles.labelRequired}>Branch</label>
                      <select
                        style={styles.select}
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        required
                      >
                        <option value="">Select Branch</option>
                        <option value="Main Campus">Main Campus</option>
                        <option value="City Campus">City Campus</option>
                        <option value="North Campus">North Campus</option>
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.labelRequired}>Incident Date</label>
                      <input
                        type="date"
                        style={styles.input}
                        value={formData.incidentDate}
                        onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.row}>
                    <div style={styles.formGroup}>
                      <label>Time Lost</label>
                      <input
                        type="time"
                        style={styles.input}
                        value={formData.timeLost}
                        onChange={(e) => setFormData({ ...formData, timeLost: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.labelRequired}>Location</label>
                      <input
                        type="text"
                        style={styles.input}
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.row}>
                    <div style={styles.formGroup}>
                      <label style={styles.labelRequired}>Item Category</label>
                      <select
                        style={styles.select}
                        value={formData.itemCategory}
                        onChange={(e) => setFormData({ ...formData, itemCategory: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Documents">Documents</option>
                        <option value="Jewelry">Jewelry</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.labelRequired}>Item Name</label>
                      <input
                        type="text"
                        style={styles.input}
                        value={formData.itemName}
                        onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.labelRequired}>Item Description</label>
                    <textarea
                      style={styles.textarea}
                      value={formData.itemDescription}
                      onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.row}>
                    <div style={styles.formGroup}>
                      <label>Estimated Value</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.itemValue}
                        onChange={(e) => setFormData({ ...formData, itemValue: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label>Additional Notes</label>
                      <textarea
                        style={styles.textarea}
                        value={formData.additionalNotes}
                        onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" style={styles.button} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span style={styles.spinner}></span>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </form>
              </div>
            )}
            {currentView === 'history' && (
              <div style={styles.card}>
                <h2>My Reports</h2>
                {isLoadingHistory && <span style={styles.spinner}></span>}
                {errorMessage && (
                  <div style={{ ...styles.message, ...styles.errorMessage }}>
                    <AlertCircle size={20} style={{ marginRight: '0.5rem' }} />
                    {errorMessage}
                  </div>
                )}
                <div style={styles.reportsGrid}>
                  {userReports.map((report) => (
                    <div
                      key={report.id}
                      style={styles.reportCard}
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                    >
                      <div style={styles.reportHeader}>
                        <h3>{report.itemName}</h3>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(report.status)
                          }}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p>{report.itemDescription}</p>
                      <div style={styles.reportMeta}>
                        <div style={styles.metaItem}>
                          <MapPin size={16} />
                          <span>{report.location}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <Building size={16} />
                          <span>{report.branch}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <Calendar size={16} />
                          <span>{report.incidentDate}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <Clock size={16} />
                          <span>{report.timeLost || 'Unknown'}</span>
                        </div>
                      </div>
                      {selectedReport?.id === report.id && (
                        <div style={{ marginTop: '1rem' }}>
                          <div style={styles.metaItem}>
                            <User size={16} />
                            <span>{report.reporterName}</span>
                          </div>
                          <div style={styles.metaItem}>
                            <Phone size={16} />
                            <span>{report.reporterPhone}</span>
                          </div>
                          <div style={styles.metaItem}>
                            <Mail size={16} />
                            <span>{report.reporterEmail}</span>
                          </div>
                          <div style={styles.metaItem}>
                            <span>Estimated Value: {report.itemValue || 'Not specified'}</span>
                          </div>
                          <div style={styles.metaItem}>
                            <span>Additional Notes: {report.additionalNotes || 'None'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LostItemsReport;

