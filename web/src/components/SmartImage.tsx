import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { MaterialKey } from '../types/data_type';
import { MATERIALS } from '../utils/format';

/** Gambar dengan cadangan berwarna sesuai bahan bila URL kosong atau gagal dimuat. */
export default function SmartImage({ src, alt, material, className = '' }: {
  src: string | null | undefined; alt: string; material?: MaterialKey; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const m = material ? MATERIALS[material] : null;

  if (!src || failed) {
    return (
      <div className={`img-fallback ${className}`} style={m ? { background: m.tint, color: m.color } : undefined} role="img" aria-label={alt}>
        <ImageOff size={26} />
        {m && <span>{m.label}</span>}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
