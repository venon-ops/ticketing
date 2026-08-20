const API_URL = 'http://localhost:3000';

export interface LoginResponse {
  accessToken?: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    name?: string;
  };
  message?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Réponse invalide du serveur');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Erreur lors de la connexion');
  }

  // Le backend renvoie accessToken ou token
  const token = data.accessToken || data.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return data;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getUser(): { id: number; email: string; name?: string } | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}