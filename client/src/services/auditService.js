import axios from 'axios';

const API_URL = '/api/audit-logs';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: `Bearer ${user?.firebaseToken}`,
    },
  };
};

const getAuditLogs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axios.get(`${API_URL}?${query}`, getAuthConfig());
  return response.data;
};

const auditService = { getAuditLogs };

export default auditService;
