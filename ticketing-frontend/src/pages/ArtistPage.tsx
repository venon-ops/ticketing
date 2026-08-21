import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

type Artist = {
  id: string;
  user_id: string;
  stage_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

type Post = {
  id: string;
  title: string | null;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
};

export function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadArtistPage() {
      if (!artistId) {
        setError('Identifiant artiste manquant');
        setLoading(false);
        return;
      }

      try {
        const [artistResponse, postsResponse] = await Promise.all([
          fetch(`http://localhost:3000/artists/${artistId}`),
          fetch(`http://localhost:3000/artists/${artistId}/posts`),
        ]);

        if (!artistResponse.ok) {
          throw new Error('Artiste introuvable');
        }

        if (!postsResponse.ok) {
          throw new Error('Impossible de charger les publications');
        }

        const artistData = await artistResponse.json();
        const postsData = await postsResponse.json();

        setArtist(artistData);
        setPosts(postsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    loadArtistPage();
  }, [artistId]);

  if (loading) {
    return <p style={{ padding: 24 }}>Chargement…</p>;
  }

  if (error || !artist) {
    return (
      <div style={{ padding: 24 }}>
        <p>{error || 'Artiste introuvable'}</p>
        <Link to="/artists">Retour aux artistes</Link>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <section
        style={{
          padding: 24,
          borderRadius: 12,
          background: '#f1f1f1',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 'bold',
            marginBottom: 16,
          }}
        >
          {artist.stage_name.charAt(0).toUpperCase()}
        </div>

        <h1>{artist.stage_name}</h1>
        <p>{artist.bio || 'Aucune biographie renseignée.'}</p>
      </section>

      <section>
        <h2>Publications</h2>

        {posts.length === 0 ? (
          <p>Aucune publication pour le moment.</p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              style={{
                marginTop: 16,
                padding: 20,
                border: '1px solid #ddd',
                borderRadius: 12,
              }}
            >
              <small>
                {new Date(post.created_at).toLocaleString('fr-FR')}
              </small>

              {post.title && <h3>{post.title}</h3>}
              {post.content && <p>{post.content}</p>}

              {post.media_url && post.media_type?.startsWith('image/') && (
                <img
                  src={post.media_url}
                  alt="Publication"
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                />
              )}

              {post.media_url && post.media_type?.startsWith('video/') && (
                <video
                  src={post.media_url}
                  controls
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                />
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}