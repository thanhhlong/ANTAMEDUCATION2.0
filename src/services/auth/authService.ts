import { 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AuthUser, UserRole } from '../../types';

// Default multi-tenant Organization ID for backward compatibility and future expansion
export const DEFAULT_ORG_ID = 'org-antam-default';

export interface FirebaseProfile {
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  title: string;
  department?: string;
  grade?: number;
  studentCode?: string;
  assignedClasses?: string[];
  teachingSubjects?: string[];
  organizationId?: string;
  isActive?: boolean;
}

/**
 * Maps a Firestore user document + Auth state to the standard AuthUser type
 */
export function mapToAuthUser(uid: string, email: string, docData: any): AuthUser {
  return {
    id: uid,
    username: docData.username || email.split('@')[0],
    email: email,
    phone: docData.phone || '',
    fullName: docData.fullName || docData.displayName || 'Người dùng',
    role: (docData.role as UserRole) || 'STUDENT',
    avatarUrl: docData.avatarUrl || '',
    title: docData.title || '',
    department: docData.department || '',
    grade: docData.grade,
    studentCode: docData.studentCode || '',
    assignedClasses: docData.assignedClasses || [],
    teachingSubjects: docData.teachingSubjects || [],
    isActive: docData.isActive !== false,
    customPermissions: docData.customPermissions || [],
    lastLogin: docData.lastLogin || new Date().toISOString(),
    createdAt: docData.createdAt || new Date().toISOString()
  };
}

/**
 * Handle Firebase Authentication errors and convert to friendly Vietnamese messages
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Địa chỉ email không hợp lệ.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị vô hiệu hóa.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/email-already-in-use':
      return 'Địa chỉ email này đã được sử dụng bởi tài khoản khác.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu (tối thiểu phải có 6 ký tự).';
    case 'auth/requires-recent-login':
      return 'Hành động này yêu cầu bạn phải đăng nhập lại gần đây.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.';
    default:
      return error?.message || 'Đã xảy ra lỗi trong quá trình xác thực.';
  }
}

/**
 * Authentication service using real Firebase Auth and Firestore Profiles
 */
export const authService = {
  /**
   * Listen to Firebase Auth state changes and load the profile from Firestore
   */
  onAuthStateChanged: (callback: (user: AuthUser | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      try {
        const profile = await authService.getUserProfile(firebaseUser.uid);
        if (profile) {
          callback(profile);
        } else {
          // If auth exists but Firestore profile doesn't, create a placeholder profile
          const placeholder: AuthUser = {
            id: firebaseUser.uid,
            username: firebaseUser.email?.split('@')[0] || 'user',
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || 'Người dùng mới',
            role: 'STUDENT',
            title: 'Học sinh',
            isActive: true,
            createdAt: new Date().toISOString()
          };
          await authService.saveUserProfile(firebaseUser.uid, placeholder);
          callback(placeholder);
        }
      } catch (e) {
        console.error('Error fetching user profile during auth state change:', e);
        callback(null);
      }
    });
  },

  /**
   * Log in with Email and Password
   */
  login: async (email: string, password: string): Promise<AuthUser> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    // Fetch profile from Firestore
    let profile = await authService.getUserProfile(firebaseUser.uid);
    if (!profile) {
      // Create profile fallback if missing in Firestore
      profile = {
        id: firebaseUser.uid,
        username: email.split('@')[0],
        email: email,
        fullName: 'Thành viên',
        role: 'STUDENT',
        title: 'Học sinh',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      await authService.saveUserProfile(firebaseUser.uid, profile);
    }

    if (!profile.isActive) {
      await signOut(auth);
      throw new Error('Tài khoản của bạn hiện đang bị khóa hoặc chưa kích hoạt.');
    }

    // Update last login timestamp
    const now = new Date().toISOString();
    await authService.updateUserProfile(firebaseUser.uid, { lastLogin: now });
    profile.lastLogin = now;

    return profile;
  },

  /**
   * Log out current user
   */
  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  /**
   * Register a new user in Firebase Auth and create Firestore profile document
   */
  register: async (email: string, password: string, profileData: FirebaseProfile): Promise<AuthUser> => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    const fullProfile: AuthUser = {
      id: firebaseUser.uid,
      username: email.split('@')[0],
      email: email,
      fullName: profileData.fullName,
      phone: profileData.phone || '',
      role: profileData.role,
      avatarUrl: profileData.avatarUrl || '',
      title: profileData.title || 'Thành viên',
      department: profileData.department || '',
      grade: profileData.grade,
      studentCode: profileData.studentCode || '',
      assignedClasses: profileData.assignedClasses || [],
      teachingSubjects: profileData.teachingSubjects || [],
      isActive: profileData.isActive !== false,
      customPermissions: [],
      createdAt: new Date().toISOString()
    };

    // Store profile in Firestore under /users/{uid}
    await authService.saveUserProfile(firebaseUser.uid, {
      ...fullProfile,
      organizationId: profileData.organizationId || DEFAULT_ORG_ID
    } as any);

    return fullProfile;
  },

  /**
   * Get user profile from Firestore
   */
  getUserProfile: async (uid: string): Promise<AuthUser | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return mapToAuthUser(uid, data.email || '', data);
      }
      return null;
    } catch (e) {
      console.error(`Error getting user profile for ${uid}:`, e);
      return null;
    }
  },

  /**
   * Save user profile directly to Firestore
   */
  saveUserProfile: async (uid: string, profile: AuthUser & { organizationId?: string }): Promise<void> => {
    const docRef = doc(db, 'users', uid);
    const dataToSave = {
      ...profile,
      organizationId: profile.organizationId || DEFAULT_ORG_ID,
      updatedAt: new Date().toISOString()
    };
    // Exclude password if present
    delete (dataToSave as any).password;
    await setDoc(docRef, dataToSave, { merge: true });
  },

  /**
   * Update profile fields in Firestore
   */
  updateUserProfile: async (uid: string, updates: Partial<AuthUser>): Promise<void> => {
    const docRef = doc(db, 'users', uid);
    const cleanedUpdates = { ...updates, updatedAt: new Date().toISOString() };
    delete (cleanedUpdates as any).password;
    delete (cleanedUpdates as any).id;
    await updateDoc(docRef, cleanedUpdates);
  },

  /**
   * Change user password in Firebase Auth
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('Không tìm thấy người dùng hiện tại hoặc chưa đăng nhập.');
    }

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(firebaseUser.email, oldPassword);
    await reauthenticateWithCredential(firebaseUser, credential);

    // Update password
    await firebaseUpdatePassword(firebaseUser, newPassword);
  }
};
