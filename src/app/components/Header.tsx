'use client';

import { useState } from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { 
  Trophy, 
  Calendar, 
  Users, 
  BarChart3, 
  Gavel, 
  Menu, 
  X,
  Wifi,
  Settings,
  UserPlus,
  QrCode,
  Database
} from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页', icon: <Trophy className="w-4 h-4" /> },
    { href: '/teams', label: '球队', icon: <Users className="w-4 h-4" /> },
    { href: '/teams/register', label: '报名', icon: <UserPlus className="w-4 h-4" /> },
    { href: '/schedule', label: '赛程', icon: <Calendar className="w-4 h-4" /> },
    { href: '/standings', label: '积分榜', icon: <BarChart3 className="w-4 h-4" /> },
    { href: '/appeals', label: '申诉', icon: <Gavel className="w-4 h-4" /> },
  ];

  const mobileNavItems = [
    ...navItems,
    { href: '/mobile/scan', label: '扫码拍照', icon: <QrCode className="w-4 h-4" /> },
    { href: '/mobile/offline', label: '离线数据', icon: <Database className="w-4 h-4" /> },
    { href: '/admin', label: '管理后台', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-gradient-secondary text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-accent" />
            <Link href="/" className="text-xl font-bold font-display tracking-wider">
              城市篮球联赛
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink 
                key={item.href} 
                href={item.href} 
                icon={item.icon}
                active={pathname === item.href}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="w-px h-6 bg-white/20 mx-2" />
            <NavLink href="/admin" icon={<Settings className="w-4 h-4" />} active={pathname.startsWith('/admin')}>
              管理
            </NavLink>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-xs text-white/70">
              <Wifi className="w-4 h-4 text-success" />
              <span>在线</span>
            </div>
            <button 
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-secondary-dark">
          <nav className="px-4 py-3 space-y-1">
            {mobileNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === item.href 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children, icon, active }: { 
  href: string; 
  children: React.ReactNode; 
  icon?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-white/10 text-white' 
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
