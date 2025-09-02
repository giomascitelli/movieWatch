import { useState, useEffect } from 'react';
import { User, Settings, Shield, X, Trash2, LogOut, Lock } from 'lucide-react';
import { User as UserType } from '../types';
import { supabase } from '../lib/supabase';

interface AccountSettingsProps {
  user: UserType;
  onClose: () => void;
  onLogout: () => void;
  onRefreshUser: () => Promise<void>;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
}

type Tab = 'general' | 'customization' | 'actions';

export function AccountSettings({ user, onClose, onLogout, onRefreshUser, onChangePassword }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [username, setUsername] = useState(user.username);
  const [aboutMe, setAboutMe] = useState('');
  const [originalAboutMe, setOriginalAboutMe] = useState('');
  const [tryHardMode, setTryHardMode] = useState(user.try_hard_mode || false);
  const [originalTryHardMode, setOriginalTryHardMode] = useState(user.try_hard_mode || false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('about_me, try_hard_mode')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          const about = data.about_me || '';
          setAboutMe(about);
          setOriginalAboutMe(about);
          
          const tryHard = data.try_hard_mode || false;
          setTryHardMode(tryHard);
          setOriginalTryHardMode(tryHard);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [user.id]);

  const formatJoinedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      if (username !== user.username) {
        const { error: usernameError } = await supabase
          .from('users')
          .update({ username })
          .eq('id', user.id);

        if (usernameError) throw usernameError;
      }

      if (aboutMe !== originalAboutMe) {
        const { error: aboutError } = await supabase
          .from('users')
          .update({ about_me: aboutMe })
          .eq('id', user.id);

        if (aboutError) throw aboutError;
        setOriginalAboutMe(aboutMe);
      }

      if (tryHardMode !== originalTryHardMode) {
        const { error: tryHardError } = await supabase
          .from('users')
          .update({ try_hard_mode: tryHardMode })
          .eq('id', user.id);

        if (tryHardError) throw tryHardError;
        setOriginalTryHardMode(tryHardMode);
      }

      await onRefreshUser();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Are you sure you want to delete your account? This action cannot be undone.\n\nType "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    const finalConfirmation = confirm(
      'This will permanently delete your account and all your data. Are you absolutely sure?'
    );

    if (!finalConfirmation) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('delete_user_completely');

      if (error) throw error;

      alert('Account deleted successfully!');
      onLogout();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!onChangePassword) {
      alert('Password change functionality is not available');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await onChangePassword(passwordData.currentPassword, passwordData.newPassword);
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    const confirmation = confirm(
      'This will sign you out of all devices. You will need to log in again. Continue?'
    );

    if (!confirmation) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.admin.signOut(user.id, 'global');
      
      if (error) {
        await supabase.auth.signOut();
      }
      
      onLogout();
    } catch (error) {
      console.error('Error signing out all devices:', error);
      await supabase.auth.signOut();
      onLogout();
    }
  };

  const tabs = [
    { id: 'general' as Tab, label: 'General Settings', icon: User },
    { id: 'customization' as Tab, label: 'Customization', icon: Settings },
    { id: 'actions' as Tab, label: 'Account Actions', icon: Shield },
  ];

  const hasUnsavedChanges = username !== user.username || aboutMe !== originalAboutMe || tryHardMode !== originalTryHardMode;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          <div className="w-16 sm:w-64 bg-slate-900/50 border-r border-slate-700 p-2 sm:p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-center sm:justify-start space-x-0 sm:space-x-3 px-2 sm:px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                    title={tab.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">General Settings</h3>
                  <p className="text-slate-400 mb-6">Manage your basic account information</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your username"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed at this time</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      About Me
                    </label>
                    <textarea
                      value={aboutMe}
                      onChange={(e) => setAboutMe(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {aboutMe.length}/200 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={formatJoinedDate(user.created_at)}
                      readOnly
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Try-hard Mode
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                          Movies must be watched for their full runtime before you can rate them and earn points
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTryHardMode(!tryHardMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                          tryHardMode ? 'bg-purple-600' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tryHardMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {hasUnsavedChanges && (
                  <div className="flex justify-end pt-4 border-t border-slate-700">
                    <button
                      onClick={handleSaveGeneral}
                      disabled={saving}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'customization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Customization</h3>
                  <p className="text-slate-400 mb-6">Personalize your MovieWatch experience</p>
                </div>

                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Customization options coming soon!</p>
                  <p className="text-sm text-slate-500 mt-2">
                    We're working on exciting customization features for you.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Account Actions</h3>
                  <p className="text-slate-400 mb-6">Manage your account and security</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium mb-1">Change Password</h4>
                        <p className="text-sm text-slate-400">
                          Update your account password. You'll need to enter your current password.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        disabled={loading}
                        className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                        title="Change Password"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {showChangePassword && (
                      <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                          {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                            <p className="text-red-400 text-xs mt-1">Password must be at least 6 characters long</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                          {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                            <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                          )}
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={handleChangePassword}
                            disabled={loading || !passwordData.currentPassword || passwordData.newPassword.length < 6 || passwordData.newPassword !== passwordData.confirmPassword}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Changing...' : 'Change Password'}
                          </button>
                          <button
                            onClick={() => {
                              setShowChangePassword(false);
                              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium mb-1">Sign Out All Devices</h4>
                        <p className="text-sm text-slate-400">
                          This will sign you out of MovieWatch on all devices. You'll need to log in again.
                        </p>
                      </div>
                      <button
                        onClick={handleSignOutAllDevices}
                        disabled={loading}
                        className="flex items-center justify-center px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                        title="Sign Out All Devices"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-900/20 rounded-lg p-4 border border-red-800/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium mb-1">Delete Account</h4>
                        <p className="text-sm text-slate-400">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
