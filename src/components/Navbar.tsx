"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
  type: "external" | "internal";
}

export function Navbar({ type }: NavbarProps) {
  const { user, logout, isInternal } = useAuth();

  const externalLinks = [
    { href: "/external", label: "提交预约" },
    { href: "/external/reservations", label: "我的预约" },
  ];

  const internalLinks = [
    { href: "/internal", label: "工作台" },
    { href: "/internal/reservations", label: "作业预约" },
    { href: "/internal/dispatches", label: "路线派发" },
    { href: "/internal/fuel", label: "油料登记" },
    { href: "/internal/maintenance", label: "维修管理" },
    { href: "/internal/settlements", label: "收益结算" },
    { href: "/internal/settings", label: "基础数据" },
  ];

  const links = type === "internal" ? internalLinks : externalLinks;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold text-primary-600 mr-8"
            >
              乡镇农机调度平台
            </Link>
            <div className="flex space-x-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  欢迎，{user.realName}
                  {isInternal && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                      管理员
                    </span>
                  )}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  退出登录
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
