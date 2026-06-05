import { AuthProvider } from '@/context/AuthContext';
import "./globals.css";

export const metadata = {
  title: "自由职业管理平台",
  description: "自由职业项目收款和工时管理平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
