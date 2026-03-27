import { NextResponse } from 'next/server'

// Fylke name → our fylkeslag ID mapping
const FYLKE_TO_ID: Record<string, number> = {
  'Oslo':                 1,
  'Akershus':             2,
  'Østfold':              3,
  'Innlandet':            4,
  'Buskerud':             5,
  'Vestfold og Telemark': 6,
  'Telemark':             6,
  'Vestfold':             6,
  'Agder':                7,
  'Aust-Agder':           7,
  'Vest-Agder':           7,
  'Rogaland':             8,
  'Vestland':             9,
  'Hordaland':            9,
  'Sogn og Fjordane':     9,
  'Møre og Romsdal':      10,
  'Trøndelag':            11,
  'Sør-Trøndelag':        11,
  'Nord-Trøndelag':       11,
  'Nordland':             12,
  'Troms og Finnmark':    13,
  'Troms':                13,
  'Finnmark':             13,
}

// Norwegian municipality → fylke mapping for the most important ones
// Used as fallback when the API doesn't return fylke directly
const KOMMUNE_TO_FYLKE: Record<string, string> = {
  'Oslo': 'Oslo',
  'Bærum': 'Akershus', 'Asker': 'Akershus', 'Lillestrøm': 'Akershus',
  'Nordre Follo': 'Akershus', 'Ås': 'Akershus', 'Frogn': 'Akershus',
  'Vestby': 'Akershus', 'Nesodden': 'Akershus', 'Aurskog-Høland': 'Akershus',
  'Rælingen': 'Akershus', 'Enebakk': 'Akershus', 'Lørenskog': 'Akershus',
  'Nittedal': 'Akershus', 'Gjerdrum': 'Akershus', 'Ullensaker': 'Akershus',
  'Nannestad': 'Akershus', 'Eidsvoll': 'Akershus', 'Hurdal': 'Akershus',
  'Sarpsborg': 'Østfold', 'Fredrikstad': 'Østfold', 'Halden': 'Østfold',
  'Moss': 'Østfold', 'Råde': 'Østfold', 'Hvaler': 'Østfold',
  'Indre Østfold': 'Østfold', 'Marker': 'Østfold', 'Rakkestad': 'Østfold',
  'Hamar': 'Innlandet', 'Ringsaker': 'Innlandet', 'Lillehammer': 'Innlandet',
  'Gjøvik': 'Innlandet', 'Elverum': 'Innlandet', 'Kongsvinger': 'Innlandet',
  'Drammen': 'Buskerud', 'Kongsberg': 'Buskerud', 'Numedal': 'Buskerud',
  'Lier': 'Buskerud', 'Øvre Eiker': 'Buskerud', 'Nedre Eiker': 'Buskerud',
  'Tønsberg': 'Vestfold og Telemark', 'Sandefjord': 'Vestfold og Telemark',
  'Larvik': 'Vestfold og Telemark', 'Skien': 'Vestfold og Telemark',
  'Porsgrunn': 'Vestfold og Telemark', 'Telemark': 'Vestfold og Telemark',
  'Horten': 'Vestfold og Telemark', 'Holmestrand': 'Vestfold og Telemark',
  'Kristiansand': 'Agder', 'Arendal': 'Agder', 'Farsund': 'Agder',
  'Stavanger': 'Rogaland', 'Sandnes': 'Rogaland', 'Haugesund': 'Rogaland',
  'Bergen': 'Vestland', 'Fjord': 'Vestland', 'Sunnhordland': 'Vestland',
  'Ålesund': 'Møre og Romsdal', 'Molde': 'Møre og Romsdal', 'Kristiansund': 'Møre og Romsdal',
  'Trondheim': 'Trøndelag', 'Stjørdal': 'Trøndelag', 'Steinkjer': 'Trøndelag',
  'Bodø': 'Nordland', 'Narvik': 'Nordland', 'Mo i Rana': 'Nordland',
  'Tromsø': 'Troms og Finnmark', 'Alta': 'Troms og Finnmark', 'Harstad': 'Troms og Finnmark',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postnr = searchParams.get('postnr')?.trim()

  if (!postnr || !/^\d{4}$/.test(postnr)) {
    return NextResponse.json({ error: 'Ugyldig postnummer' }, { status: 400 })
  }

  try {
    // Use Bring/Posten's free postnumber API
    const res = await fetch(
      `https://fraktguide.bring.com/fraktguide/api/postalCode.json?clientUrl=partietsentrum.no&pnr=${postnr}&country=NO`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 }, // cache 24h
      }
    )

    if (!res.ok) throw new Error('Bring API feilet')

    const data = await res.json()

    if (!data.valid || !data.result) {
      return NextResponse.json({ error: 'Ukjent postnummer' }, { status: 404 })
    }

    // Bring returns: { valid: true, result: "OSLO", city: "OSLO" }
    // We also need municipality — use a secondary lookup
    const poststed = data.result as string

    // Try to get municipality from the Norwegian post API (Posten)
    let kommune = poststed
    let fylke = ''
    let fylkeslagId: number | null = null

    try {
      const postenRes = await fetch(
        `https://api.bring.com/shippingguide/api/postalCode.json?clientUrl=partietsentrum.no&pnr=${postnr}&country=NO`,
        { headers: { 'Accept': 'application/json' }, next: { revalidate: 86400 } }
      )
      if (postenRes.ok) {
        const postenData = await postenRes.json()
        if (postenData.city) kommune = postenData.city
      }
    } catch { /* fallback to poststed */ }

    // Map municipality to fylke
    const normalizedKommune = Object.keys(KOMMUNE_TO_FYLKE).find(k =>
      kommune.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(kommune.toLowerCase())
    )

    if (normalizedKommune) {
      fylke = KOMMUNE_TO_FYLKE[normalizedKommune]
      fylkeslagId = FYLKE_TO_ID[fylke] ?? null
    } else {
      // Postnummer range-based fallback
      const nr = parseInt(postnr)
      if (nr >= 100 && nr <= 991) { fylke = 'Oslo'; fylkeslagId = 1 }
      else if (nr >= 1000 && nr <= 1999) { fylke = 'Akershus'; fylkeslagId = 2 }
      else if (nr >= 1700 && nr <= 1899) { fylke = 'Akershus'; fylkeslagId = 2 }
      else if (nr >= 1500 && nr <= 1699) { fylke = 'Østfold'; fylkeslagId = 3 }
      else if (nr >= 1900 && nr <= 2499) { fylke = 'Innlandet'; fylkeslagId = 4 }
      else if (nr >= 3000 && nr <= 3699) { fylke = 'Buskerud'; fylkeslagId = 5 }
      else if (nr >= 3100 && nr <= 3299) { fylke = 'Vestfold og Telemark'; fylkeslagId = 6 }
      else if (nr >= 3700 && nr <= 3999) { fylke = 'Vestfold og Telemark'; fylkeslagId = 6 }
      else if (nr >= 4500 && nr <= 4999) { fylke = 'Agder'; fylkeslagId = 7 }
      else if (nr >= 4000 && nr <= 4499) { fylke = 'Rogaland'; fylkeslagId = 8 }
      else if (nr >= 5000 && nr <= 5999) { fylke = 'Vestland'; fylkeslagId = 9 }
      else if (nr >= 6000 && nr <= 6999) { fylke = 'Møre og Romsdal'; fylkeslagId = 10 }
      else if (nr >= 7000 && nr <= 7999) { fylke = 'Trøndelag'; fylkeslagId = 11 }
      else if (nr >= 8000 && nr <= 8999) { fylke = 'Nordland'; fylkeslagId = 12 }
      else if (nr >= 9000 && nr <= 9999) { fylke = 'Troms og Finnmark'; fylkeslagId = 13 }
    }

    return NextResponse.json({
      postnr,
      poststed: poststed.charAt(0) + poststed.slice(1).toLowerCase(),
      kommune: kommune.charAt(0) + kommune.slice(1).toLowerCase(),
      fylke,
      fylkeslagId,
    })

  } catch (err) {
    console.error('Postnummer lookup feilet:', err)
    return NextResponse.json({ error: 'Kunne ikke slå opp postnummer' }, { status: 500 })
  }
}
