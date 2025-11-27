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

  useEffect(() => {
    // Check if user needs to reset password on first login
    if (user && user.isFirstLogin) {
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

      // Show success message
      alert('✅ Password updated successfully! You can now use your new password to log in.');

      // Optionally reload to apply changes
      window.location.reload();
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
    </>
  );
}
