import React from 'react';

export default function Working() {
  const steps = [
    {
      title: "Submit Report",
      text: "Complete the online form with details about your issue. Provide clear descriptions and upload relevant images if available. Submissions help ensure quick resolution.",
    },
    {
      title: "Get Confirmation",
      text: "Receive a notification with your report tracking number. This confirmation allows you to monitor your issue and serves as proof of your submission.",
    },
    {
      title: "Track Progress",
      text: "Monitor the status of your report in real-time. You can view updates from the admin and receive alerts when your report is being worked on.",
    },
    {
      title: "Issue Resolved",
      text: "Receive notification once your issue has been addressed. You may be asked for feedback to ensure the resolution meets your expectations.",
    },
  ];

  return (
    <section
      className="py-5 text-black"
      style={{ backgroundColor: 'rgba(173, 216, 230, 0.3)' }}
    >
      <div className="container text-center">
        <h2 className="mb-5 fw-bold">How It Works</h2>
        <div className="row g-4">
          {steps.map((step, idx) => (
            <div className="col-md-3 col-sm-6" key={idx}>
              <div
                className="p-4 border rounded-4 h-100 shadow-sm bg-white"
                style={{ minHeight: '320px' }}
              >
                <div
                  className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <span className="h4 text-white">{idx + 1}</span>
                </div>
                <h5 className="fw-semibold">{step.title}</h5>
                <p className="small mt-2">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
