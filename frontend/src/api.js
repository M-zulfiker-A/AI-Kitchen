import axios from 'axios';

const API_BASE = 'http://localhost:8000'; // Change if backend runs elsewhere

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API_BASE}/upload/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const chatWithFile = async ({ filename, query }) => {
  const formData = new FormData();
  formData.append('filename', filename);
  formData.append('query', query);
  const res = await axios.post(`${API_BASE}/chat-file/`, formData);
  return res.data;
};

export const chatAI = async (query) => {
  const formData = new FormData();
  formData.append('query', query);
  const res = await axios.post(`${API_BASE}/chat/`, formData);
  return res.data;
};
