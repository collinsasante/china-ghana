import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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
      const user = await login(email, password);

      // Redirect based on user role
      switch (user.role) {
        case 'customer':
          navigate('/status');
          break;
        case 'china_team':
          navigate('/china/receiving');
          break;
        case 'ghana_team':
          navigate('/ghana/sorting');
          break;
        case 'admin':
          navigate('/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
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

          {/* Login Form Card */}
          <div className="w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto">
              <form className="form w-100" onSubmit={handleSubmit}>
                <div className="text-center mb-11">
                  <h1 className="text-gray-900 fw-bolder mb-3">Sign In</h1>
                  <div className="text-gray-500 fw-semibold fs-6">
                    Access your account
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

                <div className="fv-row mb-3">
                  <input
                    type="password"
                    placeholder="Password"
                    autoComplete="off"
                    className="form-control bg-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex flex-stack flex-wrap gap-3 fs-base fw-semibold mb-8">
                  <div></div>
                  <Link to="/forgot-password" className="link-primary">
                    Forgot Password?
                  </Link>
                </div>

                <div className="d-grid mb-10">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                        Please wait...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>

                <div className="text-gray-500 text-center fw-semibold fs-6 mb-8">
                  Don't have an account?{' '}
                  <Link to="/signup" className="link-primary fw-semibold">
                    Sign Up
                  </Link>
                </div>

                <div className="separator separator-content my-8">
                  <span className="w-125px text-gray-500 fw-semibold fs-7">Demo Accounts</span>
                </div>

                <div className="text-gray-500 text-center fw-semibold fs-7">
                  <span className="text-primary">customer@afreq.com</span> (Customer)
                  <br />
                  <span className="text-primary">china@afreq.com</span> (China Team)
                  <br />
                  <span className="text-primary">ghana@afreq.com</span> (Ghana Team)
                  <br />
                  <span className="text-primary">admin@afreq.com</span> (Admin)
                </div>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
}
