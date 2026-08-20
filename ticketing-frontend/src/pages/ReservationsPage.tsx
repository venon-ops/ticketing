import { useEffect, useState } from 'react';
import axios from 'axios';

type Reservation = {
  id: string;
  place: {
    id: string;
    name: string;
    date: string;
  };
  status: string;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    axios
      .get<Reservation[]>('http://localhost:3000/reservations/mine', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReservations(res.data))
      .catch(() => setError('Impossible de charger les réservations'));
  }, []);

  async function handleCancel(reservationId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Non connecté');
      return;
    }

    setCancelling(reservationId);
    setError('');

    try {
      await axios.post(
        `http://localhost:3000/reservations/${reservationId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Recharger la liste
      const res = await axios.get<Reservation[]>('http://localhost:3000/reservations/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Échec de l’annulation');
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '20px auto' }}>
      <h1>Mes réservations</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {reservations.length === 0 ? (
        <p>Aucune réservation.</p>
      ) : (
        <ul>
          {reservations.map((r) => (
            <li key={r.id} style={{ marginBottom: 10 }}>
              {r.place.name} – {new Date(r.place.date).toLocaleString()} –{' '}
              {r.status}
              {r.status !== 'cancelled' && (
                <button
                  onClick={() => handleCancel(r.id)}
                  disabled={cancelling === r.id}
                  style={{ marginLeft: 10 }}
                >
                  {cancelling === r.id ? 'Annulation...' : 'Annuler'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}