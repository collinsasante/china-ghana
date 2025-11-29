import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PasswordResetModal from './PasswordResetModal';
import { updateUserPassword } from '../../services/airtable';

interface FirstLoginCheckProps {
  children: React.ReactNode;
}

export default function FirstLoginCheck({ children }: FirstLoginCheckProps) {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  useEffect(() => {
    // Only apply first login check to customer accounts (not team members or admins)
    // This is for accounts created by Ghana team through the "Create Customer" button
    if (user && user.isFirstLogin && user.role === 'customer') {
      setShowPasswordModal(true);
    }
  }, [user]);

  const handlePasswordReset = async (newPassword: string) => {
    if (!user) return;

    try {
      await updateUserPassword(user.id, newPassword);

      // Update local storage with updated user
      const updatedUser = { ...user, isFirstLogin: false };
      localStorage.setItem('afreq_user', JSON.stringify(updatedUser));

      setShowPasswordModal(false);

      // Show success notification
      setShowSuccessNotification(true);

      // Reload after showing notification
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  };

  return (
    <>
      {children}
      <PasswordResetModal
        isOpen={showPasswordModal}
        userName={user?.name || 'User'}
        onSubmit={handlePasswordReset}
      />

      {/* Success Notification */}
      {showSuccessNotification && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999, marginTop: '70px' }}
        >
          <div className="toast show align-items-center text-white bg-success border-0" role="alert">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center">
                <i className="bi bi-check-circle-fill fs-3 me-3"></i>
                <div>
                  <strong>Password Updated Successfully!</strong>
                  <div className="small">You can now use your new password to log in.</div>
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setShowSuccessNotification(false)}
              ></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
