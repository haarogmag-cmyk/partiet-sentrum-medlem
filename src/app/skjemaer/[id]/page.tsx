import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import type { Form } from '@/lib/database.types'
import NavWrapper from '../arrangementer/NavWrapper'

async function getForms(): Promise<Form[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('forms').select('*').eq('is_active', true).order('created_at', { ascending: false })
    return data ?? []
  } catch { return [] }
}

export default async function SkjemaerPage() {
  const forms = await getForms()
  const now = new Date()

  return (
    <div style={{ minHeight: '100svh', background: '#f8f7f5', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <NavWrapper />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '28px', fontWeight: 700, color: '#0f0f1a', marginBottom: '4px' }}>
            Påmeldingsskjemaer
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>Aktive skjemaer du kan svare på</p>
        </div>

        {forms.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {forms.map(f => {
              const isClosed = f.closes_at && new Date(f.closes_at) < now
              return (
                <Link key={f.id} href={`/skjemaer/${f.id}`} style={{
                  display: 'block', background: 'white', borderRadius: '16px',
                  padding: '20px 24px', border: '1px solid #f0f0f0',
                  textDecoration: 'none', boxShadow: '0 2px 6px rgba(0,0,0,.04)',
                  opacity: isClosed ? .5 : 1, transition: 'all .18s',
                  pointerEvents: isClosed ? 'none' : 'auto',
                }}
                onMouseEnter={e => {
                  if (isClosed) return
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'
                  el.style.borderColor = '#fca5a5'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 2px 6px rgba(0,0,0,.04)'
                  el.style.borderColor = '#f0f0f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '20px' }}>📋</span>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f1a' }}>{f.title}</h3>
                      </div>
                      {f.description && (
                        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: '8px' }}>{f.description}</p>
                      )}
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
                        <span>📝 {(f.fields as unknown[]).length} felt</span>
                        {f.closes_at && (
                          <span style={{ color: isClosed ? '#ef4444' : '#d97706' }}>
                            {isClosed ? '🔒 Stengt' : `⏰ Stenger ${new Date(f.closes_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' })}`}
                          </span>
                        )}
                        {f.requires_membership && <span>🔐 Krever medlemskap</span>}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '8px 16px', background: isClosed ? '#f3f4f6' : '#c93960',
                        color: isClosed ? '#9ca3af' : 'white',
                        borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                      }}>
                        {isClosed ? 'Stengt' : 'Åpent →'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: '20px', padding: '52px 32px',
            textAlign: 'center', border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,.04)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: '20px', fontWeight: 700, color: '#0f0f1a', marginBottom: '6px' }}>Ingen aktive skjemaer</h3>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Det er ingen åpne påmeldingsskjemaer for øyeblikket.</p>
          </div>
        )}
      </main>
    </div>
  )
}
