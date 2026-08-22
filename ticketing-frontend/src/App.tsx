import { Link, Route, Routes, useNavigate } from 'react-router-dom';
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
import OrganizationEventsPage from './pages/OrganizationEventsPage';
import CreateEventPage from './pages/CreateEventPage';
import EventDetailPage from './pages/EventDetailPage';
import EventArtistsPage from './pages/EventArtistsPage';
import EventTicketsPage from './pages/EventTicketsPage';
import PublicEventPage from './pages/PublicEventPage';
import { getUser, logout } from './services/api';
import MyEventTicketsPage from './pages/MyEventTicketsPage';

function Navigation() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate('/upcoming');
    window.location.reload();
  }

  const isOrganizer = user?.role === 'organizer';
  const isArtist = user?.role === 'artist';
  const isClient = !!user && !isOrganizer && !isArtist;

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        padding: '14px 20px',
        marginBottom: 20,
        borderBottom: '1px solid #ddd',
      }}
    >
      {isClient && (
        <Link to="/" style={{ color: 'inherit' }}>
          Pour toi
        </Link>
      )}

      {!isOrganizer && (
        <Link to="/upcoming" style={{ color: 'inherit' }}>
          À venir
        </Link>
      )}

      {isClient && (
        <>
          <Link to="/my-tickets" style={{ color: 'inherit' }}>
            Mes billets
          </Link>

          <Link to="/search" style={{ color: 'inherit' }}>
            Recherche
          </Link>
        </>
      )}

      {isOrganizer && (
        <>
          <Link to="/organisation/dashboard" style={{ color: 'inherit' }}>
            Tableau de bord
          </Link>

          <Link to="/organisation/events" style={{ color: 'inherit' }}>
            Mes événements
          </Link>

          <Link to="/organisation/events/new" style={{ color: 'inherit' }}>
            Créer un événement
          </Link>
        </>
      )}

      {isArtist && (
        <>
          <Link to="/organisation/events" style={{ color: 'inherit' }}>
            Mes événements
          </Link>

          <Link to="/feed" style={{ color: 'inherit' }}>
            Mon fil
          </Link>

          <Link to="/artist-profile" style={{ color: 'inherit' }}>
            Profil artiste
          </Link>
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
        {!user ? (
          <>
            <Link to="/login" style={{ color: 'inherit' }}>
              Connexion
            </Link>

            <Link to="/register" style={{ color: 'inherit' }}>
              Inscription
            </Link>
          </>
        ) : (
          <>
            <span style={{ color: '#555' }}>
              {user.name || user.email}
            </span>

            <button type="button" onClick={handleLogout}>
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function TemporaryPage({ title }: { title: string }) {
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
      <h1>{title}</h1>
      <p>Cette rubrique sera disponible prochainement.</p>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Navigation />

      <Routes>
        <Route path="/" element={<TemporaryPage title="Pour toi" />} />
        <Route path="/upcoming" element={<HomePage />} />
        <Route path="/events/:eventId" element={<PublicEventPage />} />

        <Route path="/my-tickets" element={<ReservationsPage />} />
        <Route path="/my-tickets/:eventId" element={<MyEventTicketsPage />} />
        <Route
          path="/search"
          element={<TemporaryPage title="Recherche" />}
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/places" element={<PlacesPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/artists" element={<ArtistsPage />} />
        <Route path="/artists/:artistId" element={<ArtistPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/artist-profile" element={<ArtistProfilePage />} />

        <Route
          path="/organisation/login"
          element={<OrganizationLoginPage />}
        />
        <Route
          path="/organisation/register"
          element={<OrganizationRegisterPage />}
        />

        <Route
          path="/organisation/dashboard"
          element={<OrganizationDashboardPage />}
        />
        <Route
          path="/organisation/events"
          element={<OrganizationEventsPage />}
        />
        <Route
          path="/organisation/events/new"
          element={<CreateEventPage />}
        />
        <Route
          path="/organisation/events/:eventId"
          element={<EventDetailPage />}
        />
        <Route
          path="/organisation/events/:eventId/artists"
          element={<EventArtistsPage />}
        />
        <Route
          path="/organisation/events/:eventId/tickets"
          element={<EventTicketsPage />}
        />
      </Routes>
    </>
  );
}