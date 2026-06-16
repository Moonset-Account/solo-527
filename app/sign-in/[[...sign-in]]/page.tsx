import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              'bg-blue-600 hover:bg-blue-700 text-white rounded-lg',
            card: 'rounded-xl shadow-xl',
          },
        }}
      />
    </div>
  );
}
