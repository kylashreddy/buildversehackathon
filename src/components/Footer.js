import React from 'react';

export default function Footer() {
  return (
    <>
      {/* Divider Line */}
      <div style={{ borderTop: '3px solid #c0e0ec', margin: '0' }}></div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#d0ebf5', color: '#000' }} className="pt-5 pb-3">
        <div className="container">
          <div className="row text-center text-md-start">
            <div className="col-md-4 mb-3">
              <h5>Campus Report Portal</h5>
              <p className="small">
                A platform to report and track campus issues, lost items, and transportation problems.
              </p>
            </div>
            <div className="col-md-4 mb-3">
              <h5>Quick Links</h5>
              <ul className="list-unstyled small">
                <li><a href="/" className="text-dark text-decoration-none">Home</a></li>
                <li><a href="/submit" className="text-dark text-decoration-none">Submit Report</a></li>
                <li><a href="/reports" className="text-dark text-decoration-none">My Reports</a></li>
                <li><a href="/faq" className="text-dark text-decoration-none">FAQ</a></li>
              </ul>
            </div>
            <div className="col-md-4 mb-3">
              <h5>Contact</h5>
              <p className="small mb-1">Email: support@campus-report.edu</p>
              <p className="small mb-1">Phone: (123) 456-7890</p>
              <p className="small">Campus Center, Room 200</p>
            </div>
          </div>
          <hr className="border-dark" />
          <p className="text-center small mb-0">© 2025 Campus Report Portal. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
