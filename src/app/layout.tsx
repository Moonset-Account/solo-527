import { type Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/components/TRPCProvider";

export const metadata: Metadata = {
  title: "牙科诊所回访管理系统",
  description: "牙科诊所客户回访提醒与线索管理平台",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";

async function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  if (USE_MOCK_AUTH) {
    return <>{children}</>;
  }
  const { ClerkProvider } = await import("@clerk/nextjs");
  return <ClerkProvider>{children}</ClerkProvider>;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <ClerkProviderWrapper>
          <TRPCProvider>{children}</TRPCProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
