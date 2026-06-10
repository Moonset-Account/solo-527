'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockAchievementPhotos } from '@/lib/mock/data';

export function PhotoGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const photos = mockAchievementPhotos;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhoto === null) return;
    setSelectedPhoto(selectedPhoto === 0 ? photos.length - 1 : selectedPhoto - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhoto === null) return;
    setSelectedPhoto(selectedPhoto === photos.length - 1 ? 0 : selectedPhoto + 1);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-serif">项目成果</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            每一张照片背后，都是一个改变命运的故事
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(index)}
              className="group relative overflow-hidden rounded-2xl cursor-pointer aspect-[4/3] card-hover"
            >
              <Image
                src={photo.image_url}
                alt={photo.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-xl font-semibold text-white mb-2 font-serif">{photo.title}</h3>
                <p className="text-white/80 text-sm">{photo.description}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedPhoto !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={handlePrev}
              className="absolute left-6 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <div className="max-w-5xl max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-[90vw] max-w-4xl aspect-video">
                <Image
                  src={photos[selectedPhoto].image_url}
                  alt={photos[selectedPhoto].title}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-center mt-6">
                <h3 className="text-2xl font-semibold text-white mb-2 font-serif">
                  {photos[selectedPhoto].title}
                </h3>
                <p className="text-white/70">{photos[selectedPhoto].description}</p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="absolute right-6 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedPhoto(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === selectedPhoto ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
