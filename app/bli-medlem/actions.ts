'use server'

import { createClient } from '@/utils/supabase/server'

interface PostalCodeData {
  city_name: string
  ps: { local: string | null, county: string | null }
  us: { local: string | null, county: string | null }
}

export async function lookupPostalCode(zip: string): Promise<PostalCodeData | null> {
  if (!zip || zip.length !== 4) {
    return null
  }

  const supabase = await createClient()

  // 1. Hent geografisk info
  const { data: geoData, error: geoError } = await supabase
    .from('postal_codes')
    .select('city, municipality_name, county_name')
    .eq('code', zip)
    .single()

  if (geoError || !geoData) {
    return null
  }

  const kommune = geoData.municipality_name
  const fylke = geoData.county_name

  // --- HJELPEFUNKSJON FOR SMART SØK ---
  async function findOrg(type: 'ps' | 'us', level: 'local' | 'county', locationName: string) {
    const prefix = type === 'ps' ? 'Partiet Sentrum' : 'Unge Sentrum';
    
    // FORSØK 1: Eksakt standardnavn (F.eks "Partiet Sentrum Ås")
    // Dette løser Ås vs Åsnes problemet, da "Partiet Sentrum Ås" != "Partiet Sentrum Åsnes"
    let { data } = await supabase
      .from('organizations')
      .select('name')
      .eq('level', level)
      .eq('org_type', type)
      .eq('name', `${prefix} ${locationName}`) 
      .maybeSingle();

    if (data) return data.name;

    // FORSØK 2: Starter med navnet (F.eks "Partiet Sentrum Ås Vest")
    // Bruker 'Partiet Sentrum Ås %' for å sikre at vi har et mellomrom etter Ås
    { data } = await supabase
      .from('organizations')
      .select('name')
      .eq('level', level)
      .eq('org_type', type)
      .ilike('name', `${prefix} ${locationName} %`) 
      .limit(1)
      .maybeSingle();

    if (data) return data.name;

    // FORSØK 3: Inneholder navnet (Siste utvei, men kan gi feil treff som Åsnes for Ås)
    // Vi gjør dette kun hvis vi ikke fant noe annet
    { data } = await supabase
      .from('organizations')
      .select('name')
      .eq('level', level)
      .eq('org_type', type)
      .ilike('name', `%${locationName}%`)
      .limit(1)
      .maybeSingle();
      
    return data?.name || null;
  }

  // --- KJØR SØKENE ---
  
  const psLocalName = await findOrg('ps', 'local', kommune);
  const psCountyName = await findOrg('ps', 'county', fylke);
  
  const usLocalName = await findOrg('us', 'local', kommune);
  const usCountyName = await findOrg('us', 'county', fylke);

  return {
    city_name: geoData.city,
    ps: {
        local: psLocalName?.replace('Partiet Sentrum ', '') || null,
        county: psCountyName?.replace('Partiet Sentrum ', '') || null
    },
    us: {
        local: usLocalName?.replace('Unge Sentrum ', '') || null,
        county: usCountyName?.replace('Unge Sentrum ', '') || null
    }
  }
}