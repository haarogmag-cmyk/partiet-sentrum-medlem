import { Suspense } from 'react';
import BliMedlemClient from './bli-medlem-client';

// Definerer Next.js sin standard props for Server Components
type Props = {
    searchParams: {
        message?: string;
        error?: string;
    };
};

// Dette er Server Component Shellen. Den tar imot statiske props.
export default function BliMedlemPage({ searchParams }: Props) {
    const message = searchParams.message || null;
    const error = searchParams.error || null;
    
    // Vi pakker Client Componentet inn i Suspense for å unngå build-feilen.
    return (
        <Suspense fallback={<div className="min-h-screen p-4 flex items-center justify-center bg-background">Laster innmeldingsskjema...</div>}>
            <BliMedlemClient 
                message={message} 
                error={error} 
            />
        </Suspense>
    );
}