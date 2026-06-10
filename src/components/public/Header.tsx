'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PUBLIC_NAV_ITEMS } from '@/lib/utils/constants';

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary-500 rounded-xl group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-serif">
                阳光助学计划
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                每一份爱心，点亮一个未来
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/login"
              className="ml-4 px-5 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-all hover:shadow-lg"
            >
              管理登录
            </Link>
          </nav>

          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 animate-fade-in-up">
            <div className="flex flex-col gap-2">
              {PUBLIC_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-primary-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                className="mt-2 px-4 py-3 bg-primary-500 text-white rounded-lg text-sm font-medium text-center"
              >
                管理登录
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
