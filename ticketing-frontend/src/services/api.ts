const API_URL = 'http://localhost:3000';

export interface LoginResponse {
  access_token?: string;
  accessToken?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    role?: string;
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

  let data: LoginResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Réponse invalide du serveur');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Erreur lors de la connexion');
  }

  const token = data.access_token || data.accessToken || data.token;

  if (!token) {
    throw new Error('Le serveur ne renvoie aucun token de connexion');
  }

  localStorage.setItem('token', token);

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

export function getUser(): { id: string; email: string; role?: string; name?: string } | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
