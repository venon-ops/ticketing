import { useEffect, useState } from 'react';

type ArtistProfile = {
  id: string;
  user_id: string;
  stage_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
};

type Post = {
  id: string;
  artist_id: string;
  title: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  created_at: string;
};

type Place = {
  id: string;
  name: string;
  date: string;
  starts_at?: string | null;
  ends_at?: string | null;
  price: number;
  capacity: number;
  reserved: number;
};

type EventAnnouncement = {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  published_at: string;
};

type EventShare = {
  id: string;
  message?: string | null;
  shared_at: string;
  place: Place;
  announcement: EventAnnouncement;
};

type ScheduledEvent = {
  id: string;
  name: string;
  date: string;
  starts_at?: string | null;
  ends_at?: string | null;
  price: number;
  capacity: number;
  reserved: number;
  event_artists?: Array<{
    artist?: {
      id: string;
      stage_name: string;
      avatar_url?: string | null;
    } | null;
  }>;
};

export default function ArtistProfilePage() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [eventShares, setEventShares] = useState<EventShare[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [shareMessages, setShareMessages] = useState<Record<string, string>>(
    {},
  );
  const [sharingPlaceId, setSharingPlaceId] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stageName, setStageName] = useState('');
  const [bio, setBio] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setError('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Non connecté');
        return;
      }

      const res = await fetch('http://localhost:3000/artists/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur chargement profil');
      }

      const data: ArtistProfile = await res.json();

      setProfile(data);
      setStageName(data.stage_name || '');
      setBio(data.bio || '');

      const [postsRes, placesRes, sharesRes] = await Promise.all([
        fetch(`http://localhost:3000/artists/${data.id}/posts`),
        fetch('http://localhost:3000/places'),
        fetch(`http://localhost:3000/places/${data.id}/event-shares`),
      ]);

      if (postsRes.ok) {
        const postsData: Post[] = await postsRes.json();
        setPosts(postsData);
      }

      if (placesRes.ok) {
        const placesData: ScheduledEvent[] = await placesRes.json();

        const eventsForThisArtist = placesData.filter((place) =>
          place.event_artists?.some(
            (eventArtist) => eventArtist.artist?.id === data.id,
          ),
        );

        setScheduledEvents(eventsForThisArtist);
      }

      if (sharesRes.ok) {
        const sharesData: EventShare[] = await sharesRes.json();
        setEventShares(sharesData);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur chargement profil');
    }
  }

  function formatEventSchedule(place: ScheduledEvent) {
    const dateToUse = place.starts_at || place.date;

    const formattedDate = new Date(dateToUse).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    if (!place.starts_at) {
      return formattedDate;
    }

    const startTime = new Date(place.starts_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!place.ends_at) {
      return `${formattedDate} — ${startTime}`;
    }

    const endTime = new Date(place.ends_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${formattedDate} — ${startTime} → ${endTime}`;
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Non connecté');
        return;
      }

      const res = await fetch('http://localhost:3000/artists/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stage_name: stageName,
          bio,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur mise à jour profil');
      }

      setSuccess('Profil mis à jour');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Erreur mise à jour profil');
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      if (!token || !profile) {
        setError('Non connecté ou profil non chargé');
        return;
      }

      const res = await fetch(
        `http://localhost:3000/artists/${profile.id}/posts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: postTitle,
            content: postContent,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur création post');
      }

      setSuccess('Post créé');
      setPostTitle('');
      setPostContent('');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Erreur création post');
    }
  }

  async function handleShareEvent(placeId: string) {
    setError('');
    setSuccess('');
    setSharingPlaceId(placeId);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Non connecté');
        return;
      }

      const res = await fetch(`http://localhost:3000/places/${placeId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: shareMessages[placeId] || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Impossible de repartager cet événement');
      }

      setShareMessages((current) => ({
        ...current,
        [placeId]: '',
      }));

      setSuccess('Événement repartagé sur votre profil');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Impossible de repartager cet événement');
    } finally {
      setSharingPlaceId(null);
    }
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto' }}>
        <h1>Profil artiste</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p>Chargement...</p>
      </div>
    );
  }

  const sharedPlaceIds = new Set(
    eventShares.map((eventShare) => eventShare.place?.id),
  );

  return (
    <div style={{ maxWidth: 700, margin: '40px auto' }}>
      <h1>Profil artiste</h1>

      <section style={{ marginBottom: 30 }}>
        <h2>Mon profil</h2>

        <p>
          <strong>Nom de scène :</strong> {profile.stage_name}
        </p>

        <p>
          <strong>Bio :</strong> {profile.bio || '—'}
        </p>

        <form onSubmit={handleUpdateProfile} style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 10 }}>
            <label>
              Nom de scène
              <input
                type="text"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                required
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>
              Bio
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <button type="submit">Mettre à jour le profil</button>
        </form>
      </section>

      <section style={{ marginBottom: 30 }}>
        <h2>Mes événements programmés</h2>

        {scheduledEvents.length === 0 ? (
          <p>Vous n’êtes programmé sur aucun événement pour le moment.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {scheduledEvents.map((place) => {
              const alreadyShared = sharedPlaceIds.has(place.id);

              return (
                <article
                  key={place.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <h3 style={{ margin: '0 0 8px' }}>{place.name}</h3>

                  <p style={{ margin: '0 0 12px' }}>
                    <strong>Date et horaire :</strong>{' '}
                    {formatEventSchedule(place)}
                  </p>

                  {alreadyShared ? (
                    <p style={{ color: 'green', margin: 0 }}>
                      ✓ Vous avez déjà repartagé cet événement.
                    </p>
                  ) : (
                    <>
                      <label style={{ display: 'block', marginBottom: 10 }}>
                        Ajouter un message personnel (facultatif)
                        <textarea
                          value={shareMessages[place.id] || ''}
                          onChange={(e) =>
                            setShareMessages((current) => ({
                              ...current,
                              [place.id]: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Ex. Très heureux de vous retrouver sur scène !"
                          style={{ width: '100%', marginTop: 4 }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleShareEvent(place.id)}
                        disabled={sharingPlaceId === place.id}
                      >
                        {sharingPlaceId === place.id
                          ? 'Partage en cours...'
                          : 'Repartager sur mon profil'}
                      </button>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 30 }}>
        <h2>Créer un post</h2>

        <form onSubmit={handleCreatePost}>
          <div style={{ marginBottom: 10 }}>
            <label>
              Titre
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                required
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>
              Contenu
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={4}
                required
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
          </div>

          <button type="submit">Publier</button>
        </form>
      </section>

      <section>
        <h2>Mes posts</h2>

        {posts.length === 0 && <p>Aucun post pour le moment.</p>}

        {posts.map((post) => (
          <article
            key={post.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: '0 0 6px' }}>{post.title}</h3>

            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {post.content}
            </p>

            <small style={{ color: '#666' }}>
              {new Date(post.created_at).toLocaleString('fr-FR')}
            </small>
          </article>
        ))}
      </section>

      {error && <p style={{ color: 'red', marginTop: 20 }}>{error}</p>}
      {success && <p style={{ color: 'green', marginTop: 20 }}>{success}</p>}
    </div>
  );
}