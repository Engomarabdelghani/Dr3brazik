import { useRef, useState } from 'react';
import { FiUpload, FiX, FiLoader, FiImage } from 'react-icons/fi';
import { compressImage } from '../../utils/imageCompression';
import { uploadSiteImage, deleteSiteImage, sitePathFromUrl } from '../../lib/api/media';

/**
 * Drag-and-drop single-image uploader. Uploads straight to the shared
 * `site-images` storage bucket (compressed client-side first) and reports
 * back the resulting public URL — used for category images, offer banners,
 * and promo banners.
 */
export default function SingleImageUploader({
  value,
  onChange,
  folder,
  aspectClassName = 'aspect-video',
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  aspectClassName?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const previousPath = sitePathFromUrl(value);
      const { url } = await uploadSiteImage(compressed, folder);
      onChange(url);
      if (previousPath) await deleteSiteImage(previousPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    const path = sitePathFromUrl(value);
    onChange('');
    if (path) await deleteSiteImage(path);
  };

  if (value) {
    return (
      <div className={`relative rounded-2xl overflow-hidden border ${aspectClassName}`} style={{ borderColor: 'var(--color-border)' }}>
        <img src={value} alt="" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={removeImage}
          aria-label="Remove image"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
        >
          <FiX size={13} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${aspectClassName}`}
        style={{
          borderColor: dragging ? 'var(--color-gold)' : 'var(--color-border)',
          backgroundColor: dragging ? 'rgba(201,162,39,0.06)' : 'transparent',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <FiLoader className="mb-2 animate-spin" size={20} style={{ color: 'var(--color-gold)' }} />
        ) : (
          <FiUpload className="mb-2" size={20} style={{ color: 'var(--color-gold)' }} />
        )}
        <p className="text-sm font-medium px-4">{uploading ? 'Uploading…' : 'Drag & drop an image, or click to browse'}</p>
        <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
          <FiImage size={12} /> PNG, JPG, WEBP — compressed automatically
        </p>
      </div>
      {error && <p className="text-xs mt-1.5" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  );
}
