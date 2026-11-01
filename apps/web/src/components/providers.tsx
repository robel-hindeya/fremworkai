"use client";

import { ToastProvider } from "@/components/toast";
import { DataProvider } from "@/lib/client/store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DataProvider>{children}</DataProvider>
    </ToastProvider>
  );
}
