'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  isAdmin?: boolean
  userName?: string
}

const NAV_LINKS = [
  { href: '/dashboard',    label: 'Oversikt',        icon: '⊞' },
  { href: '/arrangementer', label: 'Arrangementer',  icon: '📅' },
  { href: '/skjemaer',     label: 'Skjemaer',         icon: '📋' },
  { href: '/profil',       label: 'Min profil',       icon: '👤' },
]

const ADMIN_LINKS = [
  { href: '/admin',                   label: 'Dashboard',       icon: '📊' },
  { href: '/admin/members',           label: 'Medlemmer',       icon: '👥' },
  { href: '/admin/arrangementer/ny',  label: 'Nytt arrangement', icon: '➕' },
  { href: '/admin/skjemaer/ny',       label: 'Nytt skjema',     icon: '📝' },
]

export default function PortalNav({ isAdmin, userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdminArea = pathname.startsWith('/admin')

  async function logout() {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = isAdminArea ? ADMIN_LINKS : NAV_LINKS

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #f3f4f6',
      padding: '0 24px', height: '56px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
    }}>
      {/* Left: Logo */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          fontFamily: "'Fraunces',Georgia,serif",
          fontSize: '18px', fontWeight: 700, color: '#c93960',
        }}>PS</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
          {isAdminArea ? 'Admin' : 'Medlemsportal'}
        </span>
      </Link>

      {/* Center: Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {links.map(l => {
          const active = pathname === l.href || (l.href !== '/dashboard' && l.href !== '/admin' && pathname.startsWith(l.href))
          return (
            <Link key={l.href} href={l.href} style={{
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              fontSize: '13px', fontWeight: active ? 700 : 500,
              color: active ? '#c93960' : '#6b7280',
              background: active ? '#fdf2f5' : 'transparent',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <span style={{ fontSize: '14px' }}>{l.icon}</span>
              <span style={{ display: 'none' }}>{l.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Right: Admin toggle + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isAdmin && (
          <Link
            href={isAdminArea ? '/dashboard' : '/admin'}
            style={{
              fontSize: '12px', fontWeight: 700, padding: '5px 12px',
              borderRadius: '8px', textDecoration: 'none', transition: 'all .15s',
              background: isAdminArea ? '#c93960' : '#fdf2f5',
              color: isAdminArea ? 'white' : '#c93960',
            }}>
            {isAdminArea ? '← Min side' : 'Admin →'}
          </Link>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 12px', borderRadius: '8px',
          background: '#f9fafb', fontSize: '13px',
        }}>
          <span style={{ color: '#374151', fontWeight: 500, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName ?? 'Bruker'}
          </span>
          <button
            onClick={logout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: '#9ca3af', fontFamily: 'inherit',
              fontWeight: 600, padding: '0 0 0 4px',
              borderLeft: '1px solid #e5e7eb', paddingLeft: '8px',
            }}>
            Logg ut
          </button>
        </div>
      </div>
    </nav>
  )
}
