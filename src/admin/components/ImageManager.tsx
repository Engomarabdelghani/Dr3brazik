import { useRef, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { FiUpload, FiX, FiLoader, FiImage } from 'react-icons/fi';
import type { ProductImage } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { uploadProductImage, deleteProductImage } from '../../lib/api/products';

export default function ImageManager({ images, onChange, folder }: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  folder: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: ProductImage[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file);
        const img = await uploadProductImage(compressed, folder);
        uploaded.push(img);
      }
      const merged = [...images, ...uploaded].map((img, i) => ({ ...img, position: i }));
      onChange(merged);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const target = images[index];
    const next = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, position: i }));
    onChange(next);
    await deleteProductImage(target.path);
  };

  const reorder = (newOrder: ProductImage[]) => {
    onChange(newOrder.map((img, i) => ({ ...img, position: i })));
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? 'var(--color-gold)' : 'var(--color-border)',
          backgroundColor: dragging ? 'rgba(201,162,39,0.06)' : 'transparent',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <FiLoader className="mx-auto mb-2 animate-spin" size={22} style={{ color: 'var(--color-gold)' }} />
        ) : (
          <FiUpload className="mx-auto mb-2" size={22} style={{ color: 'var(--color-gold)' }} />
        )}
        <p className="text-sm font-medium">{uploading ? 'Uploading…' : 'Drag & drop images, or click to browse'}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>PNG, JPG, WEBP — multiple files supported, compressed automatically</p>
      </div>

      {images.length > 0 && (
        <Reorder.Group
          axis="x"
          values={images}
          onReorder={reorder}
          className="flex flex-wrap gap-3 mt-4"
        >
          {images.map((img, i) => (
            <Reorder.Item
              key={img.url}
              value={img}
              as="div"
              className="relative w-24 h-24 rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing"
              style={{ borderColor: 'var(--color-border)' }}
              whileDrag={{ scale: 1.05, zIndex: 10 }}
            >
              <img src={img.url} alt={`Product image ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/90" style={{ color: 'var(--color-gold)' }}>
                  MAIN
                </span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                aria-label="Remove image"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <FiX size={11} />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {images.length === 0 && !uploading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
          <FiImage size={14} /> No images yet — the first one you add becomes the main product photo.
        </motion.div>
      )}
    </div>
  );
}
