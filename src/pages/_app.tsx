import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import '@/styles/globals.css';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        <Component {...pageProps} />
      </SWRConfig>
    </SessionProvider>
  );
}
