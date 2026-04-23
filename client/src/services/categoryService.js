import axios from 'axios';

const API_URL = '/api/categories';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };
};

const getCategories = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};

const getCategory = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

const createCategory = async (categoryData) => {
  const response = await axios.post(API_URL, categoryData, getAuthConfig());
  return response.data;
};

const updateCategory = async (id, categoryData) => {
  const response = await axios.put(`${API_URL}/${id}`, categoryData, getAuthConfig());
  return response.data;
};

const deleteCategory = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

const categoryService = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;
