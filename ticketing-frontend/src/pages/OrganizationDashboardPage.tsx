import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, getToken } from '../services/api';

interface Organization {
  id: string;
  name: string;
  description?: string | null;
}

interface EventItem {
  id: string;
  name: string;
  date: string;
  venue: string;
}

export default function OrganizationDashboardPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();
    const token = getToken();

    if (!user || user.role !== 'organizer' || !token) {
      navigate('/organisation/login');
      return;
    }

    fetch(`http://localhost:3000/organizations/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Impossible de charger l’organisation');
        }
        return res.json();
      })
      .then((data) => {
        setOrganization(data.organization || data);
        setEvents(data.events || []);
      })
      .catch((err: any) => {
        setError(err.message || 'Erreur lors du chargement');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return <div style={{ padding: 20 }}>Chargement…</div>;
  }

  if (error || !organization) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: 'red' }}>{error || 'Organisation non trouvée'}</p>
        <button onClick={() => navigate('/organisation/login')}>
          Se reconnecter
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>Tableau de bord – {organization.name}</h1>
      {organization.description && (
        <p style={{ marginBottom: 24 }}>{organization.description}</p>
      )}

      <div style={{ marginBottom: 24 }}>
        <Link to="/organisation/events/new">
          <button>Créer un événement</button>
        </Link>
      </div>

      <h2>Mes événements</h2>

      {events.length === 0 ? (
        <p>Vous n’avez aucun événement pour le moment.</p>
      ) : (
        <ul>
          {events.map((ev) => (
            <li key={ev.id} style={{ marginBottom: 8 }}>
              <Link to={`/organisation/events/${ev.id}`}>
                {ev.name} – {new Date(ev.date).toLocaleDateString()} à {ev.venue}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
