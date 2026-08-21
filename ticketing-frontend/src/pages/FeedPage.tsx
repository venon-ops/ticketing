import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Artist = {
  id: string;
  stage_name: string;
  avatar_url?: string | null;
};

type FeedPost = {
  id: string;
  artist_id: string;
  title: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  created_at: string;
  updated_at?: string;
  artist?: Artist | null;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Connecte-toi pour voir ton fil.');
        return;
      }

      const res = await fetch('http://localhost:3000/feed', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Impossible de charger le fil');
      }

      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le fil');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto' }}>
        <h1>Mon fil</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto' }}>
      <h1>Mon fil</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && posts.length === 0 && (
        <div>
          <p>Ton fil est vide pour le moment.</p>
          <p>
            Suis des artistes dans la page “Artistes” pour voir leurs
            annonces, sorties et albums ici.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {posts.map((post) => {
          const artistName = post.artist?.stage_name || 'Artiste';
          const artistInitial = artistName.charAt(0).toUpperCase();

          return (
            <article
              key={post.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <Link
                to={`/artists/${post.artist_id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: 'fit-content',
                  marginBottom: 12,
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                {post.artist?.avatar_url ? (
                  <img
                    src={post.artist.avatar_url}
                    alt={artistName}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: '#ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {artistInitial}
                  </div>
                )}

                <div>
                  <strong>{artistName}</strong>
                  <p style={{ color: '#666', fontSize: 13, margin: '3px 0 0' }}>
                    Voir le profil
                  </p>
                </div>
              </Link>

              <h2 style={{ margin: '0 0 8px' }}>{post.title}</h2>

              <p style={{ margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
                {post.content}
              </p>

              {post.media_url &&
                post.media_type?.startsWith('image/') && (
                  <img
                    src={post.media_url}
                    alt={post.title || 'Publication'}
                    style={{
                      width: '100%',
                      maxHeight: 450,
                      objectFit: 'cover',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  />
                )}

              {post.media_url &&
                post.media_type?.startsWith('video/') && (
                  <video
                    src={post.media_url}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: 450,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  />
                )}

              {post.media_url &&
                !post.media_type?.startsWith('image/') &&
                !post.media_type?.startsWith('video/') && (
                  <a
                    href={post.media_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir le média
                  </a>
                )}

              <p style={{ color: '#666', fontSize: 13, margin: '12px 0 0' }}>
                {new Date(post.created_at).toLocaleString('fr-FR')}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}