'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import SyncEmailButton from '@/components/SyncEmailButton';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: 'Extraction' },
    { href: '/dashboard', label: 'Tableau de Bord' },
    { href: '/manual', label: 'Saisie Manuelle' },
    { href: '/history', label: 'Historique' },
    { href: '/controle-remise', label: 'Contrôle Remise' },
    { href: '/catalog', label: 'Catalogue' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-transparent bg-transparent backdrop-blur-md">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-purple-600">
              MediCheck
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href) ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Mobile Menu Button */}
           <button
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
             aria-label="Toggle menu"
           >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               {mobileMenuOpen ? (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               ) : (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
               )}
             </svg>
           </button>
           
           <SyncEmailButton />
           <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <nav className="container px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
