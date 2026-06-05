export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || '业余联赛管理系统'}
          </a>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm hover:underline">
              登录
            </a>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500">
        © 2024 业余联赛管理系统
      </footer>
    </div>
  );
}
