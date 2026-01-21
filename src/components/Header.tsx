'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import SyncEmailButton from '@/components/SyncEmailButton';

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-transparent bg-transparent backdrop-blur-md">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-purple-600">
              MediCheck
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Extraction
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/dashboard') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Tableau de Bord
            </Link>
            <Link
              href="/manual"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/manual') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Saisie Manuelle
            </Link>
            <Link
              href="/history"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/history') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Historique
            </Link>
            <Link
              href="/controle-remise"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/controle-remise') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Contrôle Remise
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Mobile Nav would go here if needed */}
           <SyncEmailButton />
           <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
