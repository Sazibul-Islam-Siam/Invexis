import axios from 'axios';

const API_URL = '/api/dashboard';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };
};

const getStats = async () => {
  const response = await axios.get(`${API_URL}/stats`, getAuthConfig());
  return response.data;
};

const getSalesChart = async (days = 7) => {
  const response = await axios.get(`${API_URL}/sales-chart?days=${days}`, getAuthConfig());
  return response.data;
};

const getRecentActivity = async () => {
  const response = await axios.get(`${API_URL}/recent-activity`, getAuthConfig());
  return response.data;
};

const getSupplierStats = async () => {
  const response = await axios.get(`${API_URL}/supplier-stats`, getAuthConfig());
  return response.data;
};

const getStaffStats = async () => {
  const response = await axios.get(`${API_URL}/staff-stats`, getAuthConfig());
  return response.data;
};

const dashboardService = {
  getStats,
  getSalesChart,
  getRecentActivity,
  getSupplierStats,
  getStaffStats,
};

export default dashboardService;
