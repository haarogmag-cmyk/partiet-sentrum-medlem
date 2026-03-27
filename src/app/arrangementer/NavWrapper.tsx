'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import PortalNav from '@/components/PortalNav'

export default function NavWrapper() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState<string | undefined>()

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data } = await sb.from('profiles').select('full_name, is_admin').eq('id', user.id).single()
      if (data) {
        setIsAdmin(data.is_admin ?? false)
        setUserName(data.full_name ?? undefined)
      }
    }
    load()
  }, [])

  return <PortalNav isAdmin={isAdmin} userName={userName} />
}
