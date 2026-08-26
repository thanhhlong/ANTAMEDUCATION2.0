import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, PermissionKey, UserRole } from '../types';
import { authService, getFriendlyAuthErrorMessage, DEFAULT_ORG_ID, FirebaseProfile } from '../services/auth/authService';
import { ROLE_PERMISSION_CONFIGS, INITIAL_AUTH_USERS } from '../data/initialData';
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('antam_demo_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to real Firebase Auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // Keep local demo user active if we have one
        setCurrentUser((prev) => {
          if (prev && (prev.id.startsWith('usr-') || !prev.id.match(/^[a-zA-Z0-9]{28}$/))) {
            return prev;
          }
          return null;
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync session changes with localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('antam_demo_currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('antam_demo_currentUser');
      }
    } catch (e) {
      console.error('Failed to sync user session to storage:', e);
    }
  }, [currentUser]);

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
      
      // Smart Fallback for auth/operation-not-allowed or local testing fallback
      if (err?.code === 'auth/operation-not-allowed') {
        let matched = INITIAL_AUTH_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === email.toLowerCase()
        );
        
        // Dynamic demo resolution for other roles/students if needed
        if (!matched) {
          const isParent = email.includes('.parent@');
          const isStudent = email.includes('@antam.edu.vn') && !email.startsWith('admin') && !email.startsWith('gv.') && !email.startsWith('daotao') && !email.startsWith('ketoan');
          
          if (isParent || isStudent) {
            matched = {
              id: isParent ? `usr-parent-${Date.now()}` : `usr-student-${Date.now()}`,
              username: email.split('@')[0],
              email: email,
              fullName: isParent ? 'Phụ Huynh Demo' : 'Học Sinh Demo',
              role: isParent ? 'PARENT' : 'STUDENT',
              title: isParent ? 'Phụ Huynh Học Sinh (Demo)' : 'Học Sinh (Demo)',
              password: '123',
              isActive: true,
              createdAt: new Date().toISOString().split('T')[0]
            };
          }
        }

        if (matched) {
          const matchedPassword = matched.password || '123';
          if (password === matchedPassword || password === '123' || password === '123456') {
            const fallbackUser: AuthUser = {
              ...matched,
              lastLogin: new Date().toLocaleString('vi-VN')
            };
            setCurrentUser(fallbackUser);
            
            await logAuditEvent({
              action: 'AUTH',
              entity: 'users',
              entityId: matched.id,
              description: `[FALLBACK] Đăng nhập chế độ DEMO Ngoại tuyến thành công tài khoản: ${matched.email}`,
              actorId: matched.id,
              actorName: matched.fullName,
              actorRole: matched.role,
              severity: 'warning',
              details: { email: matched.email, mode: 'demo_fallback' }
            });

            return { 
              success: true, 
              message: 'Đã tự động kích hoạt chế độ dùng thử Ngoại tuyến thành công! (Tính năng Đăng nhập Email/Mật khẩu chưa được bật trên Firebase Console của bạn).' 
            };
          } else {
            return { success: false, message: 'Mật khẩu mẫu không chính xác. Mật khẩu mẫu là 123 hoặc 123456.' };
          }
        }
      }

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
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Firebase logout warning in offline fallback:', e);
    }
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

      // Fallback for demo registration when provider is disabled
      if (err?.code === 'auth/operation-not-allowed' && profile) {
        const fakeUser: AuthUser = {
          id: `usr-reg-${Date.now()}`,
          username: email.split('@')[0],
          email: email,
          fullName: profile.fullName,
          phone: profile.phone || '',
          role: profile.role,
          avatarUrl: profile.avatarUrl || '',
          title: profile.title || 'Thành viên',
          department: profile.department || '',
          grade: profile.grade,
          studentCode: profile.studentCode || '',
          assignedClasses: profile.assignedClasses || [],
          teachingSubjects: profile.teachingSubjects || [],
          isActive: profile.isActive !== false,
          customPermissions: [],
          createdAt: new Date().toISOString()
        };
        setCurrentUser(fakeUser);
        
        await logAuditEvent({
          action: 'CREATE',
          entity: 'users',
          entityId: fakeUser.id,
          description: `[FALLBACK] Đăng ký tài khoản DEMO Ngoại tuyến thành công: ${fakeUser.email}`,
          actorId: fakeUser.id,
          actorName: fakeUser.fullName,
          actorRole: fakeUser.role,
          severity: 'info',
          details: { email: fakeUser.email, role: fakeUser.role }
        });

        return { success: true };
      }

      return { success: false, message: msg };
    }
  };

  /**
   * Profile update wrapper
   */
  const updateProfile = async (updates: Partial<AuthUser>): Promise<void> => {
    if (!currentUser) throw new Error('Không có người dùng hiện hành.');

    // Only update Firestore if it's not a local fallback user session
    if (!currentUser.id.startsWith('usr-')) {
      try {
        await authService.updateUserProfile(currentUser.id, updates);
      } catch (e) {
        console.warn('Firebase profile update skipped or failed in fallback mode:', e);
      }
    }

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
      if (currentUser && currentUser.id.startsWith('usr-')) {
        // Fallback demo user password change
        if (oldPass !== '123' && oldPass !== '123456') {
          return { success: false, message: 'Mật khẩu cũ không chính xác.' };
        }
        if (!newPass || newPass.length < 3) {
          return { success: false, message: 'Mật khẩu mới phải có ít nhất 3 ký tự.' };
        }
        const updated = { ...currentUser, password: newPass };
        setCurrentUser(updated);
        return { success: true, message: 'Đổi mật khẩu demo thành công!' };
      }

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
