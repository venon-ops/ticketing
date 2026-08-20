import axios from 'axios';

const API_URL = 'http://localhost:3000';

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  return res.data.accessToken;
}

export async function getProfile(token: string) {
  const res = await axios.get(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
