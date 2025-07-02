import { apiService } from './api';
import type { UserV2 } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: (string | { name: string })[];
  roleNames: (string | { name: string })[];
  permissions?: string[];
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  userCount: number;
  createdAt: string;
}

export interface AuthUserResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  };
  expiresIn: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface ListUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AssignRoleParams {
  userId: string;
  role: string;
  expiresAt?: string;
}

class AuthService {
  // Authentication methods
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) {
    return apiService.registerUser(data);
  }

  async login(email: string, password: string) {
    return apiService.loginUser(email, password);
  }

  async refresh(refreshToken: string) {
    return apiService.refreshToken(refreshToken);
  }

  async logout() {
    return apiService.logoutUser();
  }

  async getMe(): Promise<User> {
    const response = await apiService.getUserMe();
    const { user, session } = response.data;
    
    // Ensure name is a string, not an object
    let displayName = '';
    if (typeof user.name === 'string') {
      displayName = user.name;
    } else if (user.firstName && user.lastName) {
      displayName = `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      displayName = user.firstName;
    } else if (user.lastName) {
      displayName = user.lastName;
    } else {
      displayName = user.email.split('@')[0];
    }
    
    // Use server data directly, including first_name and last_name from server
    const serverUser = user as UserV2 & {
      first_name?: string;
      last_name?: string;
      is_active?: number | boolean;
      is_verified?: number | boolean;
      last_login_at?: string;
      created_at?: string;
    };
    
    return {
      id: user.id,
      email: user.email,
      name: displayName,
      firstName: serverUser.first_name || user.firstName || '',
      lastName: serverUser.last_name || user.lastName || '',
      lastLoginAt: serverUser.last_login_at || user.lastLoginAt || null,
      createdAt: serverUser.created_at || user.createdAt || '',
      isActive: Boolean(serverUser.is_active ?? user.isVerified),
      isVerified: Boolean(serverUser.is_verified ?? user.isVerified),
      roles: user.roles,
      roleNames: user.roles,
      permissions: session.permissions || user.permissions || []
    } as User;
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    return apiService.changeUserPassword(data);
  }

  // User management methods
  async listUsers(params: ListUsersParams = {}) {
    return apiService.listUsers(params);
  }

  async assignRole(data: AssignRoleParams) {
    return apiService.assignUserRole(data);
  }

  async listRoles() {
    return apiService.listRoles();
  }

  async getRoleDetails(roleName: string) {
    return apiService.getRoleDetails(roleName);
  }

  // Authentication info
  async getAuthInfo() {
    return apiService.getAuthInfoV2();
  }

  // Token management
  setToken(token: string) {
    apiService.setToken(token);
  }

  clearToken() {
    apiService.clearAuth();
  }
}

export const authService = new AuthService();
export default authService;
