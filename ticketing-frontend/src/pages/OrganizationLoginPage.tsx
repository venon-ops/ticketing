import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function OrganizationLoginPage() {
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
      const data = await login(email, password);

      if (data.user?.role !== 'organizer') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        throw new Error(
          'Ce compte n’est pas une organisation. Utilisez la connexion classique.',
        );
      }

      navigate('/organisation/dashboard');
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1>Connexion organisation</h1>
      <p>Accédez à votre espace organisateur.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Email
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
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Pas encore d’organisation ?{' '}
        <Link to="/organisation/register">Créer mon organisation</Link>
      </p>

      <p>
        <Link to="/login">Connexion particulier ou artiste</Link>
      </p>
    </div>
  );
}
