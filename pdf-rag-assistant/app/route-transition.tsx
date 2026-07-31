"use client";

import { createContext, useContext } from "react";

const RouteTransitionContext = createContext<() => void>(() => undefined);

export function RouteTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteTransitionContext.Provider value={() => undefined}>
      {children}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  return useContext(RouteTransitionContext);
}
