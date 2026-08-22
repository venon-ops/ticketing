import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getToken, getUser } from '../services/api';

type Organization = {
  id: string;
  name: string;
  description?: string | null;
};

type Artist = {
  id: string;
  stage_name: string;
  bio?: string | null;
};

type EventArtist = {
  id: string;
  slot_start?: string | null;
  slot_end?: string | null;
  notes?: string | null;
  artist: Artist | null;
};

type TicketPhase = {
  id: string;
  name: string;
  price_cents: number;
  quantity_total?: number;
  quantity_sold?: number;
  sale_start_at?: string | null;
  sale_end_at?: string | null;
};

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
  organization?: Organization | null;
  artists?: EventArtist[];
};

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(priceCents / 100);
}

export default function PublicEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [ticketPhases, setTicketPhases] = useState<TicketPhase[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reservationError, setReservationError] = useState('');
  const [reservationSuccess, setReservationSuccess] = useState('');
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setError('Événement introuvable.');
      setLoading(false);
      return;
    }

    async function loadEvent() {
      setLoading(true);
      setError('');

      try {
        const [eventResponse, ticketsResponse] = await Promise.all([
          fetch(`http://localhost:3000/events/public/${eventId}`),
          fetch(`http://localhost:3000/ticket-phases/public/${eventId}`),
        ]);

        const eventData = await eventResponse.json();
        const ticketsData = await ticketsResponse.json();

        if (!eventResponse.ok) {
          throw new Error(eventData.message || 'Événement introuvable.');
        }

        if (!ticketsResponse.ok) {
          throw new Error(
            ticketsData.message || 'Impossible de charger les billets.',
          );
        }

        const phases = Array.isArray(ticketsData) ? ticketsData : [];

        setEvent(eventData);
        setTicketPhases(phases);

        if (phases.length > 0) {
          setSelectedPhaseId(phases[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Impossible de charger cet événement.');
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  const selectedPhase = useMemo(
    () => ticketPhases.find((phase) => phase.id === selectedPhaseId) || null,
    [ticketPhases, selectedPhaseId],
  );

  const totalPriceCents = selectedPhase
    ? selectedPhase.price_cents * quantity
    : 0;

  async function handleReservation() {
    if (!eventId || !selectedPhase) {
      setReservationError('Sélectionne un type de billet.');
      return;
    }

    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      navigate('/login');
      return;
    }

    setIsReserving(true);
    setReservationError('');
    setReservationSuccess('');

    try {
      const response = await fetch('http://localhost:3000/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          ticket_phase_id: selectedPhase.id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Impossible de créer votre réservation.',
        );
      }

      setReservationSuccess('Réservation confirmée. Redirection vers vos billets…');

      window.setTimeout(() => {
        navigate('/my-tickets');
      }, 900);
    } catch (err: any) {
      setReservationError(
        err.message || 'Une erreur est survenue lors de la réservation.',
      );
    } finally {
      setIsReserving(false);
    }
  }

  if (loading) {
    return <main style={{ padding: 20 }}>Chargement…</main>;
  }

  if (error || !event) {
    return (
      <main style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
        <p style={{ color: 'red' }}>{error || 'Événement introuvable.'}</p>
        <Link to="/upcoming">← Retour aux événements</Link>
      </main>
    );
  }

  const dateText = new Date(event.date_start).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main style={{ maxWidth: 960, margin: '32px auto', padding: 20 }}>
      <Link to="/upcoming">← Retour aux événements</Link>

      <section style={{ marginTop: 20 }}>
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.name}
            style={{
              display: 'block',
              width: '100%',
              height: 360,
              objectFit: 'cover',
              borderRadius: 16,
            }}
          />
        ) : (
          <div
            style={{
              height: 300,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 16,
              background: '#f0f0f0',
            }}
          >
            Aucune image disponible
          </div>
        )}

        <p style={{ marginTop: 24, marginBottom: 8, color: '#555' }}>
          {dateText}
        </p>

        <h1 style={{ marginTop: 0 }}>{event.name}</h1>

        <p style={{ fontSize: 18 }}>
          📍 {event.location_name || event.venue || 'Lieu à confirmer'}
          {event.address ? ` — ${event.address}` : ''}
        </p>

        {event.description && (
          <section style={{ marginTop: 24 }}>
            <h2>À propos</h2>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {event.description}
            </p>
          </section>
        )}

        {event.organization && (
          <section style={{ marginTop: 24 }}>
            <h2>Organisé par</h2>
            <p style={{ marginBottom: 4 }}>{event.organization.name}</p>

            {event.organization.description && (
              <p style={{ marginTop: 0, color: '#555' }}>
                {event.organization.description}
              </p>
            )}
          </section>
        )}

        {event.artists && event.artists.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2>Artistes</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              {event.artists.map((eventArtist) => (
                <article
                  key={eventArtist.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <h3 style={{ margin: '0 0 6px' }}>
                    {eventArtist.artist?.stage_name || 'Artiste'}
                  </h3>

                  {eventArtist.slot_start && (
                    <p style={{ margin: '4px 0' }}>
                      Début :{' '}
                      {new Date(eventArtist.slot_start).toLocaleString(
                        'fr-FR',
                      )}
                    </p>
                  )}

                  {eventArtist.slot_end && (
                    <p style={{ margin: '4px 0' }}>
                      Fin :{' '}
                      {new Date(eventArtist.slot_end).toLocaleString('fr-FR')}
                    </p>
                  )}

                  {eventArtist.notes && (
                    <p style={{ margin: '8px 0 0' }}>{eventArtist.notes}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section
          style={{
            marginTop: 32,
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Billets</h2>

          {ticketPhases.length === 0 ? (
            <p>Aucun billet n’est disponible pour le moment.</p>
          ) : (
            <>
              <div style={{ display: 'grid', gap: 12 }}>
                {ticketPhases.map((phase) => {
                  const isSelected = phase.id === selectedPhaseId;

                  return (
                    <label
                      key={phase.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                        cursor: 'pointer',
                        border: isSelected
                          ? '2px solid #222'
                          : '1px solid #eee',
                        borderRadius: 10,
                        padding: 14,
                        background: isSelected ? '#f8f8f8' : '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input
                          type="radio"
                          name="ticket-phase"
                          checked={isSelected}
                          onChange={() => setSelectedPhaseId(phase.id)}
                        />

                        <div>
                          <h3 style={{ margin: '0 0 4px' }}>{phase.name}</h3>

                          {phase.sale_start_at && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 14,
                                color: '#555',
                              }}
                            >
                              Vente à partir du{' '}
                              {new Date(
                                phase.sale_start_at,
                              ).toLocaleString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>

                      <strong>{formatPrice(phase.price_cents)}</strong>
                    </label>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: '1px solid #eee',
                }}
              >
                <label style={{ display: 'grid', gap: 6 }}>
                  Quantité
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(inputEvent) => {
                      const nextQuantity = Number(inputEvent.target.value);
                      setQuantity(
                        Number.isInteger(nextQuantity) && nextQuantity > 0
                          ? Math.min(nextQuantity, 10)
                          : 1,
                      );
                    }}
                    style={{ width: 90, padding: 8 }}
                  />
                </label>

                <div>
                  <p style={{ margin: '0 0 4px', color: '#555' }}>Total</p>
                  <strong style={{ fontSize: 22 }}>
                    {formatPrice(totalPriceCents)}
                  </strong>
                </div>
              </div>

              {reservationError && (
                <p style={{ marginTop: 16, color: 'red' }}>
                  {reservationError}
                </p>
              )}

              {reservationSuccess && (
                <p style={{ marginTop: 16, color: 'green' }}>
                  {reservationSuccess}
                </p>
              )}

              <button
                type="button"
                onClick={handleReservation}
                disabled={isReserving || !selectedPhase}
                style={{ marginTop: 20 }}
              >
                {isReserving
                  ? 'Réservation en cours…'
                  : `Réserver pour ${formatPrice(totalPriceCents)}`}
              </button>
            </>
          )}
        </section>
      </section>
    </main>
  );
}