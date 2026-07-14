"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Providers — wraps the app with a single QueryClient instance.
 *
 * Place this in app/providers.tsx and wrap {children} with it in
 * app/layout.tsx:
 *
 *   import { Providers } from "./providers";
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html lang="en">
 *         <body>
 *           <Providers>{children}</Providers>
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * The QueryClient is created inside useState so each user session on
 * the server gets its own instance (avoids leaking cached data across
 * requests) while still being stable across client re-renders.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}