import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h1>Bienvenue sur Ticketing</h1>
      <p>Utilise le menu en haut pour naviguer.</p>
      <ul>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/register">Register</Link></li>
        <li><Link to="/places">Places</Link></li>
        <li><Link to="/reservations">Reservations</Link></li>
        <li><Link to="/artist-profile">Profil artiste</Link></li>
      </ul>
    </div>
  );
}