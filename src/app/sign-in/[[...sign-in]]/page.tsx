import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            销售经营异常监控台
          </h1>
          <p className="mt-2 text-primary-200 text-sm">
            实时追踪销售核心指标异常，智能告警，快速定位原因
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
