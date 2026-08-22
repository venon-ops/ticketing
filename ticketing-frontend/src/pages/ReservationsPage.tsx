import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken } from '../services/api';

type EventInfo = {
  id: string;
  name: string;
  date_start: string;
  location_name?: string | null;
  venue?: string | null;
  image_url?: string | null;
};

type Ticket = {
  id: string;
  event_id: string;
  status: string;
  created_at: string;
  events?: EventInfo | null;
};

function formatEventDate(date: string) {
  return new Date(date).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReservationsPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMyTickets() {
      const token = getToken();

      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch('http://localhost:3000/tickets/mine', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Impossible de charger vos billets.');
        }

        setTickets(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Impossible de charger vos billets.');
      } finally {
        setLoading(false);
      }
    }

    loadMyTickets();
  }, [navigate]);

  const events = useMemo(() => {
    const uniqueEvents = new Map<string, EventInfo>();

    for (const ticket of tickets) {
      const event = ticket.events;

      if (event && !uniqueEvents.has(event.id)) {
        uniqueEvents.set(event.id, event);
      }
    }

    return Array.from(uniqueEvents.values()).sort(
      (first, second) =>
        new Date(first.date_start).getTime() -
        new Date(second.date_start).getTime(),
    );
  }, [tickets]);

  if (loading) {
    return <main style={{ padding: 20 }}>Chargement de vos billets…</main>;
  }

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: 20 }}>
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
          <p style={{ margin: '0 0 6px', color: '#555' }}>Espace client</p>
          <h1 style={{ margin: 0 }}>Mes billets</h1>
        </div>

        <Link to="/upcoming">
          <button type="button">Voir les événements</button>
        </Link>
      </header>

      {error && (
        <p
          style={{
            padding: 12,
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#b91c1c',
            background: '#fef2f2',
          }}
        >
          {error}
        </p>
      )}

      {events.length === 0 ? (
        <section
          style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Aucun billet pour le moment</h2>
          <p>Découvrez les événements à venir et réservez vos places.</p>

          <Link to="/upcoming">
            <button type="button">Découvrir les événements</button>
          </Link>
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 16 }}>
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/my-tickets/${event.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: event.image_url
                  ? '180px minmax(0, 1fr)'
                  : 'minmax(0, 1fr)',
                color: 'inherit',
                textDecoration: 'none',
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
                    display: 'block',
                    height: '100%',
                    minHeight: 160,
                    width: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}

              <article style={{ padding: 18 }}>
                <p style={{ margin: '0 0 8px', color: '#555' }}>
                  {formatEventDate(event.date_start)}
                </p>

                <h2 style={{ margin: '0 0 8px' }}>{event.name}</h2>

                <p style={{ margin: 0 }}>
                  📍 {event.location_name || event.venue || 'Lieu à confirmer'}
                </p>

                <p style={{ margin: '16px 0 0', color: '#555' }}>
                  Voir mes billets →
                </p>
              </article>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
