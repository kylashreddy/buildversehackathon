import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const AdminLogin = ({ onLoginSuccess, onBackToUser }) => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    if (isAdminLoggedIn) {
      onLoginSuccess();
    }
  }, [onLoginSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError(false);
    setIsLoggingIn(true);

    // Check credentials (default: admin/admin)
    setTimeout(() => {
      if (loginData.username === 'admin' && loginData.password === 'admin') {
        // Set admin login status
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', loginData.username);
        
        // Call success callback
        onLoginSuccess();
      } else {
        // Show error message with shake animation
        setLoginError(true);
        setIsLoggingIn(false);
      }
    }, 1500); // Simulate loading time
  };

  const styles = {
    container: {
      fontFamily: "'Segoe UI', 'Roboto', sans-serif",
      background: '#202124',
      color: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1rem'
    },
    loginContainer: {
      background: '#303134',
      borderRadius: '8px',
      padding: '2rem',
      width: '90%',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      animation: loginError ? 'shake 0.5s' : 'none'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '1.4rem',
      marginBottom: '1.5rem'
    },
    logoSvg: {
      marginRight: '0.5rem',
      fill: '#1a73e8'
    },
    loginTitle: {
      textAlign: 'center',
      marginBottom: '1.5rem',
      fontWeight: '500',
      fontSize: '1.5rem'
    },
    formGroup: {
      marginBottom: '1.2rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500'
    },
    formControl: {
      width: '100%',
      padding: '0.8rem',
      borderRadius: '4px',
      border: '1px solid rgba(255,255,255,0.2)',
      background: '#202124',
      color: '#ffffff',
      fontSize: '1rem',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.3s ease'
    },
    formControlFocus: {
      borderColor: '#1a73e8'
    },
    btn: {
      width: '100%',
      padding: '0.8rem',
      borderRadius: '4px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '1rem',
      marginTop: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    btnPrimary: {
      background: '#1a73e8',
      color: 'white'
    },
    btnPrimaryHover: {
      background: '#0d47a1'
    },
    btnSecondary: {
      background: '#6b7280',
      color: 'white',
      marginTop: '1rem'
    },
    errorMessage: {
      color: '#d93025',
      marginTop: '1rem',
      textAlign: 'center',
      display: loginError ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
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
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .form-control:focus {
            border-color: #1a73e8 !important;
          }
          
          .btn-primary:hover:not(:disabled) {
            background: #0d47a1 !important;
          }
          
          .btn-secondary:hover:not(:disabled) {
            background: #4b5563 !important;
          }
        `}
      </style>
      
      <div style={styles.loginContainer}>
        <div style={styles.logo}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="28" 
            height="28" 
            viewBox="0 0 24 24"
            style={styles.logoSvg}
          >
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          Admin Dashboard
        </div>
        
        <h2 style={styles.loginTitle}>Admin Sign In</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              style={styles.formControl}
              value={loginData.username}
              onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
              required
              disabled={isLoggingIn}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              style={styles.formControl}
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              required
              disabled={isLoggingIn}
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary"
            style={{...styles.btn, ...styles.btnPrimary}}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <div style={styles.spinner}></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
          
          <button
            type="button"
            className="btn-secondary"
            style={{...styles.btn, ...styles.btnSecondary}}
            onClick={onBackToUser}
            disabled={isLoggingIn}
          >
            Back to User Portal
          </button>
          
          <div style={styles.errorMessage}>
            <AlertCircle size={20} />
            Invalid username or password
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
