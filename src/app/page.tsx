import { Header } from '@/components/public/Header';
import { Hero } from '@/components/public/Hero';
import { StatsCard } from '@/components/public/StatsCard';
import { Timeline } from '@/components/public/Timeline';
import { PhotoGallery } from '@/components/public/PhotoGallery';
import { BudgetChart } from '@/components/public/BudgetChart';
import { StudentCard } from '@/components/public/StudentCard';
import { Footer } from '@/components/public/Footer';
import { Heart, Users, Clock, BookOpen } from 'lucide-react';
import { getDashboardStats, getFeedbacksWithRecipients, mockRecipients } from '@/lib/mock/data';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

export default function Home() {
  const stats = getDashboardStats();
  const feedbacks = getFeedbacksWithRecipients();

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />

        <section className="py-20 bg-warm-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 font-serif">我们的成果</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                每一个数字背后，都是无数爱心汇聚的力量
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                icon={Heart}
                label="累计筹款"
                value={formatCurrency(stats.totalRaised)}
                color="primary"
              />
              <StatsCard
                icon={Users}
                label="受益学生"
                value={formatNumber(stats.beneficiaryCount)}
                suffix="人"
                color="secondary"
              />
              <StatsCard
                icon={Clock}
                label="服务时长"
                value={formatNumber(stats.serviceHours)}
                suffix="小时"
                color="accent"
              />
              <StatsCard
                icon={BookOpen}
                label="探访次数"
                value={formatNumber(stats.visitCount)}
                suffix="次"
                color="primary"
              />
            </div>
          </div>
        </section>

        <Timeline />
        <PhotoGallery />
        <BudgetChart />

        <section className="py-20 bg-warm-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 font-serif">受助学生</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                认识这些可爱的孩子，他们正在用知识改变命运
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockRecipients.slice(0, 3).map((recipient, index) => {
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
          </div>
        </section>

        <section className="py-24 bg-gradient-to-br from-primary-500 to-primary-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-serif">
              您的一份爱心，孩子的一个未来
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              每一元捐赠，都将为孩子点亮一盏希望的灯。<br />
              让我们一起，用爱心照亮山区孩子的求学路。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-10 py-4 bg-white text-primary-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all hover:shadow-xl hover:-translate-y-0.5">
                立即捐赠
              </button>
              <button className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all">
                了解更多
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
