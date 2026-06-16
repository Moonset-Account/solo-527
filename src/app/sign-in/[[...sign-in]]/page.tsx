"use client";

import { SignIn } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="p-6 text-center border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">客服反馈闭环系统</h1>
          <p className="text-sm text-slate-500 mt-1">登录您的账户</p>
        </div>
        <div className="p-6 flex justify-center">
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
            appearance={{
              elements: {
                formButtonPrimary: "bg-brand-500 hover:bg-brand-600",
                card: "shadow-none",
              },
            }}
          />
        </div>
      </Card>
    </div>
  );
}
