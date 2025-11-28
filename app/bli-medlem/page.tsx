import { Suspense } from 'react';
import BliMedlemClient from './bli-medlem-client'; // <--- Importer den nye klient-komponenten

// Definerer Next.js sin standard props for Server Components
type Props = {
    searchParams: {
        message?: string;
        error?: string;
    };
};

// Dette er Server Componentet. Det er ASYNC og henter searchParams.
export default async function BliMedlemPage({ searchParams }: Props) {
    const message = searchParams.message || null;
    const error = searchParams.error || null;
    
    // Vi pakker Client Componentet inn i Suspense for å unngå build-feilen.
    return (
        <Suspense fallback={<div>Laster innmeldingsskjema...</div>}>
            <BliMedlemClient message={message} error={error} />
        </Suspense>
    );
}

// Merk: Hvis du også hadde definert andre hjelpefunksjoner i den gamle page.tsx
// (som f.eks. InputField), må du sørge for at de er flyttet over til bli-medlem-client.tsx 
// sammen med resten av koden.