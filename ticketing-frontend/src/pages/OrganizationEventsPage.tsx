import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, getUser } from '../services/api';

interface EventItem {
  id: string;
  name: string;
  description?: string | null;
  location_name?: string | null;
  venue?: string | null;
  address?: string | null;
  date_start: string;
  date_end?: string | null;
  capacity?: number | null;
  image_url?: string | null;
  status: string;
}

type StatusFilter = 'all' | 'draft' | 'published' | 'cancelled' | 'done';

function getStatusLabel(status: string) {
  if (status === 'draft') return 'Brouillon';
  if (status === 'published') return 'Publié';
  if (status === 'cancelled') return 'Annulé';
  if (status === 'done') return 'Terminé';
  return status;
}

export default function OrganizationEventsPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const user = getUser();
    const token = getToken();

    if (!user || user.role !== 'organizer' || !token) {
      navigate('/organisation/login');
      return;
    }

    async function loadEvents() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('http://localhost:3000/events/mine', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Impossible de charger les événements',
          );
        }

        setEvents(data || []);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [navigate]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return events.filter((event) => {
      const hasCorrectStatus =
        statusFilter === 'all' || event.status === statusFilter;

      const hasCorrectSearch =
        !normalizedSearch ||
        event.name.toLowerCase().includes(normalizedSearch) ||
        (event.location_name || event.venue || '')
          .toLowerCase()
          .includes(normalizedSearch);

      return hasCorrectStatus && hasCorrectSearch;
    });
  }, [events, search, statusFilter]);

  if (loading) {
    return <div style={{ padding: 20 }}>Chargement…</div>;
  }

  if (error) {
    return (
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
        <p style={{ color: 'red' }}>{error}</p>
        <Link to="/organisation/dashboard">Retour au tableau de bord</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <p style={{ margin: '0 0 6px', color: '#555' }}>
            Espace organisateur
          </p>
          <h1 style={{ margin: 0 }}>Mes événements</h1>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/organisation/dashboard">
            <button type="button">Tableau de bord</button>
          </Link>

          <Link to="/organisation/events/new">
            <button type="button">Créer un événement</button>
          </Link>
        </div>
      </header>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          padding: 16,
          marginBottom: 24,
          border: '1px solid #ddd',
          borderRadius: 12,
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par nom ou lieu"
          style={{ flex: '1 1 240px', minWidth: 0, padding: 8 }}
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
          style={{ padding: 8 }}
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillons</option>
          <option value="published">Publiés</option>
          <option value="cancelled">Annulés</option>
          <option value="done">Terminés</option>
        </select>
      </section>

      <p style={{ color: '#555' }}>
        {filteredEvents.length} événement
        {filteredEvents.length > 1 ? 's' : ''} affiché
        {filteredEvents.length > 1 ? 's' : ''}.
      </p>

      {filteredEvents.length === 0 ? (
        <section
          style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Aucun événement trouvé</h2>
          <p>
            Crée un événement, ou modifie ta recherche et tes filtres.
          </p>
          <Link to="/organisation/events/new">
            <button type="button">Créer un événement</button>
          </Link>
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 14 }}>
          {filteredEvents.map((event) => (
            <article
              key={event.id}
              style={{
                display: 'grid',
                gridTemplateColumns: event.image_url
                  ? '160px minmax(0, 1fr)'
                  : 'minmax(0, 1fr)',
                gap: 16,
                border: '1px solid #ddd',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 160,
                    objectFit: 'cover',
                  }}
                />
              )}

              <div style={{ padding: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
                      {event.name}
                    </h2>

                    <p style={{ margin: '4px 0' }}>
                      {event.date_start
                        ? new Date(event.date_start).toLocaleString('fr-FR')
                        : 'Date non renseignée'}
                    </p>

                    <p style={{ margin: '4px 0' }}>
                      {event.location_name ||
                        event.venue ||
                        'Lieu non renseigné'}
                    </p>

                    <p style={{ margin: '4px 0' }}>
                      Capacité : {event.capacity ?? 'Non renseignée'}
                    </p>
                  </div>

                  <span
                    style={{
                      borderRadius: 999,
                      padding: '4px 10px',
                      background:
                        event.status === 'published'
                          ? '#dcfce7'
                          : event.status === 'draft'
                            ? '#fef3c7'
                            : '#f3f4f6',
                    }}
                  >
                    {getStatusLabel(event.status)}
                  </span>
                </div>

                <div style={{ marginTop: 16 }}>
                  <Link to={`/organisation/events/${event.id}`}>
                    Gérer l'événement
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
