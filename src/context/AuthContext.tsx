import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, PermissionKey, UserRole } from '../types';
import { authService, getFriendlyAuthErrorMessage, DEFAULT_ORG_ID, FirebaseProfile } from '../services/auth/authService';
import { ROLE_PERMISSION_CONFIGS } from '../data/initialData';
import { logAuditEvent } from '../services/auditService';

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasPermission: (permission: PermissionKey) => boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password?: string, profile?: FirebaseProfile) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to real Firebase Auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Helper to check dynamic RBAC permissions
   */
  const hasPermission = (permission: PermissionKey): boolean => {
    if (!currentUser) return false;
    
    // Super admin always has all permissions
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // Check custom permissions first if assigned
    if (currentUser.customPermissions && currentUser.customPermissions.includes(permission)) {
      return true;
    }

    // Otherwise lookup default role configuration
    const config = ROLE_PERMISSION_CONFIGS.find((c) => c.role === currentUser.role);
    if (!config) return false;

    return config.permissions.includes(permission);
  };

  /**
   * Secure sign in wrapper
   */
  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    setError(null);
    try {
      if (!password) {
        throw new Error('Vui lòng nhập mật khẩu.');
      }
      const userProfile = await authService.login(email, password);
      
      // Audit Log log action
      await logAuditEvent({
        action: 'AUTH',
        entity: 'users',
        entityId: userProfile.id,
        description: `Đăng nhập thành công tài khoản: ${userProfile.email} (${userProfile.fullName})`,
        actorId: userProfile.id,
        actorName: userProfile.fullName,
        actorRole: userProfile.role,
        severity: 'info',
        details: { email: userProfile.email }
      });

      return { success: true };
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err);
      setError(msg);
      
      // Audit log failed attempt
      await logAuditEvent({
        action: 'AUTH',
        entity: 'users',
        description: `Đăng nhập thất bại tài khoản: ${email}. Lý do: ${err?.message || msg}`,
        actorId: 'system',
        actorName: 'Hệ thống xác thực',
        actorRole: 'STUDENT',
        severity: 'warning',
        details: { email, error: err?.message || msg }
      });

      return { success: false, message: msg };
    }
  };

  /**
   * Secure sign out wrapper
   */
  const logout = async (): Promise<void> => {
    if (currentUser) {
      await logAuditEvent({
        action: 'AUTH',
        entity: 'users',
        entityId: currentUser.id,
        description: `Đăng xuất tài khoản: ${currentUser.email} (${currentUser.fullName})`,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        severity: 'info'
      });
    }
    await authService.logout();
    setCurrentUser(null);
  };

  /**
   * Secure registration / user creation wrapper
   */
  const register = async (
    email: string, 
    password?: string, 
    profile?: FirebaseProfile
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!password) {
        throw new Error('Vui lòng cung cấp mật khẩu.');
      }
      if (!profile) {
        throw new Error('Vui lòng cung cấp thông tin hồ sơ.');
      }

      const newUser = await authService.register(email, password, profile);

      await logAuditEvent({
        action: 'CREATE',
        entity: 'users',
        entityId: newUser.id,
        description: `Đăng ký tài khoản mới thành công: ${newUser.email} với vai trò ${newUser.role}`,
        actorId: currentUser?.id || newUser.id,
        actorName: currentUser?.fullName || newUser.fullName,
        actorRole: currentUser?.role || newUser.role,
        severity: 'info',
        details: { email: newUser.email, role: newUser.role }
      });

      return { success: true };
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err);
      return { success: false, message: msg };
    }
  };

  /**
   * Profile update wrapper
   */
  const updateProfile = async (updates: Partial<AuthUser>): Promise<void> => {
    if (!currentUser) throw new Error('Không có người dùng hiện hành.');
    await authService.updateUserProfile(currentUser.id, updates);
    setCurrentUser((prev) => prev ? { ...prev, ...updates } : null);

    await logAuditEvent({
      action: 'UPDATE',
      entity: 'users',
      entityId: currentUser.id,
      description: `Cập nhật thông tin hồ sơ cá nhân: ${currentUser.email}`,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      severity: 'info',
      details: updates
    });
  };

  /**
   * Password change wrapper
   */
  const changePassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await authService.changePassword(oldPass, newPass);
      
      if (currentUser) {
        await logAuditEvent({
          action: 'AUTH',
          entity: 'users',
          entityId: currentUser.id,
          description: `Đổi mật khẩu thành công tài khoản: ${currentUser.email}`,
          actorId: currentUser.id,
          actorName: currentUser.fullName,
          actorRole: currentUser.role,
          severity: 'info'
        });
      }
      return { success: true };
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err);
      return { success: false, message: msg };
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    hasPermission,
    login,
    logout,
    register,
    updateProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
