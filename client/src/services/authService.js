import axios from 'axios';

const API_URL = '/api/auth';

// Register user
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  if (response.data.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  return response.data.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  if (response.data.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  return response.data.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem('user');
};

// Get current user
const getMe = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(`${API_URL}/me`, config);
  return response.data.data;
};

const authService = {
  register,
  login,
  logout,
  getMe,
};

export default authService;
