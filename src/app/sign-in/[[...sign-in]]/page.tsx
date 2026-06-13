import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dental-50 via-white to-primary-50">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦷</div>
          <h1 className="text-3xl font-bold text-dental-700 mb-2">齿悦管家</h1>
          <p className="text-slate-500">牙科诊所客户回访管理系统</p>
        </div>
        <div className="card">
          <div className="card-body">
            <SignIn
              appearance={{
                elements: {
                  formButtonPrimary: "bg-dental-600 hover:bg-dental-700",
                  footerActionLink: "text-dental-600 hover:text-dental-700",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
