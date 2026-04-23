import axios from 'axios';

const API_URL = '/api/reports';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return { headers: { Authorization: `Bearer ${user?.token}` } };
};

const getSalesReport = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_URL}/sales?${qs}` : `${API_URL}/sales`;
  const res = await axios.get(url, getAuthConfig());
  return res.data;
};

const getInventoryReport = async () => {
  const res = await axios.get(`${API_URL}/inventory`, getAuthConfig());
  return res.data;
};

const getStockMovementReport = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_URL}/stock-movements?${qs}` : `${API_URL}/stock-movements`;
  const res = await axios.get(url, getAuthConfig());
  return res.data;
};

export default { getSalesReport, getInventoryReport, getStockMovementReport };
