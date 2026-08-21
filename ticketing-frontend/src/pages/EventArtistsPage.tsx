import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken } from '../services/api';

interface Artist {
  id: string;
  stage_name: string;
  bio?: string | null;
}

interface EventArtist {
  id: string;
  event_id: string;
  artist_id: string;
  slot_start: string;
  slot_end: string;
  notes?: string | null;
  artist?: Artist;
}

export default function EventArtistsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const token = getToken();

  const [artists, setArtists] = useState<EventArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [artistId, setArtistId] = useState('');
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !eventId) {
      navigate('/organisation/dashboard');
      return;
    }

    fetch(`http://localhost:3000/event-artists/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Impossible de charger les artistes');
        }
        return res.json();
      })
      .then((data) => {
        setArtists(data || []);
      })
      .catch((err: any) => {
        setError(err.message || 'Erreur lors du chargement');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventId, token, navigate]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !eventId) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/event-artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          artist_id,
          slot_start,
          slot_end,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Impossible d'ajouter l'artiste");
      }

      const updated = await fetch(`http://localhost:3000/event-artists/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await updated.json();
      setArtists(json || []);

      setArtistId('');
      setSlotStart('');
      setSlotEnd('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || "Impossible d'ajouter l'artiste");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Supprimer cet artiste de l\'événement ?')) return;

    try {
      const res = await fetch(`http://localhost:3000/event-artists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Impossible de supprimer');
      }

      setArtists((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Chargement…</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <h1>Programmer des artistes</h1>

      <form onSubmit={handleAdd} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Artiste (ID)
            <input
              type="text"
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
              placeholder="colle l'ID de l'artiste"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Début du set
            <input
              type="datetime-local"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Fin du set
            <input
              type="datetime-local"
              value={slotEnd}
              onChange={(e) => setSlotEnd(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Notes (optionnelles)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Ajout...' : "Ajouter l'artiste"}
        </button>
      </form>

      <h2>Artistes programmés</h2>

      {artists.length === 0 ? (
        <p>Aucun artiste programmé pour le moment.</p>
      ) : (
        <ul>
          {artists.map((ea) => (
            <li key={ea.id} style={{ marginBottom: 12 }}>
              <strong>{ea.artist?.stage_name || 'Artiste'}</strong> –{' '}
              {new Date(ea.slot_start).toLocaleString()} au{' '}
              {new Date(ea.slot_end).toLocaleString()}
              {ea.notes && <div style={{ fontSize: 13, color: '#555' }}>{ea.notes}</div>}
              <button onClick={() => handleRemove(ea.id)} style={{ marginLeft: 8 }}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={() => navigate(`/organisation/events/${eventId}`)}>
          Retour à l'événement
        </button>
      </div>
    </div>
  );
}