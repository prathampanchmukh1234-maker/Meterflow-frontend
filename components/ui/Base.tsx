import React from 'react';
import { cn } from '../../utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
}

export const Card = ({ className, glass, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-purple-500/20 bg-[#1E2130]/60 p-4 sm:p-6 backdrop-blur-sm shadow-xl",
        glass && "backdrop-blur-md bg-white/5 border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-[#7C3AED] text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(124,58,237,0.4)]",
      secondary: "bg-slate-900/50 text-white hover:bg-slate-800 border border-slate-700/50",
      ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
      danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

export const Badge = ({ className, status }: { className?: string, status: string }) => {
  const styles: Record<string, string> = {
    active:  "bg-teal-500/10 text-teal-400 border-teal-500/20",
    revoked: "bg-red-500/10 text-red-400 border-red-500/20",
    rotated: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    pending: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    paid:    "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };
  const unknownStyle = "bg-slate-500/10 text-slate-400 border-slate-500/20";

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      styles[status] ?? unknownStyle,
      className
    )}>
      {status.toUpperCase()}
    </span>
  );
};
