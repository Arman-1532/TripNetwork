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
    getById: (id) => apiInstance.get(`/packages/${id}`),
    getMyPackages: () => apiInstance.get('/packages/my-packages'),
    update: (id, payload) => apiInstance.put(`/packages/${id}`, payload),
    delete: (id) => apiInstance.delete(`/packages/${id}`),
    getReviews: (id) => apiInstance.get(`/packages/${id}/reviews`),
    addReview: (id, payload) => apiInstance.post(`/packages/${id}/reviews`, payload),
    canReview: (id) => apiInstance.get(`/packages/${id}/can-review`),
  },
  bookings: {
    getAll: () => apiInstance.get('/bookings').catch(() => ({ success: false, data: [] })),
    create: (bookingData) => apiInstance.post('/bookings', bookingData),
    requestRefund: (id) => apiInstance.post(`/bookings/${id}/refund`),
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
    rejectBid: (requestId, data) => apiInstance.post(`/custom-requests/${requestId}/reject-bid`, data),
    acknowledgeBid: (requestId) => apiInstance.post(`/custom-requests/${requestId}/acknowledge-bid`),
  },
  chat: {
    rooms: () => apiInstance.get('/chat/rooms'),
  },
  admin: {
    pendingProviders: () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role?.toLowerCase() !== 'admin') return Promise.resolve({ success: false, message: 'Unauthorized' });
      return apiInstance.get('/admin/pending-providers');
    },
    approveProvider: (id) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role?.toLowerCase() !== 'admin') return Promise.reject(new Error('Unauthorized'));
      return apiInstance.put(`/admin/providers/${id}/approve`);
    },
    rejectProvider: (id) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role?.toLowerCase() !== 'admin') return Promise.reject(new Error('Unauthorized'));
      return apiInstance.put(`/admin/providers/${id}/reject`);
    },
    getUsers: () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role?.toLowerCase() !== 'admin') return Promise.resolve({ success: false, data: [] });
      return apiInstance.get('/admin/users');
    },
    searchUserByEmail: (email) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role?.toLowerCase() !== 'admin') return Promise.reject(new Error('Unauthorized'));
      return apiInstance.get('/admin/users/search', { params: { email } });
    },
    blockUser: (id) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role?.toLowerCase() !== 'admin') return Promise.reject(new Error('Unauthorized'));
      return apiInstance.put(`/admin/users/${id}/block`);
    },
    unblockUser: (id) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role?.toLowerCase() !== 'admin') return Promise.reject(new Error('Unauthorized'));
      return apiInstance.put(`/admin/users/${id}/unblock`);
    },
    deleteUser: (id) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role?.toLowerCase() !== 'admin') return Promise.reject(new Error('Unauthorized'));
      return apiInstance.delete(`/admin/users/${id}`);
    },
  },
  hotels: {
    search: (params) => apiInstance.get('/hotels/search', { params }),
    getById: (packageId) => apiInstance.get(`/hotels/${packageId}`),
    getReviews: (packageId) => apiInstance.get(`/hotels/${packageId}/reviews`),
    addReview: (packageId, payload) => apiInstance.post(`/hotels/${packageId}/reviews`, payload),
    canReview: (packageId) => apiInstance.get(`/hotels/${packageId}/can-review`),
  },
  ai: {
    chat: (message, history = []) => apiInstance.post('/ai/chat', { message, history }),
  },
  recommendations: {
    get: () => apiInstance.get('/recommendations').catch(() => ({ success: false, data: { recommendations: [], insight: null } })),
  },
  notifications: {
    getAll: () => apiInstance.get('/notifications'),
    getUnreadCount: () => apiInstance.get('/notifications/unread/count'),
    markAsRead: (notificationId) => apiInstance.put(`/notifications/${notificationId}/mark-read`),
    markAllAsRead: () => apiInstance.put('/notifications/mark-all-read'),
    getDetails: (notificationId) => apiInstance.get(`/notifications/${notificationId}`),
  },
};
