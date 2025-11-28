'use server'

import { createClient } from '@/utils/supabase/server'

interface PostalCodeData {
  city_name: string
  lokallag_navn: string | null
  fylkeslag_navn: string | null
}

export async function lookupPostalCode(zip: string): Promise<PostalCodeData | null> {
  // 1. Validering
  if (!zip || zip.length !== 4) {
    return null
  }

  const supabase = await createClient()

  // ---------------------------------------------------------
  // STEG 1: Hent geografisk info fra 'postal_codes'
  // ---------------------------------------------------------
  // Vi bruker dine kolonnenavn: 'code', 'city', 'municipality_name', 'county_name'
  const { data: geoData, error: geoError } = await supabase
    .from('postal_codes')
    .select('city, municipality_name, county_name')
    .eq('code', zip) // <-- Endret fra 'zip_code' til 'code'
    .single()

  if (geoError || !geoData) {
    console.warn('Fant ikke postnummer:', zip, geoError?.message)
    return null
  }

  const kommuneNavn = geoData.municipality_name
  const fylkeNavn = geoData.county_name

  // ---------------------------------------------------------
  // STEG 2: Finn Lokallag og Fylkeslag basert på navn
  // ---------------------------------------------------------
  
  // Søk etter lokallag (Vi søker etter organisasjoner som inneholder kommunenavnet)
  // F.eks: Hvis kommunen er "Bergen", finner vi "Partiet Sentrum Bergen"
  const { data: lokallag } = await supabase
    .from('organizations')
    .select('name')
    .ilike('name', `%${kommuneNavn}%`) // % betyr "hva som helst før/etter"
    .eq('level', 'local') // Vi antar at du har en kolonne 'level' som sier 'local' eller 'county'
    .maybeSingle() // maybeSingle krasjer ikke hvis den finner 0 eller flere

  // Søk etter fylkeslag
  const { data: fylkeslag } = await supabase
    .from('organizations')
    .select('name')
    .ilike('name', `%${fylkeNavn}%`)
    .eq('level', 'county')
    .maybeSingle()

  // ---------------------------------------------------------
  // STEG 3: Returner ferdig data
  // ---------------------------------------------------------
  return {
    city_name: geoData.city, // <-- Endret fra 'city_name' til 'city'
    lokallag_navn: lokallag?.name?.replace('Partiet Sentrum ', '') || null,
    fylkeslag_navn: fylkeslag?.name?.replace('Partiet Sentrum ', '') || null,
  }
}