import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/airtable';
import { config } from '../../config/env';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Set body class for authentication page
  useEffect(() => {
    document.body.className = 'app-blank';
    return () => {
      document.body.className = 'app-default';
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if Airtable is configured
      if (!config.airtable.apiKey || !config.airtable.baseId) {
        // Demo mode - always succeed
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSuccess(true);
        return;
      }

      // Call actual password reset service
      const result = await requestPasswordReset(email);

      if (!result) {
        setError('No account found with that email address.');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column flex-root" id="kt_app_root">
      <div className="d-flex flex-column flex-center flex-column-fluid"
           style={{
             backgroundImage: 'url(/assets/media/misc/auth-bg.png)',
             backgroundColor: '#1e1e2d',
             backgroundSize: 'cover',
             backgroundPosition: 'center'
           }}>
        <div className="d-flex flex-column flex-center p-10 pb-lg-20">
          {/* Logo and Title */}
          <div className="mb-12 text-center">
            <h1 className="text-white fs-2qx fw-bolder mb-3">
              AFREQ Logistics
            </h1>
            <div className="text-white fs-base">
              Delivery Tracking System - China to Ghana Shipments
            </div>
          </div>

          {/* Forgot Password Form Card */}
          <div className="w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto">
              {!success ? (
                <form className="form w-100" onSubmit={handleSubmit}>
                  <div className="text-center mb-10">
                    <h1 className="text-gray-900 fw-bolder mb-3">Forgot Password?</h1>
                    <div className="text-gray-500 fw-semibold fs-6">
                      Enter your email to reset your password.
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
                      <span className="svg-icon svg-icon-2hx svg-icon-danger me-4">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                      </span>
                      <div className="d-flex flex-column">
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="fv-row mb-8">
                    <input
                      type="email"
                      placeholder="Email"
                      autoComplete="off"
                      className="form-control bg-transparent"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="d-flex flex-wrap justify-content-center pb-lg-0">
                    <button
                      type="submit"
                      className="btn btn-primary me-4"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                          Please wait...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>

                    <Link to="/login" className="btn btn-light">
                      Cancel
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="text-center">
                  <div className="mb-10">
                    <i className="bi bi-check-circle text-success" style={{ fontSize: '5rem' }}></i>
                  </div>
                  <h1 className="text-gray-900 fw-bolder mb-3">Email Sent!</h1>
                  <div className="text-gray-500 fw-semibold fs-6 mb-10">
                    We've sent password reset instructions to <strong>{email}</strong>
                    <br />
                    Please check your inbox and follow the instructions.
                  </div>
                  <Link to="/login" className="btn btn-primary">
                    Back to Login
                  </Link>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="d-flex flex-center flex-wrap px-5 mt-10">
            <div className="d-flex fw-semibold text-white fs-base">
              <span className="px-5">AFREQ Logistics &copy; 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
