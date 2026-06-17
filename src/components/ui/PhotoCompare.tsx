import React, { useState, useRef, useEffect } from 'react';
import type { OrderPhoto } from '../../types';

interface PhotoCompareProps {
  beforePhoto?: OrderPhoto;
  afterPhoto?: OrderPhoto;
  beforeImage?: OrderPhoto;
  afterImage?: OrderPhoto;
  className?: string;
}

export const PhotoCompare: React.FC<PhotoCompareProps> = ({
  beforePhoto,
  afterPhoto,
  beforeImage,
  afterImage,
  className,
}) => {
  const before = beforePhoto || beforeImage;
  const after = afterPhoto || afterImage;
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  if (!before && !after) {
    return (
      <div className={`flex items-center justify-center h-64 bg-neutral-100 rounded-xl ${className}`}>
        <p className="text-neutral-400">暂无照片</p>
      </div>
    );
  }

  if (!before || !after) {
    return (
      <div className={`relative rounded-xl overflow-hidden ${className}`}>
        <img
          src={(before || after)!.url}
          alt="服务照片"
          className="w-full h-64 object-cover"
        />
        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {before ? '清洁前' : '清洁后'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      <div className="relative h-64">
        <img
          src={after.url}
          alt="清洁后"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={before.url}
            alt="清洁前"
            className="absolute inset-0 h-full object-cover"
            style={{ width: containerRef.current?.clientWidth || '100%' }}
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center gap-1">
            <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          清洁前
        </div>
        <div className="absolute bottom-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm">
          清洁后
        </div>
      </div>
    </div>
  );
};
