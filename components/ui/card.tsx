import React from "react";

// Vi legger til ...props for å støtte onClick, id, osv.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-ps-primary/10 overflow-hidden ${className}`} 
      {...props} 
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className = "" }: { title?: string, description?: string, action?: React.ReactNode, className?: string }) {
  if (!title && !description && !action) return null;
  return (
    <div className={`p-5 border-b border-ps-primary/10 flex justify-between items-start gap-4 ${className}`}>
        <div>
            {title && <h3 className="font-bold text-lg text-[#5e1639]">{title}</h3>}
            {description && <p className="text-sm text-ps-text/60 mt-1">{description}</p>}
        </div>
        {action && <div>{action}</div>}
    </div>
  )
}

export function CardContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}