import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (username, password, displayName) => 
    api.post('/auth/register', { username, password, displayName }),
  login: (username, password) => 
    api.post('/auth/login', { username, password })
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  getMessages: (userId) => api.get(`/messages/${userId}`)
};

export default api;
