import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Survivor Fantasy", description: "Our Survivor fantasy league" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bungee&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="top">
          <div className="wrap">
            <Link href="/" className="brand"><span className="torch">🔥</span> Survivor <span className="fantasy">Fantasy</span></Link>
            <nav className="main">
              <Link href="/">Standings</Link>
              <Link href="/me">My team</Link>
              <Link href="/week">Weekly</Link>
              <Link href="/castaways">Castaways</Link>
              <Link href="/rules">Rules</Link>
              {admin && <Link href="/admin">Admin</Link>}
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
