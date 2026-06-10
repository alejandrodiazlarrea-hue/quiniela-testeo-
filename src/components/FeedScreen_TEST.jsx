import { useState, useEffect } from "react";
import { C, card, sec, btn } from "./ui.jsx";
import { JerseyAvatar } from "./JerseyAvatar.jsx";

const SUPA_URL = "https://jvynsghhzlwhdroawaty.supabase.co";
const SUPA_KEY = "sb_publishable_XNKKGb3UeBObJ35g3ZqcWA_tX7ZlteT";

const uploadImage = async (file) => {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}.${ext}`;
  const res = await fetch(`${SUPA_URL}/storage/v1/object/feed-images/${fileName}`, {
    method: "POST",
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
  return `${SUPA_URL}/storage/v1/object/public/feed-images/${fileName}`;
};

const getPosts = async () => {
  const res = await fetch(`${SUPA_URL}/rest/v1/feed_posts?select=id,participant_id,content,image_url,created_at&order=created_at.desc`, {
    headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
  });
  return res.json();
};

const createPost = async (participantId, content, imageUrl) => {
  await fetch(`${SUPA_URL}/rest/v1/feed_posts`, {
    method: "POST",
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ participant_id: participantId, content, image_url: imageUrl }),
  });
};

const deletePost = async (id) => {
  await fetch(`${SUPA_URL}/rest/v1/feed_posts?id=eq.${id}`, {
    method: "DELETE",
    headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
  });
};

const formatTime = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Ahora";
  if (m < 60) return `Hace ${m}m`;
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${d}d`;
};

export const FeedScreen = ({ participant, participants, isAdmin, onBadgeEarned }) => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    getPosts().then(p => { setPosts(p || []); setLoading(false); });
    const interval = setInterval(() => getPosts().then(p => setPosts(p || [])), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!participant) return;
    if (!content.trim() && !imageFile) return;
    setUploading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      await createPost(participant.id, content.trim(), imageUrl);
      const updated = await getPosts();
      setPosts(updated || []);
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      // Check for photo badges
      const myPosts = (updated || []).filter(p => p.participant_id === participant.id);
      if (onBadgeEarned) onBadgeEarned(myPosts.length);
    } catch (e) {
      console.error(e);
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    await deletePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setConfirmDelete(null);
  };

  const getParticipant = (id) => participants.find(p => p.id === id);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>
        📸 <span style={{ color: C.red }}>Feed</span>
      </div>

      {/* Post composer */}
      {participant && (
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <JerseyAvatar number={participant.avatar_number || 10} size={44}/>
            <div style={{ flex: 1 }}>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="¿Qué está pasando en el Mundial?"
                style={{
                  width: "100%", background: "#0f3460", border: "1px solid #444",
                  borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 14,
                  outline: "none", resize: "none", minHeight: 80, boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
              {imagePreview && (
                <div style={{ position: "relative", marginTop: 8 }}>
                  <img src={imagePreview} style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }}/>
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                <label style={{ cursor: "pointer", background: "transparent", border: "1px solid #444", color: "#888", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                  📷 Foto
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange}/>
                </label>
                <button style={{ ...btn(), marginLeft: "auto", opacity: (!content.trim() && !imageFile) ? 0.5 : 1 }}
                  onClick={handlePost} disabled={uploading || (!content.trim() && !imageFile)}>
                  {uploading ? "Subiendo..." : "Publicar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#888", padding: 40 }}>Cargando feed…</div>
      ) : posts.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ color: "#888" }}>Nadie ha publicado nada aún. ¡Sé el primero!</div>
        </div>
      ) : (
        posts.map(post => {
          const author = getParticipant(post.participant_id);
          const isOwner = participant?.id === post.participant_id;
          return (
            <div key={post.id} style={{ ...card, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <JerseyAvatar number={author?.avatar_number || 10} size={40}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{author?.name || "?"}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{formatTime(post.created_at)}</div>
                </div>
                {(isOwner || isAdmin) && (
                  confirmDelete === post.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleDelete(post.id)}
                        style={{ background: "#7f1b1b", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Borrar</button>
                      <button onClick={() => setConfirmDelete(null)}
                        style={{ background: "#333", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(post.id)}
                      style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>🗑️</button>
                  )
                )}
              </div>
              {post.content && <div style={{ fontSize: 15, color: "#e8e8f0", marginBottom: post.image_url ? 12 : 0, lineHeight: 1.5 }}>{post.content}</div>}
              {post.image_url && (
                <img src={post.image_url} style={{ width: "100%", borderRadius: 8, maxHeight: 400, objectFit: "cover" }}
                  onError={e => e.target.style.display = "none"}/>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
