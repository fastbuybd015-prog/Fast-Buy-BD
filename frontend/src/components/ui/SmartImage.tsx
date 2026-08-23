'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { FALLBACK_IMAGE } from '@/lib/images';
import { classNames } from '@/lib/format';

type SmartImageProps = Omit<ImageProps, 'onError' | 'onLoad' | 'src'> & {
  src: string;
};

/**
 * next/image with two small additions the demo needs: a skeleton while the
 * remote photo loads, and a graceful swap to a fallback photo on error.
 */
export function SmartImage({ src, alt, className, ...props }: SmartImageProps) {
  const [source, setSource] = useState(src);
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      src={source}
      alt={alt}
      className={classNames(
        'transition-opacity duration-300',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
      )}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setLoaded(true);
        if (source !== FALLBACK_IMAGE) setSource(FALLBACK_IMAGE);
      }}
    />
  );
}
