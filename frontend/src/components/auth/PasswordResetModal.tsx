import { useState } from 'react';
import type { FormEvent } from 'react';

interface PasswordResetModalProps {
  isOpen: boolean;
  userName: string;
  isFirstLogin?: boolean;
  onSubmit: (newPassword: string) => Promise<void>;
  onToggleFirstLogin?: (value: boolean) => Promise<void>;
}

export default function PasswordResetModal({ isOpen, userName, isFirstLogin = false, onSubmit, onToggleFirstLogin }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [localIsFirstLogin, setLocalIsFirstLogin] = useState(isFirstLogin);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(newPassword);
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary">
            <h3 className="modal-title text-white">
              <i className="bi bi-shield-lock me-2"></i>
              Change Your Password
            </h3>
          </div>

          <div className="modal-body">
            <div className="alert alert-info d-flex align-items-center mb-5">
              <i className="bi bi-info-circle fs-2x me-3"></i>
              <div>
                <h5 className="mb-1">Welcome, {userName}!</h5>
                <p className="mb-0">
                  This is your first login. For security reasons, please set a new password.
                </p>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="form-label required fw-bold">New Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
                <div className="form-text">Must be at least 6 characters long</div>
              </div>

              <div className="mb-5">
                <label className="form-label required fw-bold">Confirm Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Admin/Debug: Airtable isFirstLogin checkbox */}
              <div className="mb-7">
                <div className="form-check form-check-custom form-check-solid">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isFirstLoginCheckbox"
                    checked={localIsFirstLogin}
                    onChange={async (e) => {
                      const newValue = e.target.checked;
                      setLocalIsFirstLogin(newValue);
                      if (onToggleFirstLogin) {
                        try {
                          await onToggleFirstLogin(newValue);
                        } catch (err) {
                          console.error('Failed to toggle isFirstLogin:', err);
                          // Revert on error
                          setLocalIsFirstLogin(!newValue);
                        }
                      }
                    }}
                  />
                  <label className="form-check-label fw-bold" htmlFor="isFirstLoginCheckbox">
                    First Login (Airtable Field)
                  </label>
                </div>
                <div className="form-text">
                  This checkbox is synced with the Airtable <code>isFirstLogin</code> field.
                  Check this to require password reset on next login.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Set New Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
