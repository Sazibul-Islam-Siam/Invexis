import axios from 'axios';

const API_URL = '/api/sales';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };
};

const getSales = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  const response = await axios.get(url, getAuthConfig());
  return response.data;
};

const getSale = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

const createSale = async (saleData) => {
  const response = await axios.post(API_URL, saleData, getAuthConfig());
  return response.data;
};

const deleteSale = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

const saleService = {
  getSales,
  getSale,
  createSale,
  deleteSale,
};

export default saleService;
