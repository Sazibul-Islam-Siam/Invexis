import axios from 'axios';

const API_URL = '/api/stock-adjustments';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return { headers: { Authorization: `Bearer ${user?.firebaseToken}` } };
};

const getStockAdjustments = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_URL}?${qs}` : API_URL;
  const res = await axios.get(url, getAuthConfig());
  return res.data;
};

const createStockAdjustment = async (data) => {
  const res = await axios.post(API_URL, data, getAuthConfig());
  return res.data;
};

export default { getStockAdjustments, createStockAdjustment };
