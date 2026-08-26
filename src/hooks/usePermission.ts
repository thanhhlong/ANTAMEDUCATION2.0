import { useAuth } from './useAuth';
import { PermissionKey, UserRole } from '../types';

/**
 * Custom hook for fine-grained dynamic Role-Based Access Control (RBAC)
 */
export function usePermission() {
  const { currentUser, hasPermission } = useAuth();

  /**
   * Check if user has permission to perform an action
   */
  const can = (permission: PermissionKey): boolean => {
    return hasPermission(permission);
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  /**
   * Assert if user has a permission, otherwise throw an error (or return false)
   */
  const assert = (permission: PermissionKey): void => {
    if (!can(permission)) {
      throw new Error(`Bạn không có quyền truy cập tính năng này: ${permission}`);
    }
  };

  return {
    currentUser,
    can,
    hasRole,
    assert,
    role: currentUser?.role || null,
  };
}
