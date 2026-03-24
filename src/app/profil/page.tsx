'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'
import { toast } from 'sonner'

export default function ProfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    birth_year: '',
    fylkeslag_id: '',
    lokallag: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          postal_code: data.postal_code ?? '',
          city: data.city ?? '',
          birth_year: data.birth_year?.toString() ?? '',
          fylkeslag_id: data.fylkeslag_id?.toString() ?? '',
          lokallag: data.lokallag ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [router])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name || null,
        phone: form.phone || null,
        address: form.address || null,
        postal_code: form.postal_code || null,
        city: form.city || null,
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        fylkeslag_id: form.fylkeslag_id ? parseInt(form.fylkeslag_id) : null,
        lokallag: form.lokallag || null,
      })
      .eq('id', profile.id)

    if (error) {
      toast.error('Klarte ikke å lagre endringene.')
    } else {
      toast.success('Profilen er oppdatert!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ps-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
            ← Dashboard
          </Link>
          <span className="text-slate-200">|</span>
          <span className="font-bold text-ps-text text-sm">Min profil</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-ps-text mb-6">Min profil</h1>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fullt navn</label>
            <input
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Telefon</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fødselsår</label>
              <input
                type="number"
                value={form.birth_year}
                onChange={e => update('birth_year', e.target.value)}
                placeholder="1990"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Adresse</label>
            <input
              value={form.address}
              onChange={e => update('address', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Postnr</label>
              <input
                value={form.postal_code}
                onChange={e => update('postal_code', e.target.value)}
                maxLength={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sted</label>
              <input
                value={form.city}
                onChange={e => update('city', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fylkeslag</label>
              <select
                value={form.fylkeslag_id}
                onChange={e => update('fylkeslag_id', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all bg-white"
              >
                <option value="">Velg fylke</option>
                <option value="1">Oslo</option>
                <option value="2">Akershus</option>
                <option value="3">Østfold</option>
                <option value="4">Innlandet</option>
                <option value="5">Buskerud</option>
                <option value="6">Vestfold og Telemark</option>
                <option value="7">Agder</option>
                <option value="8">Rogaland</option>
                <option value="9">Vestland</option>
                <option value="10">Møre og Romsdal</option>
                <option value="11">Trøndelag</option>
                <option value="12">Nordland</option>
                <option value="13">Troms og Finnmark</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Lokallag</label>
              <input
                value={form.lokallag}
                onChange={e => update('lokallag', e.target.value)}
                placeholder="Valgfritt"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 shadow-sm hover:shadow-md"
            >
              {saving ? 'Lagrer...' : 'Lagre endringer'}
            </button>
          </div>
        </div>

        {/* Membership info (read-only) */}
        <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Medlemskapsinfo</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold capitalize ${
                profile?.membership_status === 'aktiv' ? 'text-green-600' : 'text-slate-400'
              }`}>
                {profile?.membership_status ?? '–'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Etype</span>
              <span className="font-semibold text-ps-text">
                {profile?.membership_type ? profile.membership_type : '–'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Medlem siden</span>
              <span className="font-semibold text-ps-text">
                {profile?.membership_start
                  ? new Date(profile.membership_start).toLocaleDateString('nb-NO')
                  : '–'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
