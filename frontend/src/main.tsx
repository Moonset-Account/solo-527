import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

let routerInstance: any = null;

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  (async () => {
    const { routeTree } = await import('./routeTree.gen.tsx');
    routerInstance = createRouter({
      routeTree,
      context: {
        queryClient,
      },
      defaultPreload: 'intent',
      defaultPreloadStaleTime: 0,
    });
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={routerInstance} />
          <Toaster position="top-right" richColors closeButton />
        </QueryClientProvider>
      </StrictMode>
    );
  })();
}
