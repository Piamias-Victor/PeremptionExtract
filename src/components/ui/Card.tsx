import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outline';
}

export function Card({ children, className = '', variant = 'glass', ...props }: CardProps) {
  const variants = {
    default: "bg-card text-card-foreground border border-border shadow-sm",
    glass: "glass-card text-foreground",
    outline: "border border-border bg-transparent text-foreground",
  };

  return (
    <div 
      className={`rounded-xl p-6 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`pt-0 ${className}`}>{children}</div>;
}
