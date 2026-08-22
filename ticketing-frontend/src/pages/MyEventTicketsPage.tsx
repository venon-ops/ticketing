import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getToken } from '../services/api';

type EventInfo = {
  id: string;
  name: string;
  date_start: string;
  location_name?: string | null;
  venue?: string | null;
  address?: string | null;
  image_url?: string | null;
};

type TicketPhase = {
  id: string;
  name: string;
  price_cents: number;
};

type Ticket = {
  id: string;
  status: 'active' | 'listed_for_resale' | 'transferring' | 'used' | 'cancelled';
  qr_token: string;
  created_at: string;
  ticket_phases?: TicketPhase | null;
  events?: EventInfo | null;
};

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(priceCents / 100);
}

function getStatusLabel(status: Ticket['status']) {
  if (status === 'active') return 'Valide';
  if (status === 'listed_for_resale') return 'En revente';
  if (status === 'transferring') return 'Transfert en cours';
  if (status === 'used') return 'Utilisé';
  if (status === 'cancelled') return 'Annulé';
  return status;
}

export default function MyEventTicketsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEventTickets() {
      const token = getToken();

      if (!token) {
        navigate('/login');
        return;
      }

      if (!eventId) {
        setError('Événement introuvable.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `http://localhost:3000/tickets/event/${eventId}/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

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

    loadEventTickets();
  }, [eventId, navigate]);

  if (loading) {
    return <main style={{ padding: 20 }}>Chargement de vos billets…</main>;
  }

  const event = tickets[0]?.events || null;

  return (
    <main style={{ maxWidth: 900, margin: '32px auto', padding: 20 }}>
      <Link to="/my-tickets">← Retour à mes billets</Link>

      {error && (
        <p
          style={{
            marginTop: 20,
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

      {!error && event && (
        <>
          <header style={{ marginTop: 20, marginBottom: 24 }}>
            <p style={{ margin: '0 0 8px', color: '#555' }}>
              {new Date(event.date_start).toLocaleString('fr-FR')}
            </p>

            <h1 style={{ margin: '0 0 8px' }}>{event.name}</h1>

            <p style={{ margin: 0 }}>
              📍 {event.location_name || event.venue || 'Lieu à confirmer'}
            </p>
          </header>

          <section style={{ display: 'grid', gap: 16 }}>
            {tickets.map((ticket, index) => (
              <article
                key={ticket.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 150px',
                  gap: 16,
                  alignItems: 'center',
                  border: '1px solid #ddd',
                  borderRadius: 14,
                  padding: 18,
                }}
              >
                <div>
                  <p style={{ margin: '0 0 6px', color: '#555' }}>
                    Billet {index + 1}
                  </p>

                  <h2 style={{ margin: '0 0 8px', fontSize: 21 }}>
                    {ticket.ticket_phases?.name || 'Billet'}
                  </h2>

                  <p style={{ margin: '4px 0' }}>
                    Prix :{' '}
                    {ticket.ticket_phases
                      ? formatPrice(ticket.ticket_phases.price_cents)
                      : 'Non renseigné'}
                  </p>

                  <p style={{ margin: '4px 0' }}>
                    Statut : {getStatusLabel(ticket.status)}
                  </p>

                  <p style={{ margin: '12px 0 0', fontSize: 13, color: '#666' }}>
                    Référence : {ticket.id}
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    minHeight: 150,
                    border: '1px dashed #888',
                    borderRadius: 10,
                    padding: 10,
                    textAlign: 'center',
                    background: '#fafafa',
                    fontSize: 12,
                    wordBreak: 'break-all',
                  }}
                >
                  QR Code
                  <br />
                  <span style={{ marginTop: 8 }}>{ticket.qr_token}</span>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
