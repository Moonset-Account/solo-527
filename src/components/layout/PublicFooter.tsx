import Link from 'next/link';
import { Wrench, Phone, MapPin, Clock } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-dark-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold font-display">速达维保</span>
            </div>
            <p className="text-dark-400 text-sm leading-relaxed max-w-md">
              专业汽车保养维修服务，为您的爱车提供全方位的呵护。
              经验丰富的技师团队，原厂品质配件，让每一次服务都安心放心。
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">服务项目</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li><Link href="/services" className="hover:text-white transition-colors">常规保养</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">深度检测</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">故障维修</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">美容装潢</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">联系我们</h3>
            <ul className="space-y-3 text-sm text-dark-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>400-123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>北京市朝阳区xxx街道xxx号</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>周一至周日 08:00-20:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-sm text-dark-500">
          <p>© 2024 速达维保. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  );
}
