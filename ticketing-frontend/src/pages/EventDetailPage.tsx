import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken } from '../services/api';

interface Event {
  id: string;
  name: string;
  description?: string | null;
  location_name?: string | null;
  venue?: string | null;
  address?: string | null;
  date_start: string;
  date_end: string;
  capacity: number;
  image_url?: string | null;
  status: string;
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const token = getToken();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulaire
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('draft');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !eventId) {
      navigate('/organisation/dashboard');
      return;
    }

    fetch(`http://localhost:3000/events/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Impossible de charger l\'événement');
        }
        return res.json();
      })
      .then((data: Event) => {
        setEvent(data);

        setName(data.name || '');
        setDescription(data.description || '');
        setLocationName(data.location_name || '');
        setAddress(data.address || data.venue || '');
        setDateStart(data.date_start ? data.date_start.slice(0, 16) : '');
        setDateEnd(data.date_end ? data.date_end.slice(0, 16) : '');
        setCapacity(data.capacity ?? '');
        setImageUrl(data.image_url || '');
        setStatus(data.status || 'draft');
      })
      .catch((err: any) => {
        setError(err.message || 'Erreur lors du chargement');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventId, token, navigate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !eventId) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:3000/events/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          location_name: locationName || undefined,
          venue: address || undefined,
          address: address || undefined,
          date_start: dateStart,
          date_end: dateEnd,
          capacity: capacity === '' ? undefined : Number(capacity),
          image_url: imageUrl || undefined,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Impossible de mettre à jour l\'événement');
      }

      setEvent(data);
      alert('Événement mis à jour');
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour l\'événement');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Chargement…</div>;
  }

  if (error || !event) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: 'red' }}>{error || 'Événement non trouvé'}</p>
        <button onClick={() => navigate('/organisation/dashboard')}>
          Retour au dashboard
        </button>
      </div>
    );
  }

  const googleMapsSrc = address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`
    : '';

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 20 }}>
      <h1>Modifier l\'événement</h1>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Nom de l\'événement
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
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
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
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        {address && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '8px 0 4px' }}>Aperçu de la carte :</p>
            <iframe
              title="Google Maps"
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
              src={googleMapsSrc}
            />
          </div>
        )}

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
            Capacité
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
              min={1}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            URL de l\'image (optionnelle)
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Statut
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="cancelled">Annulé</option>
              <option value="done">Terminé</option>
            </select>
          </label>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>

      <div style={{ marginTop: 24 }}>
        <button onClick={() => navigate(`/organisation/events/${eventId}/artists`)}>
          Programmer des artistes
        </button>
        <button
          onClick={() => navigate(`/organisation/events/${eventId}/tickets`)}
          style={{ marginLeft: 10 }}
        >
          Gérer les billets
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/organisation/dashboard')}>
          Retour au dashboard
        </button>
      </div>
    </div>
  );
}
