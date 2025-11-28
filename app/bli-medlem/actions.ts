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
    // Vi kaller variabelen 'exactMatch' for å unngå navnekollisjon
    const { data: exactMatch } = await supabase
      .from('organizations')
      .select('name')
      .eq('level', level)
      .eq('org_type', type)
      .eq('name', `${prefix} ${locationName}`) 
      .maybeSingle();

    if (exactMatch) return exactMatch.name;

    // FORSØK 2: Starter med navnet (F.eks "Partiet Sentrum Ås Vest")
    // Bruker 'Partiet Sentrum Ås %' for å sikre at vi har et mellomrom etter Ås
    const { data: prefixMatch } = await supabase
      .from('organizations')
      .select('name')
      .eq('level', level)
      .eq('org_type', type)
      .ilike('name', `${prefix} ${locationName} %`) 
      .limit(1)
      .maybeSingle();

    if (prefixMatch) return prefixMatch.name;

    // FORSØK 3: Inneholder navnet (Siste utvei)
    const { data: fuzzyMatch } = await supabase
      .from('organizations')
      .select('name')
      .eq('level', level)
      .eq('org_type', type)
      .ilike('name', `%${locationName}%`)
      .limit(1)
      .maybeSingle();
      
    return fuzzyMatch?.name || null;
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