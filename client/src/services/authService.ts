import { apiService } from './api';

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
  roles: string[];
  roleNames: string[];
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
    
    // Merge user data with permissions from session
    return {
      ...user,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt || '',
      roleNames: user.roles, // Copy roles to roleNames for compatibility
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
