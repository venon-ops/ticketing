import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getToken } from '../services/api';

type TicketPhase = {
  id: string;
  event_id: string;
  name: string;
  price_cents: number;
  quantity_total: number;
  quantity_sold: number;
  sale_start_at: string | null;
  sale_end_at: string | null;
  is_visible: boolean;
};

type EventInfo = {
  id: string;
  name: string;
  capacity: number;
  status: string;
};

const initialForm = {
  name: '',
  price: '',
  quantity_total: '',
  sale_start_at: '',
  sale_end_at: '',
  is_visible: true,
};

function toDateTimeLocal(value: string | null) {
  return value ? value.slice(0, 16) : '';
}

export default function EventTicketsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const token = getToken();

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [phases, setPhases] = useState<TicketPhase[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [phaseToDelete, setPhaseToDelete] = useState<TicketPhase | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    if (!eventId || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const [eventResponse, phasesResponse] = await Promise.all([
        fetch(`http://localhost:3000/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`http://localhost:3000/ticket-phases/event/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const eventData = await eventResponse.json();
      const phasesData = await phasesResponse.json();

      if (!eventResponse.ok) {
        throw new Error(
          eventData.message || "Impossible de charger l'événement",
        );
      }

      if (!phasesResponse.ok) {
        throw new Error(
          phasesData.message || 'Impossible de charger les billets',
        );
      }

      setEvent(eventData);
      setPhases(phasesData);
    } catch (error: any) {
      setMessage(error.message || 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [eventId, token]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  const configuredTickets = phases.reduce(
    (total, phase) => total + phase.quantity_total,
    0,
  );

  const remainingToConfigure = event
    ? Math.max(0, Number(event.capacity) - configuredTickets)
    : 0;

  const selectedQuantity = Number(form.quantity_total || 0);

  const ticketsUsedByOtherPhases = phases
    .filter((phase) => phase.id !== editingId)
    .reduce((total, phase) => total + phase.quantity_total, 0);

  const maximumForCurrentPhase = event
    ? Math.max(0, Number(event.capacity) - ticketsUsedByOtherPhases)
    : 0;

  const quantityExceedsCapacity =
    selectedQuantity > maximumForCurrentPhase;

  async function handleSubmit(eventForm: FormEvent) {
    eventForm.preventDefault();

    if (!eventId || !token) {
      setMessage('Vous devez être connecté.');
      return;
    }

    const priceCents = Math.round(Number(form.price) * 100);
    const quantityTotal = Number(form.quantity_total);

    if (!form.name.trim()) {
      setMessage('Le nom de la phase est obligatoire.');
      return;
    }

    if (!Number.isInteger(priceCents) || priceCents < 0) {
      setMessage('Le prix est invalide.');
      return;
    }

    if (!Number.isInteger(quantityTotal) || quantityTotal < 1) {
      setMessage('Le nombre de places doit être au moins 1.');
      return;
    }

    if (quantityTotal > maximumForCurrentPhase) {
      setMessage(
        `Cette phase ne peut pas dépasser ${maximumForCurrentPhase} place(s).`,
      );
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = {
      event_id: eventId,
      name: form.name.trim(),
      price_cents: priceCents,
      quantity_total: quantityTotal,
      sale_start_at: form.sale_start_at
        ? new Date(form.sale_start_at).toISOString()
        : null,
      sale_end_at: form.sale_end_at
        ? new Date(form.sale_end_at).toISOString()
        : null,
      is_visible: form.is_visible,
    };

    try {
      const response = await fetch(
        editingId
          ? `http://localhost:3000/ticket-phases/${editingId}`
          : 'http://localhost:3000/ticket-phases',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Impossible d’enregistrer la phase',
        );
      }

      setMessage(editingId ? 'Phase modifiée.' : 'Phase créée.');
      resetForm();
      await loadData();
    } catch (error: any) {
      setMessage(error.message || 'Impossible d’enregistrer la phase');
    } finally {
      setSaving(false);
    }
  }

  function editPhase(phase: TicketPhase) {
    setEditingId(phase.id);
    setForm({
      name: phase.name,
      price: (phase.price_cents / 100).toFixed(2),
      quantity_total: String(phase.quantity_total),
      sale_start_at: toDateTimeLocal(phase.sale_start_at),
      sale_end_at: toDateTimeLocal(phase.sale_end_at),
      is_visible: phase.is_visible,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function confirmDeletePhase() {
    if (!phaseToDelete || !token) {
      return;
    }

    setDeleting(true);
    setMessage('');

    try {
      const response = await fetch(
        `http://localhost:3000/ticket-phases/${phaseToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Impossible de supprimer la phase');
      }

      setMessage('Phase supprimée.');
      setPhaseToDelete(null);
      await loadData();
    } catch (error: any) {
      setMessage(error.message || 'Impossible de supprimer la phase');
    } finally {
      setDeleting(false);
    }
  }

  async function publishEvent() {
    if (!eventId || !token) {
      setMessage('Vous devez être connecté.');
      return;
    }

    setPublishing(true);
    setMessage('');

    try {
      const response = await fetch(
        `http://localhost:3000/events/${eventId}/publish`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || "Impossible de publier l'événement",
        );
      }

      setEvent(data);
      setShowPublishModal(false);
      setMessage('Événement publié avec succès.');

      setTimeout(() => {
        navigate('/organisation/dashboard');
      }, 900);
    } catch (error: any) {
      setMessage(error.message || "Impossible de publier l'événement");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Chargement…</div>;
  }

  const visiblePhasesCount = phases.filter(
    (phase) => phase.is_visible,
  ).length;

  const isPublished = event?.status === 'published';

  const canPublish =
    visiblePhasesCount > 0 &&
    configuredTickets <= Number(event?.capacity || 0);

  const modalOverlayStyle = {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'rgba(0, 0, 0, 0.55)',
  };

  const modalStyle = {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    padding: 24,
    background: '#fff',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
  };

  return (
    <div style={{ maxWidth: 850, margin: '40px auto', padding: 20 }}>
      <Link to={`/organisation/events/${eventId}`}>
        ← Retour à l'événement
      </Link>

      <h1>Gestion des billets</h1>

      {event && (
        <section
          style={{
            background: '#f5f5f5',
            borderRadius: 8,
            padding: 16,
            marginTop: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>{event.name}</h2>
          <p>Capacité totale : {event.capacity} places</p>
          <p>Places attribuées aux phases : {configuredTickets}</p>
          <p>Places encore attribuables : {remainingToConfigure}</p>
          <p>
            Statut :{' '}
            {isPublished ? 'Publié' : 'Brouillon — non visible au public'}
          </p>
        </section>
      )}

      <p style={{ marginTop: 20 }}>
        Les quantités et les ventes sont visibles uniquement par votre
        organisation. Les utilisateurs verront seulement les phases actives et
        leurs prix.
      </p>

      {!isPublished && (
        <section
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 20,
            marginTop: 20,
          }}
        >
          <h2>{editingId ? 'Modifier une phase' : 'Créer une phase'}</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label>
                Nom de la phase
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Ex. Early, Standard, Late"
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>
                Prix en euros
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="Ex. 15.00"
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>
                Nombre de places pour cette phase
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  min="1"
                  max={maximumForCurrentPhase}
                  step="1"
                  value={form.quantity_total}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity_total: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  placeholder="Ex. 100"
                  style={{
                    width: '100%',
                    marginTop: 4,
                    borderColor: quantityExceedsCapacity ? 'red' : undefined,
                  }}
                />
              </label>

              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>
                Maximum attribuable pour cette phase :{' '}
                {maximumForCurrentPhase} place
                {maximumForCurrentPhase > 1 ? 's' : ''}.
              </p>

              {quantityExceedsCapacity && (
                <p style={{ margin: '4px 0 0', color: 'red' }}>
                  Cette phase dépasse la capacité totale disponible.
                </p>
              )}

              {maximumForCurrentPhase < 1 && !editingId && (
                <p style={{ margin: '4px 0 0', color: 'red' }}>
                  Toute la capacité de l'événement est déjà attribuée.
                </p>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>
                Début de vente — optionnel
                <input
                  type="datetime-local"
                  value={form.sale_start_at}
                  onChange={(e) =>
                    setForm({ ...form, sale_start_at: e.target.value })
                  }
                  style={{ display: 'block', marginTop: 4 }}
                />
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>
                Fin de vente — optionnel
                <input
                  type="datetime-local"
                  value={form.sale_end_at}
                  onChange={(e) =>
                    setForm({ ...form, sale_end_at: e.target.value })
                  }
                  style={{ display: 'block', marginTop: 4 }}
                />
              </label>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(e) =>
                    setForm({ ...form, is_visible: e.target.checked })
                  }
                />{' '}
                Afficher cette phase aux utilisateurs
              </label>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                maximumForCurrentPhase < 1 ||
                quantityExceedsCapacity
              }
            >
              {saving
                ? 'Enregistrement...'
                : editingId
                  ? 'Enregistrer les modifications'
                  : 'Créer la phase'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{ marginLeft: 10 }}
              >
                Annuler
              </button>
            )}
          </form>
        </section>
      )}

      {message && (
        <p
          style={{
            marginTop: 16,
            color: message.includes('Impossible') ? 'red' : 'green',
          }}
        >
          {message}
        </p>
      )}

      <section style={{ marginTop: 30 }}>
        <h2>Phases configurées</h2>

        {phases.length === 0 ? (
          <p>Aucune phase de billets créée pour le moment.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {phases.map((phase) => {
              const remaining = phase.quantity_total - phase.quantity_sold;

              return (
                <div
                  key={phase.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>{phase.name}</h3>

                  <p>Prix : {(phase.price_cents / 100).toFixed(2)} €</p>
                  <p>
                    Ventes : {phase.quantity_sold} / {phase.quantity_total}
                  </p>
                  <p>Restant : {remaining}</p>
                  <p>
                    Visibilité :{' '}
                    {phase.is_visible
                      ? 'Visible pour les utilisateurs'
                      : 'Masquée'}
                  </p>

                  {!isPublished && (
                    <>
                      <button type="button" onClick={() => editPhase(phase)}>
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhaseToDelete(phase)}
                        style={{ marginLeft: 10 }}
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!isPublished && (
        <section
          style={{
            border: '2px solid #222',
            borderRadius: 8,
            padding: 20,
            marginTop: 30,
          }}
        >
          <h2>Publication</h2>

          <p>
            Une fois publié, l'événement sera visible par les utilisateurs et
            ils pourront voir les phases actives ainsi que leurs prix.
          </p>

          <p>
            Phases visibles : {visiblePhasesCount} — Billets attribués :{' '}
            {configuredTickets} / {event?.capacity ?? 0}
          </p>

          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            disabled={publishing || !canPublish}
          >
            Publier l'événement
          </button>

          {visiblePhasesCount === 0 && (
            <p style={{ color: 'red' }}>
              Crée au moins une phase visible pour publier l'événement.
            </p>
          )}

          {configuredTickets > Number(event?.capacity || 0) && (
            <p style={{ color: 'red' }}>
              Les quotas configurés dépassent la capacité de l'événement.
            </p>
          )}
        </section>
      )}

      {showPublishModal && (
        <div
          style={modalOverlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-modal-title"
        >
          <div style={modalStyle}>
            <h2 id="publish-modal-title" style={{ marginTop: 0 }}>
              Publier cet événement ?
            </h2>

            <p>
              L'événement deviendra visible par les utilisateurs et les phases
              de billets actives pourront être consultées.
            </p>

            <div
              style={{
                background: '#f5f5f5',
                borderRadius: 8,
                padding: 12,
                margin: '16px 0',
              }}
            >
              <p style={{ margin: '0 0 6px' }}>
                Phases visibles : {visiblePhasesCount}
              </p>
              <p style={{ margin: 0 }}>
                Billets configurés : {configuredTickets} /{' '}
                {event?.capacity ?? 0}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                disabled={publishing}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={publishEvent}
                disabled={publishing}
              >
                {publishing ? 'Publication...' : 'Publier maintenant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {phaseToDelete && (
        <div
          style={modalOverlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div style={modalStyle}>
            <h2 id="delete-modal-title" style={{ marginTop: 0 }}>
              Supprimer cette phase ?
            </h2>

            <p>
              La phase « {phaseToDelete.name} » sera supprimée. Cette action
              est irréversible.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setPhaseToDelete(null)}
                disabled={deleting}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmDeletePhase}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}