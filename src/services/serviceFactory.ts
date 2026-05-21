import apiClient from './apiClient';

export function createCrudService<T>(basePath: string) {
    // Ensure trailing slash if needed or keep raw depending on backend routing
    const path = basePath.endsWith('/') ? basePath : `${basePath}/`;

    return {
        getAll: async (params?: { skip?: number; limit?: number }): Promise<T[]> => {
            try {
                const response = await apiClient.get(path, {
                    params: {
                        skip: params?.skip ?? 0,
                        limit: params?.limit ?? 50,
                    },
                });
                return response.data;
            } catch (error) {
                console.error(`[CRUD] GetAll error for ${path}:`, error);
                return [];
            }
        },

        getById: async (id: number | string): Promise<T | null> => {
            try {
                const response = await apiClient.get(`${path}${id}`);
                return response.data;
            } catch (error) {
                console.error(`[CRUD] GetById error for ${path}:`, error);
                return null;
            }
        },

        create: async (data: Partial<T>): Promise<T | null> => {
            try {
                const response = await apiClient.post(path, data);
                return response.data;
            } catch (error) {
                console.error(`[CRUD] Create error for ${path}:`, error);
                return null;
            }
        },

        update: async (id: number | string, data: Partial<T>): Promise<T | null> => {
            try {
                const response = await apiClient.put(`${path}${id}`, data);
                return response.data;
            } catch (error) {
                console.error(`[CRUD] Update error for ${path}:`, error);
                return null;
            }
        },

        delete: async (id: number | string): Promise<boolean> => {
            try {
                const response = await apiClient.delete(`${path}${id}`);
                return response.status === 200 || response.status === 204;
            } catch (error) {
                console.error(`[CRUD] Delete error for ${path}:`, error);
                return false;
            }
        }
    };
}
