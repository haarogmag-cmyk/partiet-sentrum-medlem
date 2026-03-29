'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  isAdmin?: boolean
  userName?: string
}

const MEMBER_LINKS = [
  { href: '/dashboard',     label: 'Oversikt',        icon: '⊞' },
  { href: '/arrangementer', label: 'Arrangementer',   icon: '📅' },
  { href: '/skjemaer',      label: 'Skjemaer',        icon: '📋' },
  { href: '/profil',        label: 'Min profil',      icon: '👤' },
]

const ADMIN_LINKS = [
  { href: '/admin',                  label: 'Oversikt',        icon: '📊' },
  { href: '/admin/arrangementer/ny', label: 'Nytt arrangement', icon: '📅' },
  { href: '/admin/skjemaer/ny',      label: 'Nytt skjema',     icon: '📋' },
]

export default function PortalNav({ isAdmin, userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdminArea = pathname.startsWith('/admin')
  const links = isAdminArea ? ADMIN_LINKS : MEMBER_LINKS

  async function logout() {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  const firstName = userName?.split(' ')[0] ?? 'Bruker'

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #f0f0f0',
      padding: '0 20px', height: '54px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
      gap: '16px',
    }}>

      {/* Logo */}
      <Link href={isAdmin && isAdminArea ? '/admin' : '/dashboard'}
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: '20px', fontWeight: 700, color: '#c93960' }}>PS</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', display: 'none' }}>
          {isAdminArea ? 'Admin' : 'Portal'}
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'center' }}>
        {links.map(l => {
          const active = pathname === l.href ||
            (l.href !== '/dashboard' && l.href !== '/admin' && pathname.startsWith(l.href))
          return (
            <Link key={l.href} href={l.href} style={{
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              fontSize: '13px', fontWeight: active ? 700 : 500,
              color: active ? '#c93960' : '#6b7280',
              background: active ? '#fdf2f5' : 'transparent',
              transition: 'all .15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLElement).style.background = '#f9fafb'
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}>
              <span style={{ fontSize: '15px' }}>{l.icon}</span>
              <span style={{ fontSize: '12px' }}>{l.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isAdmin && (
          <Link href={isAdminArea ? '/dashboard' : '/admin'} style={{
            fontSize: '12px', fontWeight: 700, padding: '5px 12px',
            borderRadius: '8px', textDecoration: 'none', transition: 'all .15s',
            background: isAdminArea ? '#c93960' : '#fdf2f5',
            color: isAdminArea ? 'white' : '#c93960',
            whiteSpace: 'nowrap',
          }}>
            {isAdminArea ? '← Min side' : '🛡️ Admin'}
          </Link>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', padding: '6px 12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {firstName}
          </span>
          <button onClick={logout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', color: '#9ca3af', fontFamily: 'inherit',
            fontWeight: 600, padding: '6px 12px',
            borderLeft: '1px solid #f0f0f0',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c93960'; (e.currentTarget as HTMLElement).style.background = '#fdf2f5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; (e.currentTarget as HTMLElement).style.background = 'none' }}>
            Logg ut
          </button>
        </div>
      </div>
    </nav>
  )
}
