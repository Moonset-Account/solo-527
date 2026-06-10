import Image from 'next/image';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { getPublishedVisitsWithPhotos } from '@/lib/mock/data';
import { formatDate } from '@/lib/utils/format';

export const metadata = {
  title: '项目进展 - 阳光助学计划',
  description: '查看阳光助学计划的最新进展和探访记录',
};

export default function ProgressPage() {
  const visits = getPublishedVisitsWithPhotos();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24">
        <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold mb-4 font-serif">项目进展</h1>
            <p className="text-xl text-white/80 max-w-2xl">
              记录每一步前行，见证每一份改变。我们定期探访受助学生，确保每一份爱心都落到实处。
            </p>
          </div>
        </section>

        <section className="py-20 bg-warm-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 hidden md:block" />

              <div className="space-y-16">
                {visits.map((visit, visitIndex) => (
                  <div key={visit.id} className="relative">
                    <div className="hidden md:flex absolute left-5 w-7 h-7 bg-primary-500 rounded-full border-4 border-white shadow-lg z-10 items-center justify-center">
                      <span className="text-white text-xs font-bold">{visitIndex + 1}</span>
                    </div>

                    <div className="md:ml-20">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          <Calendar className="w-4 h-4" />
                          {formatDate(visit.visit_date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-gray-500 text-sm">
                          <MapPin className="w-4 h-4" />
                          {visit.location}
                        </span>
                      </div>

                      <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                        探访记录 #{visitIndex + 1}
                      </h2>

                      {visit.photos && visit.photos.length > 0 && (
                        <div className="mb-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {visit.photos.map((photo, photoIndex) => (
                              <div
                                key={photo.id}
                                className={`relative overflow-hidden rounded-xl group ${
                                  photoIndex === 0 ? 'md:col-span-2 md:row-span-2 aspect-video' : 'aspect-square'
                                }`}
                              >
                                <Image
                                  src={photo.image_url}
                                  alt={photo.description || '探访照片'}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {photo.description && (
                                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="text-white text-sm">{photo.description}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 font-serif">探访详情</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                          {visit.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4 font-serif">期待更多改变</h3>
            <p className="text-lg text-gray-600 mb-8">
              我们的脚步不会停止，每一次探访都是新的开始。<br />
              感谢您的关注与支持，让我们一起见证更多孩子的成长。
            </p>
            <div className="inline-flex items-center gap-2 text-primary-600 font-medium">
              <Clock className="w-5 h-5" />
              下次探访预计：2026年7月
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
