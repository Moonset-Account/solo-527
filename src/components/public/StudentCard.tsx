import Image from 'next/image';
import { Recipient } from '@/lib/types';

interface StudentCardProps {
  recipient: Recipient;
  latestFeedback?: string;
  delay?: number;
}

export function StudentCard({ recipient, latestFeedback, delay = 0 }: StudentCardProps) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative h-64">
        {recipient.avatar_url ? (
          <Image
            src={recipient.avatar_url}
            alt={recipient.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
            <span className="text-5xl font-bold text-white font-serif">{recipient.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white font-serif">{recipient.name}</h3>
          <p className="text-white/80 text-sm">{recipient.grade} · {recipient.school}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
            {recipient.age}岁
          </span>
          {recipient.grade && (
            <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">
              {recipient.grade}
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
          {recipient.bio}
        </p>

        {latestFeedback && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">最新反馈</p>
            <p className="text-sm text-gray-700 line-clamp-2 italic">
              "{latestFeedback}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
