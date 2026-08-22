import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../services/api';

export default function CreateEventPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = getToken();

    if (!token) {
      setError('Non autorisé');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          location_name: venue,
          venue,
          address,
          date_start: dateStart,
          date_end: dateEnd,
          capacity: Number(capacity),
          image_url: imageUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Impossible de créer l'événement");
      }

      navigate(`/organisation/events/${data.id}/tickets`);
    } catch (err: any) {
      setError(err.message || "Impossible de créer l'événement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h1>Créer un événement</h1>

      <p>
        Étape 1 sur 2 : renseigne les informations de la soirée. Après
        sauvegarde, tu passeras à la création des phases de billets.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Nom de l'événement
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Nom du lieu
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              placeholder="Ex. Le Rex Club"
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Adresse du lieu
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Ex. 5 boulevard Poissonnière, 75002 Paris"
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Date et heure de début
            <input
              type="datetime-local"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Date et heure de fin
            <input
              type="datetime-local"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
  <label>
    Capacité totale de l'événement
    <input
      type="number"
      inputMode="numeric"
      value={capacity}
      onKeyDown={(e) => {
        if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
          e.preventDefault();
        }
      }}
      onChange={(e) => {
        const value = e.target.value;

        if (value === '') {
          setCapacity('');
          return;
        }

        if (/^\d+$/.test(value)) {
          setCapacity(Number(value));
        }
      }}
      min={1}
      step={1}
      required
      placeholder="Ex. 200"
      style={{ width: '100%', marginTop: 4 }}
    />
  </label>
</div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? 'Création...'
            : 'Continuer vers la gestion des billets'}
        </button>
      </form>
    </div>
  );
}