'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  isAdmin?: boolean
  userName?: string
}

const NAV_LINKS = [
  { href: '/dashboard',     label: 'Oversikt',      icon: '⊞' },
  { href: '/arrangementer', label: 'Arrangementer',  icon: '📅' },
  { href: '/skjemaer',      label: 'Skjemaer',       icon: '📋' },
  { href: '/profil',        label: 'Min profil',     icon: '👤' },
]

const ADMIN_LINKS = [
  { href: '/admin',                   label: 'Admin',         icon: '📊' },
  { href: '/admin/members',           label: 'Medlemmer',      icon: '👥' },
  { href: '/admin/arrangementer',     label: 'Arrangementer',  icon: '📅' },
]

export default function PortalNav({ isAdmin, userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdminArea = pathname.startsWith('/admin')

  async function logout() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = isAdminArea ? ADMIN_LINKS : NAV_LINKS

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #f3f4f6',
      padding: '0 24px', height: '64px', // Litt høyere for bedre plass
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
    }}>
      {/* Left: Logo */}
      <Link href={isAdminArea ? "/admin" : "/dashboard"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px', height: '32px', background: '#c93960', color: 'white',
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: '18px'
        }}>P</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f0f1a', lineHeight: 1.2 }}>Sentrum</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#c93960' }}>
            {isAdminArea ? 'Administrator' : 'Medlemsportal'}
          </span>
        </div>
      </Link>

      {/* Center: Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {links.map(l => {
          const active = pathname === l.href || (l.href !== '/dashboard' && l.href !== '/admin' && pathname.startsWith(l.href))
          return (
            <Link key={l.href} href={l.href} style={{
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '10px',
              fontSize: '13px', fontWeight: active ? 700 : 500,
              color: active ? '#c93960' : '#4b5563',
              background: active ? '#fdf2f5' : 'transparent',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <span style={{ fontSize: '16px' }}>{l.icon}</span>
              <span style={{ display: 'inline-block' }}>{l.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Right: User + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAdmin && (
           <Link
             href={isAdminArea ? '/dashboard' : '/admin'}
             style={{
               fontSize: '11px', fontWeight: 800, padding: '6px 12px',
               borderRadius: '8px', textDecoration: 'none',
               background: isAdminArea ? '#f3f4f6' : '#c93960',
               color: isAdminArea ? '#4b5563' : 'white',
               textTransform: 'uppercase', letterSpacing: '.05em'
             }}>
             {isAdminArea ? '← Medlemsside' : 'Admin-panel'}
           </Link>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px', borderLeft: '1px solid #f3f4f6' }}>
          <div style={{ textAlign: 'right', display: 'none', sm: 'block' } as any}>
             <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f0f1a', margin: 0 }}>{userName?.split(' ')[0] ?? 'Bruker'}</p>
             <button onClick={logout} style={{ background: 'none', border: 'none', padding: 0, color: '#c93960', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Logg ut</button>
          </div>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
        </div>
      </div>
    </nav>
  )
}
