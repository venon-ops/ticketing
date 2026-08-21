import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'artist'>('user');
  const [stageName, setStageName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const payload: any = {
      email,
      password,
      role,
    };

    if (role === 'artist') {
      if (!stageName.trim()) {
        setError('Le nom de scène est requis pour un compte artiste');
        return;
      }
      payload.stage_name = stageName;
      payload.bio = bio;
    } else {
      // Pour un compte particulier, on garde firstName/lastName si ton backend les accepte
      // Si ton backend ne les utilise pas, tu peux les retirer complètement
      payload.firstName = firstName;
      payload.lastName = lastName;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Échec de l’inscription');
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Échec de l’inscription');
    }
  }

  return (
    <div style={{ maxWidth: 340, margin: '40px auto' }}>
      <h1>Inscription</h1>
      <form onSubmit={handleSubmit}>
        {/* Type de compte en premier */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>
            Type de compte
          </label>
          <div style={{ marginBottom: 6 }}>
            <label style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === 'user'}
                onChange={() => setRole('user')}
              />{' '}
              Particulier
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="artist"
                checked={role === 'artist'}
                onChange={() => setRole('artist')}
              />{' '}
              Artiste
            </label>
          </div>
        </div>

        {role === 'user' && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label>
                Prénom
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>
                Nom
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>
            </div>
          </>
        )}

        {role === 'artist' && (
          <div style={{ marginBottom: 10 }}>
            <label>
              Nom de scène
              <input
                type="text"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                required
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
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
        <div style={{ marginBottom: 10 }}>
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

        {role === 'artist' && (
          <div style={{ marginBottom: 10 }}>
            <label>
              Bio (optionnelle)
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">S’inscrire</button>
      </form>
      <p style={{ marginTop: 10 }}>
        Déjà un compte ?{' '}
        <a href="/login" style={{ textDecoration: 'none' }}>
          Se connecter
        </a>
      </p>
    </div>
  );
}