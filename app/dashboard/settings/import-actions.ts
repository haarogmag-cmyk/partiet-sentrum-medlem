'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Enkel parsing for å konvertere CSV-tekst til et array av objekter
function parseCsvData(csvText: string) {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue; // Hopp over feilformaterte rader
        
        const row: any = {};
        headers.forEach((header, index) => {
            row[header] = values[index].trim();
        });
        data.push(row);
    }
    return data;
}


export async function importMembersFromCSV(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Uautorisert' }
  
  // Vi antar at kun Superadmin skal gjøre dette.
  const { data: myRole } = await supabase.from('admin_roles').select('role').eq('user_id', user.id).single()
  if (myRole?.role !== 'superadmin') return { error: 'Kun Superadmin har tilgang til import.' }

  const file = formData.get('csvFile') as File
  if (!file) return { error: 'Ingen fil lastet opp.' }

  // Les filinnholdet (Konverter File-objekt til tekst)
  const buffer = await file.arrayBuffer();
  const csvText = new TextDecoder().decode(buffer);

  const membersToImport = parseCsvData(csvText);
  if (membersToImport.length === 0) return { error: 'Ingen gyldig data funnet i filen.' }

  let successCount = 0;
  let failCount = 0;
  
  // VIKTIG: VI GÅR RART GJENNOM LISTEN OG KALLER SIGNUP LOGIKKEN
  for (const member of membersToImport) {
      // Vi bruker en forenklet SignUp for import. Passord settes til et dummy-passord.
      const { error } = await supabase.auth.signUp({
          email: member.email,
          password: 'Password1', // Bruker må endre dette passordet senere
          options: {
              data: {
                  first_name: member.first_name,
                  last_name: member.last_name,
                  phone: member.phone,
                  zip: member.postal_code,
                  // Vi må gjette membership_selection fra f.eks. en 'type' kolonne
                  membership_selection: JSON.stringify({ ordinary: 'ordinary_mid', youth: member.is_youth === 'true' || member.is_youth === 'YES' })
              },
          },
      });

      if (!error) {
          successCount++;
      } else {
          console.error(`Import Error for ${member.email}:`, error.message);
          failCount++;
      }
  }

  revalidatePath('/dashboard');
  return { 
      success: true, 
      message: `Fullført. ${successCount} medlemmer importert. ${failCount} feil.` 
  };
}