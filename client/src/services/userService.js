import axios from 'axios';

const API_URL = '/api/users';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };
};

const getUsers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  const response = await axios.get(url, getAuthConfig());
  return response.data;
};

const getUser = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

const createUser = async (userData) => {
  const response = await axios.post(API_URL, userData, getAuthConfig());
  return response.data;
};

const updateUser = async (id, userData) => {
  const response = await axios.put(`${API_URL}/${id}`, userData, getAuthConfig());
  return response.data;
};

const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

const userService = { getUsers, getUser, createUser, updateUser, deleteUser };

export default userService;
