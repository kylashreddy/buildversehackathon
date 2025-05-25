import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin, Package, User, History, Plus, Eye, Calendar, Phone, Mail, Building } from 'lucide-react';

const TransportForm = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'form', 'history'
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

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    remember: true
  });

  // Form state
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterPhone: '',
    busRoute: '',
    incidentDate: '',
    incidentTime: '',
    issueType: '',
    description: '',
    severity: '',
    additionalNotes: ''
  });

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyiikADJd5LCVGM9_K17uyl778_dkClT_vJrX_Dldw_TnV5j5QnAaK7MokQGh9lb3Hu/exec';

  // Extract name from email
  const extractNameFromEmail = (email) => {
    let name = email.split('@')[0];
    name = name.replace(/[^a-zA-Z]/g, ' ');
    name = name.replace(/\b\w/g, l => l.toUpperCase());
    return name.trim() || 'User';
  };

  // Fetch user reports
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
          // Transform the data to ensure consistent structure
          const transformedReports = (data.reports || []).map(report => ({
            id: report.id || `RPT${Date.now()}`,
            timestamp: report.timestamp || new Date().toISOString(),
            issueType: report.issueType || 'Unknown Issue',
            busRoute: report.busRoute || 'Unknown Route',
            status: report.status || 'Under Investigation',
            incidentDate: report.incidentDate || new Date().toISOString().split('T')[0],
            description: report.description || 'No description provided',
            reporterPhone: report.reporterPhone || '',
            incidentTime: report.incidentTime || '',
            additionalNotes: report.additionalNotes || '',
            reporterName: report.reporterName || '',
            severity: report.severity || '',
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

  // Handle login
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

  // Handle logout
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
      busRoute: '',
      incidentDate: '',
      incidentTime: '',
      issueType: '',
      description: '',
      severity: '',
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(false);
    setErrorMessage('');
    setIsSubmitting(true);

    const requiredFields = ['reporterName', 'reporterPhone', 'busRoute', 'incidentDate', 'issueType', 'description', 'severity'];
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
      reportType: "Transport Issues",
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
        busRoute: '',
        incidentDate: '',
        incidentTime: '',
        issueType: '',
        description: '',
        severity: '',
        additionalNotes: ''
      });

      // Refresh user reports
      fetchUserReports(userEmail);
      
      // Switch back to dashboard after successful submission
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

  // Format date for display
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#22c55e';
      case 'Under Investigation': return '#f59e0b';
      case 'Closed': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  // CSS Styles
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
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: 'white',
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
      alignItems: 'center',
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
    },
    modal: {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
      padding: '2rem'
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '16px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto',
      padding: '2rem'
    }
  };

  const FloatingLabelInput = ({ type, id, value, onChange, placeholder, required, label }) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    useEffect(() => {
      setHasValue(value && value.length > 0);
    }, [value]);

    const isActive = focused || hasValue;

    return (
      <div style={styles.floatLabel}>
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          required={required}
        />
        <label 
          htmlFor={id}
          style={{
            ...styles.label,
            ...(isActive ? styles.labelActive : {})
          }}
        >
          {label} {required && '*'}
        </label>
      </div>
    );
  };

  const ReportModal = ({ report, onClose }) => (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600' }}>Report Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <span style={{...styles.statusBadge, backgroundColor: getStatusColor(report.status)}}>{report.status}</span>
        </div>

        <div style={styles.reportMeta}>
          <div style={styles.metaItem}>
            <Package size={16} />
            <span><strong>Issue:</strong> {report.issueType}</span>
          </div>
          <div style={styles.metaItem}>
            <Calendar size={16} />
            <span><strong>Date:</strong> {new Date(report.incidentDate).toLocaleDateString()}</span>
          </div>
          <div style={styles.metaItem}>
            <Clock size={16} />
            <span><strong>Time:</strong> {report.incidentTime}</span>
          </div>
          <div style={styles.metaItem}>
            <MapPin size={16} />
            <span><strong>Route:</strong> {report.busRoute}</span>
          </div>
          <div style={styles.metaItem}>
            <AlertCircle size={16} />
            <span><strong>Severity:</strong> {report.severity}</span>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Description:</h4>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>{report.description}</p>
        </div>

        {report.additionalNotes && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Additional Notes:</h4>
            <p style={{ color: '#6b7280' }}>{report.additionalNotes}</p>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button onClick={onClose} style={styles.button}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input:focus, select:focus, textarea:focus {
            border-color: #4299e1 !important;
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1) !important;
          }
          
          button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          
          .report-card:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
            transform: translateY(-2px);
          }
        `}
      </style>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Transport Issues Portal</h1>
        <p style={styles.subtitle}>Campus Transport Management System</p>
      </div>

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
        /* Dashboard */
        <div style={styles.dashboardContainer}>
          {/* Navigation */}
          <div style={styles.navBar}>
            <div style={styles.userInfo}>
              <User size={20} />
              <span style={{ fontWeight: '600' }}>Welcome, {userName}</span>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{userEmail}</span>
            </div>
            
            <div style={styles.navButtons}>
              <button
                onClick={() => setCurrentView('dashboard')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'dashboard' ? styles.navButtonActive : {})
                }}
              >
                <User size={18} />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('form')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'form' ? styles.navButtonActive : {})
                }}
              >
                <Plus size={18} />
                Report Issue
              </button>
              <button
                onClick={() => setCurrentView('history')}
                style={{
                  ...styles.navButton,
                  ...(currentView === 'history' ? styles.navButtonActive : {})
                }}
              >
                <History size={18} />
                My Reports
              </button>
              <button onClick={handleLogout} style={{...styles.navButton, ...styles.buttonSecondary}}>
                Logout
              </button>
            </div>
          </div>

          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <>
              {/* Welcome Card */}
              <div style={{...styles.card, ...styles.welcomeCard}}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to Your Dashboard</h2>
                <p style={{ fontSize: '1.1rem', opacity: '0.9', margin: '0' }}>
                  Manage your transport issue reports and track their status
                </p>
              </div>

              {/* Stats Grid */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{...styles.statIcon, backgroundColor: '#dbeafe', color: '#3b82f6'}}>
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      {userReports.length}
                    </h3>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>Total Reports</p>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{...styles.statIcon, backgroundColor: '#dcfce7', color: '#22c55e'}}>
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      {userReports.filter(r => r.status === 'Resolved').length}
                    </h3>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>Resolved</p>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{...styles.statIcon, backgroundColor: '#fef3c7', color: '#f59e0b'}}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      {userReports.filter(r => r.status === 'Under Investigation').length}
                    </h3>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>Pending</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={styles.card}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: '600' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <button
                    onClick={() => setCurrentView('form')}
                    style={{...styles.button, padding: '1.5rem', flexDirection: 'column', height: 'auto'}}
                  >
                    <Plus size={24} />
                    <span style={{ marginTop: '0.5rem' }}>Report New Transport Issue</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('history')}
                    style={{...styles.button, ...styles.buttonSecondary, padding: '1.5rem', flexDirection: 'column', height: 'auto'}}
                  >
                    <History size={24} />
                    <span style={{ marginTop: '0.5rem' }}>View All Reports</span>
                  </button>
                </div>
              </div>

              {/* Recent Reports */}
              {userReports.length > 0 && (
                <div style={styles.card}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: '600' }}>Recent Reports</h3>
                  <div style={styles.reportsGrid}>
                    {userReports.slice(0, 3).map((report, index) => (
                      <div
                        key={index}
                        className="report-card"
                        style={styles.reportCard}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div style={styles.reportHeader}>
                          <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                              {report.issueType}
                            </h4>
                            <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>
                              {report.busRoute}
                            </p>
                          </div>
                          <span style={{...styles.statusBadge, backgroundColor: getStatusColor(report.status)}}>
                            {report.status}
                          </span>
                        </div>
                        
                        <div style={styles.reportMeta}>
                          <div style={styles.metaItem}>
                            <Calendar size={14} />
                            <span>{formatDate(report.timestamp)}</span>
                          </div>
                          <div style={styles.metaItem}>
                            <AlertCircle size={14} />
                            <span>{report.severity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Form View */}
          {currentView === 'form' && (
            <div style={styles.formContainer}>
              {successMessage && (
                <div style={{...styles.message, ...styles.successMessage}}>
                  <CheckCircle size={20} style={{marginRight: '0.75rem'}} />
                  Your report has been submitted successfully!
                </div>
              )}

              {errorMessage && (
                <div style={{...styles.message, ...styles.errorMessage}}>
                  <AlertCircle size={20} style={{marginRight: '0.75rem'}} />
                  {errorMessage}
                </div>
              )}

              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '2rem', textAlign: 'center' }}>
                Report Transport Issue
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Reporter Information */}
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>
                  Reporter Information
                </h3>
                
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

                <div style={styles.formGroup}>
                  <label htmlFor="busRoute" style={styles.labelRequired}>Bus Route/Number *</label>
                  <select
                    id="busRoute"
                    value={formData.busRoute}
                    onChange={(e) => setFormData({ ...formData, busRoute: e.target.value })}
                    style={styles.select}
                    required
                  >
                    <option value="">Select bus route</option>
                    <option value="Route 1A - Banashankari">Route 1A - Banashankari</option>
                    <option value="Route 2B - Jayanagar">Route 2B - Jayanagar</option>
                    <option value="Route 3C - Electronic City">Route 3C - Electronic City</option>
                    <option value="Route 4D - Whitefield">Route 4D - Whitefield</option>
                    <option value="Route 5E - Hebbal">Route 5E - Hebbal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Incident Details */}
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', margin: '2rem 0 1.5rem 0', color: '#374151' }}>
                  Incident Details
                </h3>

                <div style={styles.row}>
                  <div style={styles.formGroup}>
                    <label htmlFor="incidentDate" style={styles.labelRequired}>Date of Incident *</label>
                    <input
                      type="date"
                      id="incidentDate"
                      value={formData.incidentDate}
                      onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label htmlFor="incidentTime" style={styles.labelRequired}>Approximate Time</label>
                    <input
                      type="time"
                      id="incidentTime"
                      value={formData.incidentTime}
                      onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.formGroup}>
                    <label htmlFor="issueType" style={styles.labelRequired}>Type of Issue *</label>
                    <select
                      id="issueType"
                      value={formData.issueType}
                      onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                      style={styles.select}
                      required
                    >
                      <option value="">Select issue type</option>
                      <option value="Bus Breakdown">Bus Breakdown</option>
                      <option value="Late Arrival">Late Arrival</option>
                      <option value="Route Change">Route Change</option>
                      <option value="Overcrowding">Overcrowding</option>
                      <option value="Driver Behavior">Driver Behavior</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label htmlFor="severity" style={styles.labelRequired}>Severity *</label>
                    <select
                      id="severity"
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      style={styles.select}
                      required
                    >
                      <option value="">Select severity</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Issue Description */}
                <div style={styles.formGroup}>
                  <label htmlFor="description" style={styles.labelRequired}>Description *</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Additional Notes */}
                <div style={styles.formGroup}>
                  <label htmlFor="additionalNotes">Additional Notes</label>
                  <textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    style={styles.textarea}
                  />
                </div>

                {/* Submit Button */}
                <div style={{ marginTop: '2rem' }}>
                  <button type="submit" style={styles.button} disabled={isSubmitting}>
                    {isSubmitting ? <span style={styles.spinner}></span> : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User Reports / History View */}
          {currentView === 'history' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Your Reports</h2>
              {isLoadingHistory ? (
                <p>Loading reports...</p>
              ) : errorMessage ? (
                <p style={{ color: '#b91c1c' }}>{errorMessage}</p>
              ) : userReports.length === 0 ? (
                <p>No reports found.</p>
              ) : (
                <div style={styles.reportsGrid}>
                  {userReports.map((report) => (
                    <div
                      key={report.id}
                      style={styles.reportCard}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div style={styles.reportHeader}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                            {report.issueType}
                          </h4>
                          <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>
                            {report.busRoute}
                          </p>
                        </div>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(report.status)
                          }}
                        >
                          {report.status}
                        </span>
                      </div>
                      <div style={styles.reportMeta}>
                        <div style={styles.metaItem}>
                          <Calendar size={14} />
                          <span>{formatDate(report.timestamp)}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <AlertCircle size={14} />
                          <span>{report.severity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Report Details Modal */}
          {selectedReport && (
            <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
          )}
        </div>
      )}
    </div>
  );
};

export default TransportForm;
