import React from "react";

// Hovedkomponenten
export function Dialog({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) {
    if (!open) return null;
    
    const handleClose = () => onOpenChange(false);

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div onClick={handleClose} className="absolute inset-0"></div>
            <div onClick={(e) => e.stopPropagation()} className="relative z-10 w-full max-w-lg">
                {children}
            </div>
        </div>
    );
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
    return children;
}

export function DialogContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

// OPPDATERT: Nå støtter denne className
export function DialogHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return <div className={`p-5 border-b border-slate-100 bg-[#fffcf1] ${className}`}>{children}</div>;
}

// OPPDATERT: Nå støtter denne className
export function DialogTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return <h3 className={`font-bold text-lg text-[#5e1639] ${className}`}>{children}</h3>;
}

export function DialogDescription({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return <p className={`text-sm text-slate-500 mt-1 ${className}`}>{children}</p>;
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return <div className={`p-4 border-t border-slate-100 flex justify-end gap-3 ${className}`}>{children}</div>;
}