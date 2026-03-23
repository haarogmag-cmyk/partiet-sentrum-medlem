'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="no">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#fffcf1' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <div style={{ fontSize: '3.75rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#c93960', marginBottom: '1rem' }}>
              Noe gikk galt
            </h1>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              En uventet feil oppstod. Vennligst prøv igjen.
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#c93960',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Prøv igjen
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
