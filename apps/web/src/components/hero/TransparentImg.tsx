'use client';

import { useEffect, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  /** Brightness threshold (0–255). Pixels darker than this become transparent. Default 45. */
  threshold?: number;
}

/**
 * Loads an image in a <canvas>, removes near-black pixels (from AI-generated black
 * mat backgrounds), and renders the result as a transparent PNG.
 * Safe to use: images in /public are same-origin so no CORS needed.
 */
export function TransparentImg({ src, alt, className = '', threshold = 45 }: Props) {
  const [processed, setProcessed] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();

    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setErrored(true); return; }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;

      for (let i = 0; i < d.length; i += 4) {
        const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (brightness < threshold) {
          // Soft fade at the boundary so edges don't look clipped
          d[i + 3] = Math.round((brightness / threshold) * d[i + 3]);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      if (!cancelled) setProcessed(canvas.toDataURL('image/png'));
    };

    img.onerror = () => { if (!cancelled) setErrored(true); };
    img.src = src;

    return () => { cancelled = true; };
  }, [src, threshold]);

  if (errored) {
    /* Fallback: just render normally — black bg is better than nothing */
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }

  if (!processed) {
    /* Invisible placeholder preserves layout during canvas processing */
    return <div className={`${className} invisible`} aria-hidden />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={processed} alt={alt} className={className} />;
}
