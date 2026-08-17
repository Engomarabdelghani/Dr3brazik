import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiInstagram, FiPlay } from 'react-icons/fi';
import { fetchSocialPosts, createSocialPost, updateSocialPost, deleteSocialPost, type SocialPostInput } from '../../lib/api/socialPosts';
import type { SocialPost } from '../../types';
import SingleImageUploader from '../components/SingleImageUploader';

export default function AdminSocialPosts() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery({ queryKey: ['admin', 'social-posts'], queryFn: fetchSocialPosts });
  const [editing, setEditing] = useState<SocialPost | 'new' | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'social-posts'] });
    queryClient.invalidateQueries({ queryKey: ['social-posts'] });
  };

  const onDelete = async (post: SocialPost) => {
    if (!confirm('Delete this post?')) return;
    await deleteSocialPost(post.id);
    invalidate();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Social Posts</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            "Follow the Ritual" video/reel gallery on the Home page. Upload a real screenshot from each video as its
            thumbnail — Instagram/TikTok don't allow auto-fetching thumbnails, so this keeps every image accurate. {posts.length} posts.
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary"><FiPlus /> Add Post</button>
      </div>

      {isLoading ? (
        <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div className="card-luxe p-10 text-center">
          <FiInstagram size={28} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Add an Instagram/TikTok link to feature it on the Home page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {posts.map((p) => (
            <div key={p.id} className="card-luxe overflow-hidden">
              <div className="relative aspect-square" style={{ backgroundColor: 'var(--color-blush)' }}>
                {p.image ? (
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center px-2">
                    <FiInstagram size={18} style={{ color: 'var(--color-gold)' }} />
                    <p className="text-[9px] font-semibold mt-1" style={{ color: '#dc2626' }}>No thumbnail — hidden from Home</p>
                  </div>
                )}
                {p.isVideo && p.image && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full">
                    <FiPlay size={11} fill="white" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[10px] font-bold" style={{ color: p.isEnabled ? '#16a34a' : 'var(--color-muted)' }}>
                  {p.isEnabled ? 'ENABLED' : 'DISABLED'} · #{p.sortOrder}
                </p>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <button onClick={() => setEditing(p)} aria-label="Edit" className="hover:text-[var(--color-gold)] transition-colors">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(p)} aria-label="Delete" className="hover:text-red-500 transition-colors">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PostModal
          post={editing === 'new' ? null : editing}
          nextSortOrder={posts.length}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
    </div>
  );
}

function PostModal({ post, nextSortOrder, onClose, onSaved }: {
  post: SocialPost | null; nextSortOrder: number; onClose: () => void; onSaved: () => void;
}) {
  const [link, setLink] = useState(post?.link ?? '');
  const [image, setImage] = useState(post?.image ?? '');
  const [isVideo, setIsVideo] = useState(post?.isVideo ?? true);
  const [sortOrder, setSortOrder] = useState(String(post?.sortOrder ?? nextSortOrder));
  const [isEnabled, setIsEnabled] = useState(post?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim()) {
      setError('Please add the Instagram/TikTok link.');
      return;
    }
    if (!image) {
      setError('Please upload a screenshot from the video as its thumbnail.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: SocialPostInput = { link: link.trim(), image, isVideo, sortOrder: Number(sortOrder) || 0, isEnabled };
      if (post) await updateSocialPost(post.id, input);
      else await createSocialPost(input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative card-luxe p-6 w-full max-w-sm bg-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold">{post ? 'Edit Post' : 'Add Post'}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            required value={link} onChange={(e) => setLink(e.target.value)}
            placeholder="Instagram/TikTok link (e.g. https://www.instagram.com/reel/...)"
            className="input-luxe"
          />

          <div>
            <label className="text-xs mb-1.5 block font-semibold" style={{ color: 'var(--color-heading)' }}>
              Video Thumbnail — required
            </label>
            <p className="text-[11px] mb-2" style={{ color: 'var(--color-muted)' }}>
              Take a screenshot of the video (open it, pause on a good frame, screenshot it) and upload that image here.
            </p>
            <SingleImageUploader value={image} onChange={setImage} folder="social-posts" aspectClassName="aspect-square" />
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Sort Order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input-luxe" />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input type="checkbox" checked={isVideo} onChange={(e) => setIsVideo(e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
            <span className="text-sm font-medium">This is a video/reel (shows a play icon)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
            <span className="text-sm font-medium">Enabled</span>
          </label>

          {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save'}</button>
        </form>
      </motion.div>
    </div>
  );
}