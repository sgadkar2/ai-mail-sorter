import axios from 'axios';
import { ErrorHandler } from './errorHandler';
import { getAuthToken, logout } from './auth';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorInfo = ErrorHandler.handle(error, 'API Request');
    
    // Handle authentication errors globally
    if (errorInfo.type === 'AUTHENTICATION') {
      logout();
    }
    
    return Promise.reject(errorInfo);
  }
);

// API methods with better error handling
export const api = {
  // Generic request methods
  async get(url, config = {}) {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handle(error, `GET ${url}`);
    }
  },

  async post(url, data = {}, config = {}) {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handle(error, `POST ${url}`);
    }
  },

  async put(url, data = {}, config = {}) {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handle(error, `PUT ${url}`);
    }
  },

  async delete(url, config = {}) {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handle(error, `DELETE ${url}`);
    }
  },

  // Specific API endpoints
  categories: {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
  },

  emails: {
    getByCategory: (categoryId, params = {}) => 
      api.get(`/emails/category/${categoryId}`, { params }),
    getById: (id) => api.get(`/emails/${id}`),
    delete: (emailIds) => api.delete('/emails', { data: { emailIds } }),
    unsubscribe: (emailIds) => api.post('/emails/unsubscribe', { emailIds }),
  },

  gmailAccounts: {
    getAll: () => api.get('/gmail-accounts'),
    add: () => api.post('/gmail-accounts/add'),
    remove: (id) => api.delete(`/gmail-accounts/${id}`),
    refreshTokens: () => api.post('/gmail-accounts/refresh-tokens'),
  },
};

export default apiClient; 