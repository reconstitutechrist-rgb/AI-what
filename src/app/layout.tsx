import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "../components/AuthGuard";
import { AuthProvider } from "../contexts/AuthContext";

export const metadata: Metadata = {
  title: "Personal AI App Builder",
  description: "Build React components and apps using AI - the right way",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <AuthProvider>
          <AuthGuard>
            <div className="min-h-screen">
              {children}
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
