import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-primary/20 text-indigo-300 hover:bg-primary/30 border-indigo-500/20",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive/20 text-red-300 hover:bg-destructive/30 border-red-500/20",
    success: "border-transparent bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/20",
    warning: "border-transparent bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/20",
    outline: "text-foreground"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
