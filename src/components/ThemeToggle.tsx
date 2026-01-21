'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from './ui/Button';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 w-10 h-10 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-all"
      aria-label="Toggle Theme"
    >
      <span className="sr-only">Toggle theme</span>
      {/* Sun Icon (Rotate/Scale based on theme) */}
      <svg
        className={`w-5 h-5 transition-all text-yellow-500 absolute rotate-0 scale-100 dark:-rotate-90 dark:scale-0`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      {/* Moon Icon */}
      <svg
        className={`w-5 h-5 transition-all text-indigo-400 absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </Button>
  );
}
