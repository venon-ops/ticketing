import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function OrganizationRegisterPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: 'organizer',
          organization_name: organizationName,
          organization_description: description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Impossible de créer l’organisation');
      }

      const token = data.access_token || data.token;

      if (!token) {
        throw new Error('Le serveur ne renvoie aucun token');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/organisation/dashboard');
    } catch (err: any) {
      setError(err.message || 'Impossible de créer l’organisation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Créer une organisation</h1>
      <p>Créez votre espace pour organiser des soirées et programmer des artistes.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Nom de l’organisation
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Description (optionnelle)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Email de connexion
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer mon organisation'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Déjà une organisation ?{' '}
        <Link to="/organisation/login">Se connecter</Link>
      </p>

      <p>
        <Link to="/register">Créer un compte particulier ou artiste</Link>
      </p>
    </div>
  );
}
