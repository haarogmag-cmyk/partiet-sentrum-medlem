import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "neutral" | "ps" | "us" | "outline";
  className?: string; // <--- NYTT: Tillater ekstra klasser
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const styles = {
    success: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    ps: "bg-ps-primary/10 text-ps-primary border-ps-primary/20",
    us: "bg-us-primary/10 text-us-primary border-us-primary/20",
    outline: "bg-transparent border-ps-text/20 text-ps-text/60 border",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}