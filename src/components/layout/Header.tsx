"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Bell, Search, Menu, X } from "lucide-react";

import { api } from "@/trpc/react";
import { getRoleLabel, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(3);

  const { data: searchResults, isLoading } = api.lease.search.useQuery(
    { keyword: searchQuery },
    { enabled: searchQuery.length >= 2, staleTime: 30000 }
  );

  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        setNotifications((prev) => Math.max(0, prev));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="搜索房源、租客、业主..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {searchResults.map((result) => (
                <a
                  key={result.id}
                  href={`/leases/${result.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {result.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {result.ownerName} · {getRoleLabel(result.status as string)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-600" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {notifications}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">待办通知</h3>
              <div className="space-y-2">
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-800">
                    3 笔租金已逾期
                  </p>
                  <p className="mt-1 text-xs text-amber-600">请及时处理</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-sm font-medium text-blue-800">
                    5 个工单待处理
                  </p>
                  <p className="mt-1 text-xs text-blue-600">包含 2 个紧急工单</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">
                    2 笔结算待确认
                  </p>
                  <p className="mt-1 text-xs text-green-600">请及时审核</p>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {user?.fullName || user?.username || "用户"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.publicMetadata?.role
                ? getRoleLabel(user.publicMetadata.role as string)
                : "财务专员"}
            </p>
          </div>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
