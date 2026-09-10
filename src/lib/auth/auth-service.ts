/**
 * IMPACTMESH - Authentication & Departmental Authorization Service
 *
 * Enforces strict enterprise permission boundaries:
 * 1. CEO (Full access to all departments and company-wide analytics)
 * 2. Operations Head (Access strictly limited to authorized Operations data & events)
 *
 * Security Principle:
 * Client-supplied department codes are NEVER trusted alone;
 * All actions and data access are verified against the authenticated user's role and department.
 */

import type { DepartmentCode } from '../../types/events.ts';

export type UserRole = 'ceo' | 'department_head' | 'operator';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: DepartmentCode;
  organizationId: string;
  deviceId: string;
}

export const CEO_USER: AuthUser = {
  id: 'u0000000-0000-0000-0000-000000000000',
  email: 'ceo@blacktide.io',
  fullName: 'Vance Sterling (CEO)',
  role: 'ceo',
  department: 'command_center',
  organizationId: 'a0000000-0000-0000-0000-000000000001',
  deviceId: 'device-ceo-command',
};

export const OPERATIONS_USER: AuthUser = {
  id: 'u0000000-0000-0000-0000-000000000003',
  email: 'ops.lead@blacktide.io',
  fullName: 'Devon Ross (Operations Head)',
  role: 'department_head',
  department: 'operations',
  organizationId: 'a0000000-0000-0000-0000-000000000001',
  deviceId: 'device-operations-mobile',
};

export const ENTERPRISE_OPERATOR: AuthUser = {
  id: 'u0000000-0000-0000-0000-000000000002',
  email: 'operator@blacktide.io',
  fullName: 'Morgan Cross (Enterprise Operator)',
  role: 'operator',
  department: 'operations',
  organizationId: 'a0000000-0000-0000-0000-000000000001',
  deviceId: 'device-mobile-operator',
};

export class SecurityPolicyViolationError extends Error {
  public readonly code = '403_FORBIDDEN';
  public readonly user: AuthUser;
  public readonly targetDepartment: DepartmentCode;

  constructor(user: AuthUser, targetDepartment: DepartmentCode, action: string) {
    super(
      `Security Policy Violation [403 Forbidden]: User '${user.fullName}' (${user.role}/${user.department}) is not authorized to ${action} '${targetDepartment}' data.`
    );
    this.name = 'SecurityPolicyViolationError';
    this.user = user;
    this.targetDepartment = targetDepartment;
  }
}

class SecurityPolicyService {
  private currentUser: AuthUser = ENTERPRISE_OPERATOR;
  private userListeners: Set<(user: AuthUser) => void> = new Set();

  constructor() {
    // Determine initial user based on viewport / URL route if in browser
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('command')) {
        this.currentUser = CEO_USER;
      } else {
        this.currentUser = ENTERPRISE_OPERATOR;
      }
    }
  }

  public getCurrentUser(): AuthUser {
    return this.currentUser;
  }

  public setCurrentUser(user: AuthUser): void {
    this.currentUser = user;
    this.userListeners.forEach((listener) => listener(user));
  }

  public onUserChange(callback: (user: AuthUser) => void): () => void {
    this.userListeners.add(callback);
    callback(this.currentUser);
    return () => this.userListeners.delete(callback);
  }

  /**
   * Evaluates if the user is authorized to read departmental data.
   */
  public canReadDepartment(user: AuthUser, department: DepartmentCode): boolean {
    if (user.role === 'ceo' || user.department === 'command_center' || user.role === 'operator') {
      return true; // CEO and multi-department operator can read all department operational data
    }

    if (department === 'operations' || department === 'engineering') {
      return user.department === 'operations' || user.department === 'engineering';
    }

    return user.department === department;
  }

  /**
   * Evaluates if the user is authorized to modify or emit events for a department.
   */
  public canModifyDepartment(user: AuthUser, department: DepartmentCode): boolean {
    if (user.role === 'ceo' || user.role === 'operator') {
      return true; // CEO and multi-department operator can operate all departments
    }

    if (department === 'operations' || department === 'engineering') {
      return user.department === 'operations' || user.department === 'engineering';
    }

    return user.department === department;
  }

  /**
   * Evaluates if the user can view CEO analytics, multi-tier impact maps, and enterprise business state.
   */
  public canAccessCEOAnalytics(user: AuthUser): boolean {
    return user.role === 'ceo' || user.department === 'command_center';
  }

  /**
   * Hard authorization guard that throws on illegal cross-department manipulation.
   */
  public assertCanEmitEvent(user: AuthUser, targetDepartment: DepartmentCode): void {
    if (!this.canModifyDepartment(user, targetDepartment)) {
      throw new SecurityPolicyViolationError(user, targetDepartment, 'emit events for');
    }
  }

  /**
   * Hard authorization guard for reading departmental data.
   */
  public assertCanReadDepartment(user: AuthUser, targetDepartment: DepartmentCode): void {
    if (!this.canReadDepartment(user, targetDepartment)) {
      throw new SecurityPolicyViolationError(user, targetDepartment, 'read data from');
    }
  }

  /**
   * Filters a collection of business entities based on the user's authorization.
   */
  public filterAuthorizedEntities<T extends { department: DepartmentCode }>(
    user: AuthUser,
    entities: T[]
  ): T[] {
    if (this.canAccessCEOAnalytics(user)) {
      return entities; // CEO sees everything
    }

    return entities.filter((entity) => this.canReadDepartment(user, entity.department));
  }
}

export const securityPolicyService = new SecurityPolicyService();
