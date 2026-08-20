import { useEffect, useState } from 'react';
import axios from 'axios';

type Place = {
  id: string;
  name: string;
  date: string;
  price: string;
  capacity: number;
  reserved: number;
};

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState('');
  const [reserving, setReserving] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    axios
      .get<Place[]>('http://localhost:3000/places', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPlaces(res.data))
      .catch(() => setError('Impossible de charger les places'));
  }, []);

  async function handleReserve(placeId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Non connecté');
      return;
    }

    setReserving(placeId);
    setError('');

    try {
      await axios.post(
        `http://localhost:3000/places/${placeId}/reserve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Recharger la liste pour voir les places mises à jour
      const res = await axios.get<Place[]>('http://localhost:3000/places', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaces(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Échec de la réservation');
    } finally {
      setReserving(null);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '20px auto' }}>
      <h1>Places disponibles</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {places.length === 0 ? (
        <p>Aucune place pour le moment.</p>
      ) : (
        <ul>
          {places.map((p) => (
            <li key={p.id} style={{ marginBottom: 10 }}>
              <strong>{p.name}</strong> – {new Date(p.date).toLocaleString()} –{' '}
              {p.price} € ({p.reserved}/{p.capacity} réservées)
              <button
                onClick={() => handleReserve(p.id)}
                disabled={reserving === p.id || p.reserved >= p.capacity}
                style={{ marginLeft: 10 }}
              >
                {reserving === p.id ? 'Réservation...' : 'Réserver'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}