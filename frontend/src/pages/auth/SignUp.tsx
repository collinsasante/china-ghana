import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUser } from '../../services/airtable';
import { config } from '../../config/env';
import type { UserRole } from '../../types/index';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    role: 'customer' as UserRole,
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState<{type: 'success'|'error'|'warning'|'info', title: string, message: string} | null>(null);

  const navigate = useNavigate();

  // Set body class for authentication page
  useEffect(() => {
    document.body.className = 'app-blank';
    return () => {
      document.body.className = 'app-default';
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    if (!acceptTerms) {
      setError('You must accept the terms and conditions.');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if Airtable is configured
      if (!config.airtable.apiKey || !config.airtable.baseId) {
        // Demo mode - simulate account creation
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setNotification({type: 'success', title: 'Success!', message: 'Account created successfully! (Demo Mode) You can now login.'});
        setTimeout(() => {
          setNotification(null);
          navigate('/login');
        }, 2000);
        return;
      }

      // Create user in Airtable
      await createUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });

      // Success - redirect to login
      setNotification({type: 'success', title: 'Success!', message: 'Account created successfully! Please login with your credentials.'});
      setTimeout(() => {
        setNotification(null);
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        setError('An account with this email already exists.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (): number => {
    const password = formData.password;
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return Math.min(strength, 4);
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="d-flex flex-column flex-root" id="kt_app_root">
      <div className="d-flex flex-column flex-lg-row flex-column-fluid">
        {/* Left side - Image */}
        <div
          className="d-flex flex-lg-row-fluid w-lg-50 bgi-size-cover bgi-position-center order-1 order-lg-1"
          style={{
            backgroundImage: 'url(/assets/media/misc/auth-bg.png)',
            backgroundColor: '#1e1e2d'
          }}
        >
          <div className="d-flex flex-column flex-center py-15 px-5 px-md-15 w-100">
            <h1 className="text-white fs-2qx fw-bolder text-center mb-7">
              AFREQ Logistics
            </h1>
            <div className="text-white fs-base text-center">
              Delivery Tracking System
              <br />
              China to Ghana Shipments
            </div>
          </div>
        </div>

        {/* Right side - Sign Up Form */}
        <div className="d-flex flex-column flex-lg-row-fluid w-lg-50 p-10 order-2 order-lg-2">
          <div className="d-flex flex-center flex-column flex-lg-row-fluid">
            <div className="w-lg-500px p-10">
              <form className="form w-100" onSubmit={handleSubmit}>
                <div className="text-center mb-11">
                  <h1 className="text-gray-900 fw-bolder mb-3">Sign Up</h1>
                  <div className="text-gray-500 fw-semibold fs-6">
                    Create your AFREQ account
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

                {/* Full Name */}
                <div className="fv-row mb-8">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    autoComplete="name"
                    className="form-control bg-transparent"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="fv-row mb-8">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    autoComplete="email"
                    className="form-control bg-transparent"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone (Optional) */}
                <div className="fv-row mb-8">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number (Optional)"
                    autoComplete="tel"
                    className="form-control bg-transparent"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Address (Optional) */}
                <div className="fv-row mb-8">
                  <input
                    type="text"
                    name="address"
                    placeholder="Address (Optional)"
                    autoComplete="street-address"
                    className="form-control bg-transparent"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                {/* Account Type */}
                <div className="fv-row mb-8">
                  <select
                    name="role"
                    className="form-select bg-transparent"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="customer">Customer</option>
                    <option value="china_team">China Team</option>
                    <option value="ghana_team">Ghana Team</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <div className="form-text">Select your account type</div>
                </div>

                {/* Password with strength meter */}
                <div className="fv-row mb-8">
                  <div className="mb-1">
                    <div className="position-relative mb-3">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        className="form-control bg-transparent"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-icon position-absolute translate-middle top-50 end-0 me-n2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} fs-2`}></i>
                      </button>
                    </div>

                    {/* Password strength meter */}
                    {formData.password && (
                      <div className="d-flex align-items-center mb-3">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`flex-grow-1 rounded h-5px ${level <= passwordStrength ? 'bg-success' : 'bg-secondary'} ${level < 4 ? 'me-2' : ''}`}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-muted">
                    Use 8 or more characters with a mix of letters, numbers & symbols.
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="fv-row mb-8">
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      className="form-control bg-transparent"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-icon position-absolute translate-middle top-50 end-0 me-n2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i
                        className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} fs-2`}
                      ></i>
                    </button>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="fv-row mb-8">
                  <label className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                    />
                    <span className="form-check-label fw-semibold text-gray-700 fs-base ms-1">
                      I Accept the{' '}
                      <a href="#" className="ms-1 link-primary">
                        Terms & Conditions
                      </a>
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="d-grid mb-10">
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                        Please wait...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </button>
                </div>

                {/* Sign in link */}
                <div className="text-gray-500 text-center fw-semibold fs-6">
                  Already have an Account?{' '}
                  <Link to="/login" className="link-primary fw-semibold">
                    Sign In
                  </Link>
                </div>
              </form>
            </div>
          </div>

          <div className="d-flex flex-center flex-wrap px-5">
            <div className="d-flex fw-semibold text-primary fs-base">
              <span className="px-5">AFREQ Logistics &copy; 2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999, marginTop: '70px' }}>
          <div className={`toast show align-items-center text-white bg-${notification.type} border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <strong>{notification.title}</strong>
                <div className="small">{notification.message}</div>
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setNotification(null)}></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
