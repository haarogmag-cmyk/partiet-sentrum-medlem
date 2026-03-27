import { NextResponse } from 'next/server'

const FYLKE_MAP: Record<string, { name: string; id: number }> = {
  '03': { name: 'Oslo',                 id: 1  },
  '02': { name: 'Akershus',             id: 2  },
  '30': { name: 'Akershus',             id: 2  },
  '01': { name: 'Østfold',              id: 3  },
  '31': { name: 'Østfold',              id: 3  },
  '34': { name: 'Innlandet',            id: 4  },
  '06': { name: 'Innlandet',            id: 4  },
  '05': { name: 'Buskerud',             id: 5  },
  '32': { name: 'Buskerud',             id: 5  },
  '07': { name: 'Vestfold og Telemark', id: 6  },
  '08': { name: 'Vestfold og Telemark', id: 6  },
  '33': { name: 'Vestfold og Telemark', id: 6  },
  '09': { name: 'Agder',               id: 7  },
  '10': { name: 'Agder',               id: 7  },
  '42': { name: 'Agder',               id: 7  },
  '11': { name: 'Rogaland',            id: 8  },
  '46': { name: 'Vestland',            id: 9  },
  '12': { name: 'Vestland',            id: 9  },
  '14': { name: 'Vestland',            id: 9  },
  '15': { name: 'Møre og Romsdal',     id: 10 },
  '50': { name: 'Trøndelag',           id: 11 },
  '16': { name: 'Trøndelag',           id: 11 },
  '17': { name: 'Trøndelag',           id: 11 },
  '18': { name: 'Nordland',            id: 12 },
  '56': { name: 'Nordland',            id: 12 },
  '19': { name: 'Troms og Finnmark',   id: 13 },
  '20': { name: 'Troms og Finnmark',   id: 13 },
  '54': { name: 'Troms og Finnmark',   id: 13 },
}

// Postal code range fallback (municipality code prefix)
const POSTNR_RANGE_FALLBACK = (nr: number): { fylke: string; id: number } | null => {
  if (nr >= 100  && nr <= 991 ) return { fylke: 'Oslo',                 id: 1  }
  if (nr >= 1000 && nr <= 1299) return { fylke: 'Akershus',             id: 2  }
  if (nr >= 1300 && nr <= 1399) return { fylke: 'Akershus',             id: 2  }
  if (nr >= 1400 && nr <= 1479) return { fylke: 'Akershus',             id: 2  }
  if (nr >= 1480 && nr <= 1499) return { fylke: 'Akershus',             id: 2  }
  if (nr >= 1500 && nr <= 1799) return { fylke: 'Østfold',              id: 3  }
  if (nr >= 1800 && nr <= 1999) return { fylke: 'Akershus',             id: 2  }
  if (nr >= 2000 && nr <= 2499) return { fylke: 'Innlandet',            id: 4  }
  if (nr >= 2500 && nr <= 2999) return { fylke: 'Innlandet',            id: 4  }
  if (nr >= 3000 && nr <= 3049) return { fylke: 'Buskerud',             id: 5  }
  if (nr >= 3050 && nr <= 3299) return { fylke: 'Vestfold og Telemark', id: 6  }
  if (nr >= 3300 && nr <= 3699) return { fylke: 'Buskerud',             id: 5  }
  if (nr >= 3700 && nr <= 3999) return { fylke: 'Vestfold og Telemark', id: 6  }
  if (nr >= 4000 && nr <= 4499) return { fylke: 'Rogaland',            id: 8  }
  if (nr >= 4500 && nr <= 4999) return { fylke: 'Agder',               id: 7  }
  if (nr >= 5000 && nr <= 5999) return { fylke: 'Vestland',            id: 9  }
  if (nr >= 6000 && nr <= 6999) return { fylke: 'Møre og Romsdal',     id: 10 }
  if (nr >= 7000 && nr <= 7999) return { fylke: 'Trøndelag',           id: 11 }
  if (nr >= 8000 && nr <= 8999) return { fylke: 'Nordland',            id: 12 }
  if (nr >= 9000 && nr <= 9999) return { fylke: 'Troms og Finnmark',   id: 13 }
  return null
}

function capitalize(str: string): string {
  if (!str) return str
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postnr = searchParams.get('postnr')?.trim()

  if (!postnr || !/^\d{4}$/.test(postnr)) {
    return NextResponse.json({ error: 'Ugyldig postnummer' }, { status: 400 })
  }

  try {
    // Kartverket's stedsnavn/postnummer API — free, no auth, works from anywhere
    const url = `https://ws.geonorge.no/adresser/v1/postnummer/${postnr}`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      // Fallback to range-based if API fails
      const nr = parseInt(postnr)
      const fallback = POSTNR_RANGE_FALLBACK(nr)
      if (fallback) {
        return NextResponse.json({
          postnr,
          poststed: '',
          kommune: '',
          fylke: fallback.fylke,
          fylkeslagId: fallback.id,
        })
      }
      return NextResponse.json({ error: 'Ukjent postnummer' }, { status: 404 })
    }

    const data = await res.json()

    // Geonorge returns: { postnummer, poststed, kommunenummer, kommunenavn, fylkesnummer, fylkesnavn }
    const poststed   = capitalize(data.poststed   ?? '')
    const kommune    = capitalize(data.kommunenavn ?? '')
    const fylkesnr   = data.fylkesnummer as string | undefined
    const fylkesnavn = capitalize(data.fylkesnavn ?? '')

    let fylkeslagId: number | null = null
    let fylke = fylkesnavn

    if (fylkesnr && FYLKE_MAP[fylkesnr]) {
      const mapped = FYLKE_MAP[fylkesnr]
      fylkeslagId = mapped.id
      fylke = mapped.name
    } else {
      const nr = parseInt(postnr)
      const fallback = POSTNR_RANGE_FALLBACK(nr)
      if (fallback) {
        fylkeslagId = fallback.id
        fylke = fallback.fylke
      }
    }

    return NextResponse.json({
      postnr,
      poststed,
      kommune,
      fylke,
      fylkeslagId,
    })

  } catch (err) {
    console.error('Postnummer lookup feilet:', err)
    // Always return a range-based fallback rather than 500
    const nr = parseInt(postnr)
    const fallback = POSTNR_RANGE_FALLBACK(nr)
    if (fallback) {
      return NextResponse.json({
        postnr,
        poststed: '',
        kommune: '',
        fylke: fallback.fylke,
        fylkeslagId: fallback.id,
      })
    }
    return NextResponse.json({ error: 'Kunne ikke slå opp postnummer' }, { status: 500 })
  }
}
