import { User } from '@/types/auth';
import apiClient from './apiClient';
import { mapUser } from './mappers';

export interface UserCreateData {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    role: string;
    phone?: string;
    status?: string;
    address?: string;
    tags?: string;
    supervisor_id?: number;
}

export interface UserUpdateData {
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    password?: string;
    phone?: string;
    status?: string;
    profile_zone?: string;
    profile_image?: string | null;
    address?: string;
    tags?: string;
    supervisor_id?: number | null;
}

export const UserService = {
    getAll: async (params?: { skip?: number; limit?: number }): Promise<User[]> => {
        try {
            const response = await apiClient.get('/api/users/', {
                params: {
                    skip: params?.skip ?? 0,
                    limit: params?.limit ?? 50,
                },
            });
            return response.data.map((u: any) => mapUser(u));
        } catch (error) {
            console.error('Fetch users error:', error);
            return [];
        }
    },

    getById: async (id: string | number): Promise<User | null> => {
        try {
            const response = await apiClient.get(`/api/users/${id}`);
            return mapUser(response.data);
        } catch (error) {
            console.error('Fetch user by ID error:', error);
            return null;
        }
    },

    getMe: async (): Promise<User | null> => {
        try {
            const response = await apiClient.get('/api/users/me');
            return mapUser(response.data);
        } catch (error) {
            console.error('Fetch me error:', error);
            return null;
        }
    },

    create: async (userData: UserCreateData): Promise<User | null> => {
        try {
            const response = await apiClient.post('/api/users/', userData);
            return response.data;
        } catch (error) {
            console.error('Create user error:', error);
            throw error;
        }
    },

    update: async (id: string | number, userData: UserUpdateData): Promise<User | null> => {
        try {
            // Use the /me endpoint for self-updates (no role restriction)
            const response = await apiClient.patch(`/api/users/me`, userData);
            if (response.data) {
                return mapUser(response.data);
            }
            return null;
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    },

    updateById: async (id: string | number, userData: UserUpdateData): Promise<User | null> => {
        try {
            // Admin-only: update any user by ID
            const response = await apiClient.put(`/api/users/${id}`, userData);
            if (response.data) {
                return mapUser(response.data);
            }
            return null;
        } catch (error) {
            console.error('Update user by ID error:', error);
            throw error;
        }
    },

    delete: async (id: string | number): Promise<boolean> => {
        try {
            const response = await apiClient.delete(`/api/users/${id}`);
            return response.status === 200 || response.status === 204;
        } catch (error) {
            console.error('Delete user error:', error);
            return false;
        }
    },

    changePassword: async (data: { old_password: string; new_password: string }): Promise<boolean> => {
        try {
            const response = await apiClient.patch('/api/users/me/password', data);
            return response.status === 200;
        } catch (error: any) {
            console.error('Change password error:', error);
            const message = error.response?.data?.detail || 'Failed to change password';
            throw new Error(message);
        }
    }
};
