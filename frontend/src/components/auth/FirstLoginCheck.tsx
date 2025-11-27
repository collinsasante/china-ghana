import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PasswordResetModal from './PasswordResetModal';
import { updateUserPassword, toggleUserFirstLogin } from '../../services/airtable';

interface FirstLoginCheckProps {
  children: React.ReactNode;
}

export default function FirstLoginCheck({ children }: FirstLoginCheckProps) {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    // Check if user needs to reset password on first login
    console.log('🔍 FirstLoginCheck - User data:', user);
    console.log('🔍 FirstLoginCheck - isFirstLogin value:', user?.isFirstLogin);
    console.log('🔍 FirstLoginCheck - Full user object:', JSON.stringify(user, null, 2));

    if (user && user.isFirstLogin) {
      console.log('✅ FirstLoginCheck - Showing password reset modal');
      console.log('✅ Modal should be visible now!');
      setShowPasswordModal(true);
      // Visual confirmation
      setTimeout(() => {
        alert('DEBUG: Password reset modal should be showing! If you cannot see it, check the console.');
      }, 500);
    } else if (user) {
      console.log('❌ FirstLoginCheck - isFirstLogin is false or undefined, NOT showing modal');
      console.log('❌ isFirstLogin value:', user.isFirstLogin);
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

  const handleToggleFirstLogin = async (value: boolean) => {
    if (!user) return;

    try {
      await toggleUserFirstLogin(user.id, value);

      // Update local storage with updated user
      const updatedUser = { ...user, isFirstLogin: value };
      localStorage.setItem('afreq_user', JSON.stringify(updatedUser));

      console.log('✅ isFirstLogin toggled to:', value);
    } catch (error) {
      console.error('Failed to toggle isFirstLogin:', error);
      throw error;
    }
  };

  return (
    <>
      {children}
      <PasswordResetModal
        isOpen={showPasswordModal}
        userName={user?.name || 'User'}
        isFirstLogin={user?.isFirstLogin || false}
        onSubmit={handlePasswordReset}
        onToggleFirstLogin={handleToggleFirstLogin}
      />
    </>
  );
}
