import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { StudentCard } from '@/components/public/StudentCard';
import { Heart, BookOpen, Award, MessageCircle } from 'lucide-react';
import { getFeedbacksWithRecipients, mockRecipients } from '@/lib/mock/data';
import { formatDate } from '@/lib/utils/format';

export const metadata = {
  title: '受助反馈 - 阳光助学计划',
  description: '来自受助学生的真实反馈，看到他们的成长和感恩',
};

export default function FeedbackPage() {
  const feedbacks = getFeedbacksWithRecipients();

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'story':
        return <MessageCircle className="w-5 h-5" />;
      case 'letter':
        return <BookOpen className="w-5 h-5" />;
      case 'grade':
        return <Award className="w-5 h-5" />;
      default:
        return <Heart className="w-5 h-5" />;
    }
  };

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case 'story':
        return '成长故事';
      case 'letter':
        return '感谢信';
      case 'grade':
        return '成绩反馈';
      default:
        return '反馈';
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'story':
        return 'bg-blue-100 text-blue-700';
      case 'letter':
        return 'bg-primary-100 text-primary-700';
      case 'grade':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24">
        <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold mb-4 font-serif">受助反馈</h1>
            <p className="text-xl text-white/80 max-w-2xl">
              每一封信、每一个笑脸，都是我们前行的动力。看看孩子们的成长故事。
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 font-serif text-center">认识我们的孩子</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              {mockRecipients.map((recipient, index) => {
                const recipientFeedback = feedbacks.find(f => f.recipient_id === recipient.id);
                return (
                  <StudentCard
                    key={recipient.id}
                    recipient={recipient}
                    latestFeedback={recipientFeedback?.content.slice(0, 80) + '...'}
                    delay={index * 100}
                  />
                );
              })}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-12 font-serif text-center">来自孩子们的声音</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {feedbacks.map((feedback, index) => (
                <div
                  key={feedback.id}
                  className="bg-warm-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold font-serif">
                        {feedback.recipient?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{feedback.recipient?.name}</p>
                        <p className="text-sm text-gray-500">{feedback.recipient?.grade} · {feedback.recipient?.school}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getFeedbackTypeColor(feedback.type)}`}>
                      {getFeedbackIcon(feedback.type)}
                      {getFeedbackTypeLabel(feedback.type)}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-6 relative">
                    <div className="absolute -top-3 left-6 text-5xl text-primary-200 font-serif">"</div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line relative z-10">
                      {feedback.content}
                    </p>
                    <div className="absolute -bottom-3 right-6 text-5xl text-primary-200 font-serif rotate-180">"</div>
                  </div>

                  <p className="text-right text-sm text-gray-400 mt-4">
                    {formatDate(feedback.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-primary-50 to-warm-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-full mb-8">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 font-serif">
              每一份爱心，都在创造改变
            </h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              您的捐赠不仅仅是金钱，更是孩子们对未来的希望。<br />
              看到他们的笑脸和进步，是我们最大的欣慰，也是您爱心的最好回报。
            </p>
            <button className="px-10 py-4 bg-primary-500 text-white rounded-xl font-semibold text-lg hover:bg-primary-600 transition-all hover:shadow-xl hover:-translate-y-0.5">
              加入我们，一起传递温暖
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
