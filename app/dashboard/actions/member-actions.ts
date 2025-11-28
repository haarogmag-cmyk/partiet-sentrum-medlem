'use server';

import { createClient } from '@/utils/supabase/server';
import { parse } from 'csv-parse/sync'; 
import { revalidatePath } from 'next/cache';

// Define the expected CSV headers (for validation)
const REQUIRED_HEADERS = [
    'first_name', 
    'last_name', 
    'email', 
    'birth_date', 
    'zip_code'
];

export async function importMembersFromCsv(formData: FormData) {
    // VIKTIG RETTELSE HER: Lagt til 'await' før createClient()
    const supabase = await createClient();
    
    // Sjekker om brukeren har tilgang
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { success: false, error: 'Du er ikke logget inn.' };
    }

    const file = formData.get('csvFile') as File | null;
    
    if (!file || file.size === 0) {
        return { success: false, error: 'Ingen fil lastet opp.' };
    }
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
         return { success: false, error: 'Filformatet må være CSV.' };
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const csvString = buffer.toString('utf8');

        // Parse the CSV content
        const records = parse(csvString, {
            columns: true, // Bruk første rad som headere
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        }) as any[];

        if (records.length === 0) {
            return { success: false, error: 'CSV-filen inneholder ingen rader.' };
        }

        // --- VALIDERING ---
        const missingHeaders = REQUIRED_HEADERS.filter(header => !(header in records[0]));
        if (missingHeaders.length > 0) {
            return { success: false, error: `CSV mangler påkrevde kolonner: ${missingHeaders.join(', ')}.` };
        }

        const importData = [];
        const errors = [];
        
        for (const [index, record] of records.entries()) {
            const rowNumber = index + 2; 
            
            // Validering
            if (!record.email || !record.first_name || !record.last_name || !record.birth_date || !record.zip_code) {
                errors.push(`Rad ${rowNumber}: Mangler påkrevde felt.`);
                continue;
            }

            // Normaliser datatyper
            const isYouth = record.is_youth?.toUpperCase() === 'TRUE' || record.is_youth === '1';
            const membershipType = record.membership_type === 'ordinary_low' || record.membership_type === 'ordinary_mid' || record.membership_type === 'ordinary_high' ? record.membership_type : 'ordinary_mid';

            // Mapping til databasekolonner
            const memberRecord = {
                first_name: record.first_name,
                last_name: record.last_name,
                email: record.email.toLowerCase(), 
                birth_date: record.birth_date,
                zip_code: record.zip_code,
                
                membership_type: { 
                    ordinary: membershipType,
                    youth: isYouth
                },
                payment_status_ps: 'active', // Antar at importerte er aktive
                payment_status_us: isYouth ? 'active' : 'not_applicable',
            };
            
            importData.push(memberRecord);
        }

        if (errors.length > 0) {
            return { success: false, error: `Valideringsfeil (${errors.length}): ${errors.slice(0, 5).join('; ')}...` };
        }

        // --- DATABASE INSERT ---
        const { error: dbError } = await supabase
            .from('members')
            .upsert(importData, { onConflict: 'email', ignoreDuplicates: false })
            .select(); 

        if (dbError) {
            console.error('Supabase Error during bulk insert:', dbError);
            return { success: false, error: `Databasefeil: ${dbError.message}` };
        }

        revalidatePath('/dashboard');

        return { 
            success: true, 
            message: `Vellykket import av ${importData.length} medlemmer.`,
            error: null
        };

    } catch (e: any) {
        console.error('Import Error:', e);
        return { success: false, error: `Generell feil under import: Sjekk CSV-formatet. (${e.message})` };
    }
}