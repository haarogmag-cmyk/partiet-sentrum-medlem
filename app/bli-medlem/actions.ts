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

  // 1. Hent geografi
  const { data: geoData, error: geoError } = await supabase
    .from('postal_codes')
    .select('city, municipality_name, county_name')
    .eq('code', zip)
    .single()

  if (geoError || !geoData) return null

  const kommune = geoData.municipality_name
  const fylke = geoData.county_name

  // 2. Finn PS Lag
  const { data: psLocal } = await supabase.from('organizations').select('name').ilike('name', `%${kommune}%`).eq('level', 'local').eq('org_type', 'ps').maybeSingle()
  const { data: psCounty } = await supabase.from('organizations').select('name').ilike('name', `%${fylke}%`).eq('level', 'county').eq('org_type', 'ps').maybeSingle()

  // 3. Finn US Lag
  const { data: usLocal } = await supabase.from('organizations').select('name').ilike('name', `%${kommune}%`).eq('level', 'local').eq('org_type', 'us').maybeSingle()
  const { data: usCounty } = await supabase.from('organizations').select('name').ilike('name', `%${fylke}%`).eq('level', 'county').eq('org_type', 'us').maybeSingle()

  return {
    city_name: geoData.city,
    ps: {
        local: psLocal?.name?.replace('Partiet Sentrum ', '') || null,
        county: psCounty?.name?.replace('Partiet Sentrum ', '') || null
    },
    us: {
        local: usLocal?.name?.replace('Unge Sentrum ', '') || null,
        county: usCounty?.name?.replace('Unge Sentrum ', '') || null
    }
  }
}