'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getPublishedVisitsWithPhotos } from '@/lib/services/data';
import { formatDate } from '@/lib/utils/format';
import type { Visit } from '@/lib/types';

export function Timeline() {
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    getPublishedVisitsWithPhotos().then(data => setVisits(data.slice(0, 3)));
  }, []);

  return (
    <section className="py-20 bg-warm-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-serif">项目进展</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            记录每一步前行，见证每一份改变
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 hidden lg:block" />

          <div className="space-y-16">
            {visits.map((visit, index) => (
              <div
                key={visit.id}
                className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-primary-500 rounded-full border-4 border-white shadow-lg z-10" />

                <div className="w-full lg:w-1/2">
                  <div className={`relative overflow-hidden rounded-2xl aspect-video shadow-xl group ${index % 2 === 0 ? 'lg:mr-12' : 'lg:ml-12'}`}>
                    {visit.photos && visit.photos[0] && (
                      <Image
                        src={visit.photos[0].image_url}
                        alt={visit.location}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                </div>

                <div className="w-full lg:w-1/2">
                  <div className={`${index % 2 === 0 ? 'lg:ml-12' : 'lg:mr-12'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDate(visit.visit_date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-gray-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        {visit.location}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                      探访记录
                    </h3>

                    <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                      {visit.content}
                    </p>

                    {visit.photos && visit.photos.length > 1 && (
                      <div className="flex gap-2 mb-6">
                        {visit.photos.slice(1, 4).map((photo) => (
                          <div key={photo.id} className="w-16 h-16 rounded-lg overflow-hidden relative">
                            <Image
                              src={photo.image_url}
                              alt={photo.description || ''}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {visit.photos.length > 4 && (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                            +{visit.photos.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    <Link
                      href="/progress"
                      className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
                    >
                      查看更多进展
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/progress"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all hover:shadow-lg"
          >
            查看全部探访记录
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
