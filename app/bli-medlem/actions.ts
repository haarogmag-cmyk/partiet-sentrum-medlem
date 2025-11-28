'use server'

import { createClient } from '@/utils/supabase/server'

interface PostalCodeData {
  city_name: string
  ps: { local: string | null, county: string | null }
  us: { local: string | null, county: string | null }
}

export async function lookupPostalCode(zip: string): Promise<PostalCodeData | null> {
  // Enkel validering
  if (!zip || zip.length !== 4) {
    return null
  }

  const supabase = await createClient()

  // 1. Hent geografisk info (Kommune/Fylke) fra postnummer
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

  // --- SMARTERE SØK (Finner delvise treff) ---
  
  // 2. Finn PS Lag (Partiet Sentrum)
  // Vi bruker .ilike med %-tegn for å si "inneholder kommunenavnet"
  const { data: psLocal } = await supabase
    .from('organizations')
    .select('name')
    .eq('level', 'local')
    .eq('org_type', 'ps')
    .ilike('name', `%${kommune}%`) 
    .limit(1)
    .maybeSingle()

  const { data: psCounty } = await supabase
    .from('organizations')
    .select('name')
    .eq('level', 'county')
    .eq('org_type', 'ps')
    .ilike('name', `%${fylke}%`)
    .limit(1)
    .maybeSingle()

  // 3. Finn US Lag (Unge Sentrum)
  const { data: usLocal } = await supabase
    .from('organizations')
    .select('name')
    .eq('level', 'local')
    .eq('org_type', 'us')
    .ilike('name', `%${kommune}%`)
    .limit(1)
    .maybeSingle()

  const { data: usCounty } = await supabase
    .from('organizations')
    .select('name')
    .eq('level', 'county')
    .eq('org_type', 'us')
    .ilike('name', `%${fylke}%`)
    .limit(1)
    .maybeSingle()

  return {
    city_name: geoData.city,
    ps: {
        // Vi fjerner prefiksen "Partiet Sentrum " for visningen sin del, hvis den finnes
        local: psLocal?.name?.replace('Partiet Sentrum ', '') || null,
        county: psCounty?.name?.replace('Partiet Sentrum ', '') || null
    },
    us: {
        local: usLocal?.name?.replace('Unge Sentrum ', '') || null,
        county: usCounty?.name?.replace('Unge Sentrum ', '') || null
    }
  }
}