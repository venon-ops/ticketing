import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type PublicEvent = {
  id: string;
  name: string;
  description?: string | null;
  location_name?: string | null;
  venue?: string | null;
  address?: string | null;
  date_start: string;
  date_end?: string | null;
  image_url?: string | null;
};

export default function HomePage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/events/public/list')
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Impossible de charger les événements',
          );
        }

        return data;
      })
      .then((data: PublicEvent[]) => {
        setEvents(data);
      })
      .catch((err: any) => {
        setError(err.message || 'Impossible de charger les événements');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: '40px auto', padding: 20 }}>
      <section style={{ marginBottom: 32 }}>
        <p style={{ marginBottom: 8 }}>📍 Bordeaux</p>
        <h1 style={{ margin: 0 }}>Événements à venir</h1>
        <p>Découvre les soirées, concerts et festivals près de Bordeaux.</p>
      </section>

      {loading && <p>Chargement des événements…</p>}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && events.length === 0 && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2>Aucun événement à venir</h2>
          <p>
            Aucun événement publié n’est disponible pour le moment. Reviens
            bientôt.
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                border: '1px solid #ddd',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.name}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 180,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#f0f0f0',
                  }}
                >
                  Aucune image
                </div>
              )}

              <div style={{ padding: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14 }}>
                  {new Date(event.date_start).toLocaleString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
                  {event.name}
                </h2>

                <p style={{ margin: 0 }}>
                  {event.location_name || event.venue || 'Lieu à confirmer'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}