import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, getUser } from '../services/api';

interface Organization {
  id: string;
  name: string;
  description?: string | null;
}

interface EventItem {
  id: string;
  name: string;
  location_name?: string | null;
  venue?: string | null;
  date_start: string;
  capacity?: number | null;
  status: string;
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

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [organizationResponse, eventsResponse] = await Promise.all([
          fetch('http://localhost:3000/organizations/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch('http://localhost:3000/events/mine', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const organizationData = await organizationResponse.json();
        const eventsData = await eventsResponse.json();

        if (!organizationResponse.ok) {
          throw new Error(
            organizationData.message ||
              "Impossible de charger l'organisation",
          );
        }

        if (!eventsResponse.ok) {
          throw new Error(
            eventsData.message || 'Impossible de charger les événements',
          );
        }

        setOrganization(organizationData.organization || organizationData);
        setEvents(eventsData || []);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [navigate]);

  if (loading) {
    return <div style={{ padding: 20 }}>Chargement…</div>;
  }

  if (error || !organization) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: 'red' }}>
          {error || 'Organisation non trouvée'}
        </p>

        <button onClick={() => navigate('/organisation/login')}>
          Se reconnecter
        </button>
      </div>
    );
  }

  const now = new Date();

  const draftEvents = events.filter((event) => event.status === 'draft');

  const publishedEvents = events.filter(
    (event) => event.status === 'published',
  );

  const upcomingPublishedEvents = publishedEvents
    .filter((event) => new Date(event.date_start) >= now)
    .sort(
      (first, second) =>
        new Date(first.date_start).getTime() -
        new Date(second.date_start).getTime(),
    );

  const nextEvent = upcomingPublishedEvents[0] || null;

  const totalCapacity = publishedEvents.reduce(
    (total, event) => total + Number(event.capacity || 0),
    0,
  );

  const statCardStyle = {
    border: '1px solid #ddd',
    borderRadius: 12,
    padding: 18,
    background: '#fff',
  };

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <p style={{ margin: '0 0 6px', color: '#555' }}>
            Espace organisateur
          </p>

          <h1 style={{ margin: 0 }}>Tableau de bord</h1>

          <p style={{ margin: '8px 0 0' }}>
            {organization.name}
            {organization.description ? ` — ${organization.description}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/organisation/events">
            <button type="button">Mes événements</button>
          </Link>

          <Link to="/organisation/events/new">
            <button type="button">Créer un événement</button>
          </Link>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
          marginBottom: 30,
        }}
      >
        <article style={statCardStyle}>
          <p style={{ margin: 0, color: '#555' }}>Événements</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 28 }}>
            {events.length}
          </strong>
        </article>

        <article style={statCardStyle}>
          <p style={{ margin: 0, color: '#555' }}>Brouillons à finaliser</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 28 }}>
            {draftEvents.length}
          </strong>
        </article>

        <article style={statCardStyle}>
          <p style={{ margin: 0, color: '#555' }}>Événements publiés</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 28 }}>
            {publishedEvents.length}
          </strong>
        </article>

        <article style={statCardStyle}>
          <p style={{ margin: 0, color: '#555' }}>Capacité publiée</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 28 }}>
            {totalCapacity}
          </strong>
        </article>

        <article style={statCardStyle}>
          <p style={{ margin: 0, color: '#555' }}>Billets vendus</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 28 }}>
            0
          </strong>
          <small style={{ color: '#555' }}>Disponible après les réservations</small>
        </article>

        <article style={statCardStyle}>
          <p style={{ margin: 0, color: '#555' }}>Chiffre d'affaires</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 28 }}>
            0,00 €
          </strong>
          <small style={{ color: '#555' }}>Disponible après les paiements</small>
        </article>
      </section>

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Prochain événement</h2>

        {nextEvent ? (
          <>
            <h3 style={{ marginBottom: 8 }}>{nextEvent.name}</h3>
            <p style={{ margin: '4px 0' }}>
              {new Date(nextEvent.date_start).toLocaleString('fr-FR')}
            </p>
            <p style={{ margin: '4px 0 16px' }}>
              {nextEvent.location_name || nextEvent.venue || 'Lieu non renseigné'}
            </p>

            <Link to={`/organisation/events/${nextEvent.id}`}>
              Ouvrir l'événement
            </Link>
          </>
        ) : (
          <p>
            Aucun événement publié à venir. Crée ou finalise un événement pour
            le rendre visible au public.
          </p>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        <article
          style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>À finaliser</h2>

          {draftEvents.length === 0 ? (
            <p>Aucun brouillon à finaliser.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {draftEvents.slice(0, 4).map((event) => (
                <Link
                  key={event.id}
                  to={`/organisation/events/${event.id}`}
                  style={{ color: 'inherit' }}
                >
                  {event.name}
                </Link>
              ))}
            </div>
          )}

          {draftEvents.length > 4 && (
            <p style={{ marginBottom: 0 }}>
              <Link to="/organisation/events">
                Voir tous les brouillons
              </Link>
            </p>
          )}
        </article>

        <article
          style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Actions rapides</h2>

          <div style={{ display: 'grid', gap: 10 }}>
            <Link to="/organisation/events/new">
              Créer un nouvel événement
            </Link>

            <Link to="/organisation/events">
              Gérer mes événements
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}