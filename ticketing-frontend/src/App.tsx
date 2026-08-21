import { Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlacesPage from './pages/PlacesPage';
import ReservationsPage from './pages/ReservationsPage';
import ArtistProfilePage from './pages/ArtistProfilePage';
import ArtistsPage from './pages/ArtistsPage';
import FeedPage from './pages/FeedPage';
import HomePage from './pages/HomePage';
import { ArtistPage } from './pages/ArtistPage';
import OrganizationLoginPage from './pages/OrganizationLoginPage';
import OrganizationRegisterPage from './pages/OrganizationRegisterPage';
import OrganizationDashboardPage from './pages/OrganizationDashboardPage';
import CreateEventPage from './pages/CreateEventPage';
import EventDetailPage from './pages/EventDetailPage';
import EventArtistsPage from './pages/EventArtistsPage';



export default function App() {
  return (
    <>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>
          Accueil
        </Link>
        <Link to="/login" style={{ marginRight: 10 }}>
          Login
        </Link>
        <Link to="/register" style={{ marginRight: 10 }}>
          Register
        </Link>
        <Link to="/places" style={{ marginRight: 10 }}>
          Places
        </Link>
        <Link to="/reservations" style={{ marginRight: 10 }}>
          Reservations
        </Link>
        <Link to="/artists" style={{ marginRight: 10 }}>
          Artistes
        </Link>
        <Link to="/feed" style={{ marginRight: 10 }}>
          Mon fil
        </Link>
        <Link to="/artist-profile" style={{ marginRight: 10 }}>
          Profil artiste
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/places" element={<PlacesPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/artists" element={<ArtistsPage />} />

        <Route path="/artists/:artistId" element={<ArtistPage />} />

        <Route path="/feed" element={<FeedPage />} />
        <Route path="/artist-profile" element={<ArtistProfilePage />} />
        <Route path="/organisation/login" element={<OrganizationLoginPage />} />
        <Route path="/organisation/register" element={<OrganizationRegisterPage />} />
        <Route path="/organisation/dashboard" element={<OrganizationDashboardPage />} />
        <Route path="/organisation/events/new" element={<CreateEventPage />} />
        <Route path="/organisation/events/:eventId" element={<EventDetailPage />} />
        <Route path="/organisation/events/:eventId/artists" element={<EventArtistsPage />} />
        
      </Routes>
    </>
  );
}