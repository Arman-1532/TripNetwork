import axios from 'axios';

const apiInstance = axios.create({
  baseURL: '/api',
});

// Request interceptor to add the JWT token
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to simplify data access and handle errors
apiInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If we get a 401, potentially clear token and redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Raw instance (no response interceptor) for cases where we need headers/status
const rawApiInstance = axios.create({ baseURL: '/api' });
rawApiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  __raw: {
    flights: {
      search: (params) => {
        const { origin, destination, date, adults } = params;
        return rawApiInstance.get('/flights/search', {
          params: { origin, destination, date, adults }
        });
      }
    },
    users: {
      updateProfile: (payload) => rawApiInstance.put('/users/profile', payload),
    },
    packages: {
      create: (payload) => rawApiInstance.post('/packages', payload),
      update: (id, payload) => rawApiInstance.put(`/packages/${id}`, payload),
    },
    hotels: {
      createPackage: (payload) => rawApiInstance.post('/hotels/packages', payload),
      myPackages: () => rawApiInstance.get('/hotels/my-packages'),
    },
  },
  auth: {
    me: () => apiInstance.get('/auth/me').catch(() => ({ success: false })),
    login: (email, password) => apiInstance.post('/auth/login', { email, password }),
    register: (payload) => apiInstance.post('/auth/register', payload),
  },
  packages: {
    getAll: () => apiInstance.get('/packages').catch(() => ({ success: false, data: [] })),
    getMyPackages: () => apiInstance.get('/packages/my-packages'),
    update: (id, payload) => apiInstance.put(`/packages/${id}`, payload),
    delete: (id) => apiInstance.delete(`/packages/${id}`),
  },
  bookings: {
    getAll: () => apiInstance.get('/bookings').catch(() => ({ success: false, data: [] })),
    create: (bookingData) => apiInstance.post('/bookings', bookingData),
  },
  payment: {
    init: (bookingId) => apiInstance.post('/payment/init', { bookingId }),
  },
  flights: {
    search: (params) => {
      const { origin, destination, date, adults } = params;
      return apiInstance.get('/flights/search', {
        params: { origin, destination, date, adults }
      });
    }
  },
  customRequests: {
    create: (data) => apiInstance.post('/custom-requests', data),
    getMyRequests: () => apiInstance.get('/custom-requests/my-requests'),
    getAvailable: () => apiInstance.get('/custom-requests/available'),
    bid: (requestId, data) => apiInstance.post(`/custom-requests/${requestId}/bid`, data),
    acceptBid: (requestId, data) => apiInstance.post(`/custom-requests/${requestId}/accept-bid`, data),
    acknowledgeBid: (requestId) => apiInstance.post(`/custom-requests/${requestId}/acknowledge-bid`),
  },
  chat: {
    rooms: () => apiInstance.get('/chat/rooms'),
  },
  admin: {
    pendingProviders: () => apiInstance.get('/admin/pending-providers'),
    approveProvider: (id) => apiInstance.put(`/admin/providers/${id}/approve`),
    rejectProvider: (id) => apiInstance.put(`/admin/providers/${id}/reject`),
    getUsers: () => apiInstance.get('/admin/users'),
    deleteUser: (id) => apiInstance.delete(`/admin/users/${id}`),
  },
  hotels: {
    search: (params) => apiInstance.get('/hotels/search', { params }),
    getById: (packageId) => apiInstance.get(`/hotels/${packageId}`),
  },
  ai: {
    chat: (message, history = []) => apiInstance.post('/ai/chat', { message, history }),
  },
};
