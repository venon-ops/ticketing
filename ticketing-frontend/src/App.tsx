import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlacesPage from './pages/PlacesPage';
import ReservationsPage from './pages/ReservationsPage';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Ne pas afficher le header sur les pages de login / register
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div style={{ padding: '10px 20px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <a href="/places" style={{ marginRight: 15, textDecoration: 'none', color: 'inherit' }}>Places</a>
        <a href="/reservations" style={{ textDecoration: 'none', color: 'inherit' }}>Mes réservations</a>
      </div>
      <button onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}

function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/places" element={<PlacesPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/" element={<Navigate to="/places" />} />
      </Routes>
    </div>
  );
}

export default App;