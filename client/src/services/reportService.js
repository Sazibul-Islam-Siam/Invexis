import axios from 'axios';

const API_URL = '/api/reports';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return { headers: { Authorization: `Bearer ${user?.firebaseToken}` } };
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

const getSupplierReport = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_URL}/supplier?${qs}` : `${API_URL}/supplier`;
  const config = getAuthConfig();
  // Add active company header for supplier multi-company context
  const activeCompany = localStorage.getItem('activeCompany');
  if (activeCompany) {
    try {
      // In case it's stored as JSON
      const parsed = JSON.parse(activeCompany);
      config.headers['x-active-company'] = parsed._id || parsed;
    } catch {
      // If it's a plain string
      config.headers['x-active-company'] = activeCompany;
    }
  }
  const res = await axios.get(url, config);
  return res.data;
};

export default { getSalesReport, getInventoryReport, getStockMovementReport, getSupplierReport };
