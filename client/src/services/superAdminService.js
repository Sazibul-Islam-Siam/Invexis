import axios from 'axios';

const API_URL = '/api/super-admin';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: `Bearer ${user?.firebaseToken}`,
    },
  };
};

const getPlatformStats = async () => {
  const response = await axios.get(`${API_URL}/stats`, getAuthConfig());
  return response.data;
};

const getCompanies = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axios.get(`${API_URL}/companies?${query}`, getAuthConfig());
  return response.data;
};

const toggleCompanyStatus = async (id) => {
  const response = await axios.put(`${API_URL}/companies/${id}/toggle-status`, {}, getAuthConfig());
  return response.data;
};

const deleteCompany = async (id) => {
  const response = await axios.delete(`${API_URL}/companies/${id}`, getAuthConfig());
  return response.data;
};

const superAdminService = {
  getPlatformStats,
  getCompanies,
  toggleCompanyStatus,
  deleteCompany,
};

export default superAdminService;
