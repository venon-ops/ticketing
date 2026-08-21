import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Artist = {
  id: string;
  user_id: string;
  stage_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
};

type Follow = {
  artist: Artist;
};

type StoredUser = {
  id: string;
  email: string;
  role?: string;
};

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingArtistId, setChangingArtistId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const currentUser: StoredUser | null = storedUser
        ? JSON.parse(storedUser)
        : null;

      const artistsRes = await fetch('http://localhost:3000/artists');

      if (!artistsRes.ok) {
        throw new Error('Impossible de charger les artistes');
      }

      const artistsData: Artist[] = await artistsRes.json();

      setArtists(
        currentUser
          ? artistsData.filter((artist) => artist.user_id !== currentUser.id)
          : artistsData,
      );

      if (token) {
        const followsRes = await fetch('http://localhost:3000/follows', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (followsRes.ok) {
          const followsData: Follow[] = await followsRes.json();

          setFollowedArtistIds(
            followsData
              .map((follow) => follow.artist?.id)
              .filter((id): id is string => Boolean(id)),
          );
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow(artistId: string) {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Connecte-toi pour suivre un artiste');
      return;
    }

    const isFollowing = followedArtistIds.includes(artistId);
    setChangingArtistId(artistId);
    setError('');

    try {
      const res = await fetch(`http://localhost:3000/follows/${artistId}`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Impossible de modifier l’abonnement');
      }

      setFollowedArtistIds((current) =>
        isFollowing
          ? current.filter((id) => id !== artistId)
          : [...current, artistId],
      );
    } catch (err: any) {
      setError(err.message || 'Impossible de modifier l’abonnement');
    } finally {
      setChangingArtistId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto' }}>
        <h1>Découvrir les artistes</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto' }}>
      <h1>Découvrir les artistes</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {artists.length === 0 ? (
        <p>Aucun autre artiste disponible pour le moment.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {artists.map((artist) => {
            const isFollowing = followedArtistIds.includes(artist.id);

            return (
              <article
                key={artist.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <Link
                  to={`/artists/${artist.id}`}
                  style={{
                    flex: 1,
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <div>
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt={artist.stage_name}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          float: 'left',
                          marginRight: 12,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: '#ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          float: 'left',
                          marginRight: 12,
                        }}
                      >
                        {artist.stage_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <h2 style={{ margin: '0 0 6px' }}>{artist.stage_name}</h2>
                    <p style={{ margin: 0 }}>
                      {artist.bio || 'Aucune bio pour le moment.'}
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleFollow(artist.id)}
                  disabled={changingArtistId === artist.id}
                >
                  {changingArtistId === artist.id
                    ? 'Mise à jour...'
                    : isFollowing
                      ? 'Ne plus suivre'
                      : 'Suivre'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}