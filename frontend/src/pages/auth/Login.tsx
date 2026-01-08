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
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column flex-root" id="kt_app_root">
      {/* Authentication - Sign-in */}
      <div className="d-flex flex-column flex-lg-row flex-column-fluid">
        {/* Aside */}
        <div
          className="d-flex flex-lg-row-fluid w-lg-50 bgi-size-cover bgi-position-center"
          style={{ backgroundImage: 'url(/src/assets/media/misc/auth-bg.png)' }}
        >
          {/* Content */}
          <div className="d-flex flex-column flex-center p-6 p-lg-10 w-100">
            {/* Logo */}
            <Link to="/" className="mb-0 mb-lg-20">
              <img
                alt="AFREQ Logistics"
                src="/src/assets/media/logos/default-white.svg"
                className="h-40px h-lg-50px"
              />
            </Link>
            {/* end Logo */}

            {/* Image */}
            <img
              className="d-none d-lg-block mx-auto w-300px w-lg-75 w-xl-500px mb-10 mb-lg-20"
              src="/src/assets/media/misc/auth-screens.png"
              alt=""
            />
            {/* end Image */}

            {/* Title */}
            <h1 className="d-none d-lg-block text-white fs-2qx fw-bold text-center mb-7">
              Fast, Efficient and Productive
            </h1>
            {/* end Title */}

            {/* Text */}
            <div className="d-none d-lg-block text-white fs-base text-center">
              Track your shipments from China to Ghana with ease.
              <br />
              Real-time updates, container management, and delivery tracking
              <br />
              all in one place.
            </div>
            {/* end Text */}
          </div>
          {/* end Content */}
        </div>
        {/* end Aside */}

        {/* Body */}
        <div className="d-flex flex-column flex-lg-row-fluid w-lg-50 p-10">
          {/* Form */}
          <div className="d-flex flex-center flex-column flex-lg-row-fluid">
            {/* Wrapper */}
            <div className="w-lg-500px p-10">
              {/* Form */}
              <form className="form w-100" onSubmit={handleSubmit}>
                {/* Heading */}
                <div className="text-center mb-11">
                  {/* Title */}
                  <h1 className="text-gray-900 fw-bolder mb-3">Sign In</h1>
                  {/* end Title */}

                  {/* Subtitle */}
                  <div className="text-gray-500 fw-semibold fs-6">
                    AFREQ Delivery Tracking System
                  </div>
                  {/* end Subtitle */}
                </div>
                {/* end Heading */}

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-10">
                    <i className="ki-duotone ki-shield-cross fs-2hx text-danger me-4">
                      <span className="path1"></span>
                      <span className="path2"></span>
                      <span className="path3"></span>
                    </i>
                    <div className="d-flex flex-column">
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Login options */}
                <div className="row g-3 mb-9">
                  {/* Google */}
                  <div className="col-md-6">
                    <a
                      href="#"
                      className="btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100"
                      onClick={(e) => e.preventDefault()}
                    >
                      <img
                        alt="Google"
                        src="/src/assets/media/svg/brand-logos/google-icon.svg"
                        className="h-15px me-3"
                      />
                      Sign in with Google
                    </a>
                  </div>
                  {/* end Google */}

                  {/* Apple */}
                  <div className="col-md-6">
                    <a
                      href="#"
                      className="btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100"
                      onClick={(e) => e.preventDefault()}
                    >
                      <img
                        alt="Apple"
                        src="/src/assets/media/svg/brand-logos/apple-black.svg"
                        className="theme-light-show h-15px me-3"
                      />
                      <img
                        alt="Apple"
                        src="/src/assets/media/svg/brand-logos/apple-black-dark.svg"
                        className="theme-dark-show h-15px me-3"
                      />
                      Sign in with Apple
                    </a>
                  </div>
                  {/* end Apple */}
                </div>
                {/* end Login options */}

                {/* Separator */}
                <div className="separator separator-content my-14">
                  <span className="w-125px text-gray-500 fw-semibold fs-7">Or with email</span>
                </div>
                {/* end Separator */}

                {/* Email Input */}
                <div className="fv-row mb-8">
                  <input
                    type="text"
                    placeholder="Email"
                    name="email"
                    autoComplete="off"
                    className="form-control bg-transparent"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {/* end Email Input */}

                {/* Password Input */}
                <div className="fv-row mb-3">
                  <input
                    type="password"
                    placeholder="Password"
                    name="password"
                    autoComplete="off"
                    className="form-control bg-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {/* end Password Input */}

                {/* Forgot Password Link */}
                <div className="d-flex flex-stack flex-wrap gap-3 fs-base fw-semibold mb-8">
                  <div></div>
                  <Link to="/forgot-password" className="link-primary">
                    Forgot Password ?
                  </Link>
                </div>
                {/* end Forgot Password Link */}

                {/* Submit button */}
                <div className="d-grid mb-10">
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <span className="indicator-progress">
                        Please wait...
                        <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                      </span>
                    ) : (
                      <span className="indicator-label">Sign In</span>
                    )}
                  </button>
                </div>
                {/* end Submit button */}

                {/* Sign up */}
                <div className="text-gray-500 text-center fw-semibold fs-6">
                  Not a Member yet?{' '}
                  <Link to="/signup" className="link-primary">
                    Sign up
                  </Link>
                </div>
                {/* end Sign up */}
              </form>
              {/* end Form */}

              {/* Demo Credentials Hint */}
              <div className="notice d-flex bg-light-primary rounded border-primary border border-dashed p-6 mt-10">
                <i className="ki-duotone ki-shield-tick fs-2tx text-primary me-4">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                <div className="d-flex flex-stack flex-grow-1">
                  <div className="fw-semibold">
                    <h4 className="text-gray-900 fw-bold">Demo Accounts</h4>
                    <div className="fs-6 text-gray-700">
                      <strong>Customer:</strong> customer@afreq.com
                      <br />
                      <strong>China Team:</strong> china@afreq.com
                      <br />
                      <strong>Ghana Team:</strong> ghana@afreq.com
                      <br />
                      <strong>Admin:</strong> admin@afreq.com
                      <br />
                      <em className="text-muted">Password: any</em>
                    </div>
                  </div>
                </div>
              </div>
              {/* end Demo Credentials Hint */}
            </div>
            {/* end Wrapper */}
          </div>
          {/* end Form */}

          {/* Footer */}
          <div className="d-flex flex-center flex-wrap px-5">
            <div className="d-flex fw-semibold text-primary fs-base">
              <a href="/terms" className="px-5" target="_blank" rel="noreferrer">
                Terms
              </a>
              <a href="/plans" className="px-5" target="_blank" rel="noreferrer">
                Plans
              </a>
              <a href="/contact" className="px-5" target="_blank" rel="noreferrer">
                Contact Us
              </a>
            </div>
          </div>
          {/* end Footer */}
        </div>
        {/* end Body */}
      </div>
      {/* end Authentication - Sign-in */}
    </div>
  );
}
