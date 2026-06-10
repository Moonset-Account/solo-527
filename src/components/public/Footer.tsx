import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary-500 rounded-xl">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold font-serif">阳光助学计划</span>
            </div>
            <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
              我们致力于为贫困山区的孩子们提供更好的教育机会。每一份捐赠都将公开透明，
              您可以在这里看到每一分钱的去向和孩子们的成长。
            </p>
            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                <span>contact@sunshine-charity.org</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" />
                <span>400-888-8888</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>北京市朝阳区公益大厦 18 层</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 font-serif">快速导航</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="/" className="hover:text-primary-400 transition-colors">首页</a></li>
              <li><a href="/progress" className="hover:text-primary-400 transition-colors">项目进展</a></li>
              <li><a href="/finance" className="hover:text-primary-400 transition-colors">资金使用</a></li>
              <li><a href="/feedback" className="hover:text-primary-400 transition-colors">受助反馈</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 font-serif">关于我们</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-primary-400 transition-colors">机构介绍</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">项目愿景</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">团队成员</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">联系我们</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 阳光助学计划 版权所有 | 京ICP备12345678号
          </p>
          <p className="text-gray-500 text-sm">
            用爱心点亮希望，让知识改变命运
          </p>
        </div>
      </div>
    </footer>
  );
}
