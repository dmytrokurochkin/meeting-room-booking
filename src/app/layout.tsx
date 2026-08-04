import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Бронювання переговорних",
  description: "Бронювання переговорних кімнат в офісі",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ToastProvider>
          <AppHeader />
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
