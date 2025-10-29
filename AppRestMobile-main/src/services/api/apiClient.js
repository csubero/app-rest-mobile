import axios from 'axios';
// import Constants from '../helpers/Constants';

const apiClient = (serverIP, token = null) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  var baseURL = `http://${serverIP}/api/`;

  const apiInstance = axios.create({
    baseURL: baseURL,
    headers,
  });

  const get = async (endpoint, params = {}) => {
    console.log(`Endpoint: ${endpoint}`);

    try {
      const response = await apiInstance.get(endpoint, {params});
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  };

  const post = async (endpoint, data) => {
    console.log('Endpoint', endpoint);
    console.log('data', data);

    try {
      const response = await apiInstance.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.log('error', error.response.data);
      throw new Error(error);
    }
  };

  const put = async (endpoint, data) => {
    console.log('Endpoint', endpoint);
    console.log('data', data);

    try {
      const response = await apiInstance.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.log('error', error.response?.data || error.message);
      throw new Error(error);
    }
  };

  const del = async (endpoint, params = {}) => {
    console.log('Endpoint', endpoint);
    try {
      const response = await apiInstance.delete(endpoint, {params});
      return response.data;
    } catch (error) {
      console.log('error', error.response?.data || error.message);
      throw new Error(error);
    }
  };

  return {
    get,
    post,
    put,
    delete: del,
  };
};

export default apiClient;
