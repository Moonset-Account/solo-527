import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default function LoginPage() {
  redirect('/dashboard')
}

export async function getServerSideProps() {
  return { props: {} }
}

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
