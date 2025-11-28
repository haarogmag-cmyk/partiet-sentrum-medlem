// components/dashboard/csv-import-modal.tsx

'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { importMembersFromCsv } from '@/app/dashboard/actions/member-actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CsvImportModalProps {
    children: React.ReactNode;
}

const requiredHeaders = [
    'first_name', 
    'last_name', 
    'email', 
    'birth_date (YYYY-MM-DD)', 
    'zip_code', 
    'is_youth (TRUE/FALSE)', 
    'membership_type (ordinary_low/mid/high)'
];

export function CsvImportModal({ children }: CsvImportModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    // --- Server Action Wrapper ---
    const handleImport = async (formData: FormData) => {
        const result = await importMembersFromCsv(formData);
        
        if (result.success) {
            toast.success(result.message);
            setIsOpen(false);
        } else {
            toast.error(result.error);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger> {/* FIX 1: asChild er fjernet */}
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Importer medlemmer (CSV)</DialogTitle>
                    <DialogDescription>
                        Last opp en CSV-fil for masseimport av nye medlemmer. Eksisterende medlemmer med samme e-post vil bli oppdatert.
                    </DialogDescription>
                </DialogHeader>
                
                <form action={handleImport} className="space-y-4">
                    
                    <p className="text-sm font-semibold text-ps-primary">Påkrevde kolonner:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside p-2 bg-slate-50 rounded-lg">
                        {requiredHeaders.map(h => <li key={h}>{h}</li>)}
                    </ul>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="csvFile" className="font-medium text-sm text-ps-text">Velg CSV-fil</label>
                        <input 
                            id="csvFile"
                            name="csvFile"
                            type="file"
                            accept=".csv"
                            required
                            className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-ps-primary/10 file:text-ps-primary
                            hover:file:bg-ps-primary/20"
                        />
                    </div>
                    
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant="primary">
            {pending ? 'Importerer...' : 'Start Import'}
        </Button>
    )
}