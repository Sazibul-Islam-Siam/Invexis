import axios from 'axios';

const API_URL = '/api/restock-requests';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return { headers: { Authorization: `Bearer ${user?.firebaseToken}` } };
};

const getRestockRequests = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_URL}?${qs}` : API_URL;
  const res = await axios.get(url, getAuthConfig());
  return res.data;
};

const createRestockRequest = async (data) => {
  const res = await axios.post(API_URL, data, getAuthConfig());
  return res.data;
};

const approveRestockRequest = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}/approve`, data, getAuthConfig());
  return res.data;
};

const updateRestockRequest = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, getAuthConfig());
  return res.data;
};

const deleteRestockRequest = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return res.data;
};

export default { getRestockRequests, createRestockRequest, approveRestockRequest, updateRestockRequest, deleteRestockRequest };
