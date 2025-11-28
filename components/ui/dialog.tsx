// components/ui/dialog.tsx (Rettet handler)

import React, { MouseEventHandler } from "react";

// Minimal components required for the CSV Modal to compile
export function Dialog({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) {
    if (!open) return null;
    
    // Handler for clicking the backdrop (closes the modal)
    // FIX 2: Vi pakker 'onOpenChange(false)' inn i en funksjon
    const handleClose = () => onOpenChange(false);

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            {/* Klikk på backdrop for å lukke */}
            <div onClick={handleClose} className="absolute inset-0"></div> 
            
            {/* Innholdet (stopper klikk fra å nå backdrop) */}
            <div onClick={(e) => e.stopPropagation()} className="relative">
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    // Dette rendrer selve modal-kortet
    return (
        <div className={`bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

// FIX 1: Vi forenkler Triggeren til å bare returnere knappen
export function DialogTrigger({ children }: { children: React.ReactNode }) {
    // Returnerer knappen/linken som åpner modalen
    return children;
}

// ... (Resten av hjelpekomponentene er som før) ...

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="p-5 border-b border-slate-100 bg-[#fffcf1]">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="font-bold text-lg text-[#5e1639]">{children}</h3>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
    return <p className="text-sm text-slate-500 mt-1">{children}</p>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
    return <div className="p-4 border-t border-slate-100 flex justify-end gap-3">{children}</div>;
}