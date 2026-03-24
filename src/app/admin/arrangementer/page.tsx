'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export default function NyttArrangementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    starts_at: '',
    ends_at: '',
    is_online: false,
    online_url: '',
    max_attendees: '',
    requires_membership: false,
    fylkeslag_id: '',
  })

  function update(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(publish: boolean) {
    if (!form.title || !form.starts_at) {
      toast.error('Tittel og startdato er påkrevd.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('events').insert({
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
      is_online: form.is_online,
      online_url: form.online_url || null,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      requires_membership: form.requires_membership,
      fylkeslag_id: form.fylkeslag_id ? parseInt(form.fylkeslag_id) : null,
      is_published: publish,
      created_by: user.id,
    })

    if (error) {
      toast.error('Klarte ikke å opprette arrangementet.')
    } else {
      toast.success(publish ? 'Arrangementet er publisert!' : 'Utkast lagret.')
      router.push('/admin')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
            ← Admin
          </Link>
          <span className="text-slate-200">|</span>
          <span className="font-bold text-ps-text text-sm">Nytt arrangement</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-ps-text mb-6">Opprett arrangement</h1>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tittel *</label>
            <input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Medlemsmøte Oslo"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Beskrivelse</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              rows={3}
              placeholder="Hva skal skje på arrangementet?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Starter *</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={e => update('starts_at', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Slutter</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={e => update('ends_at', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sted</label>
            <input
              value={form.location}
              onChange={e => update('location', e.target.value)}
              placeholder="Storgata 1, Oslo"
              disabled={form.is_online}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_online"
              checked={form.is_online}
              onChange={e => update('is_online', e.target.checked)}
              className="w-4 h-4 rounded text-ps-primary focus:ring-ps-primary"
            />
            <label htmlFor="is_online" className="text-sm font-medium text-slate-600">
              Nettarrangement
            </label>
          </div>

          {form.is_online && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Møtelenke</label>
              <input
                value={form.online_url}
                onChange={e => update('online_url', e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Maks deltakere</label>
              <input
                type="number"
                value={form.max_attendees}
                onChange={e => update('max_attendees', e.target.value)}
                placeholder="Ubegrenset"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fylkeslag</label>
              <select
                value={form.fylkeslag_id}
                onChange={e => update('fylkeslag_id', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary outline-none text-sm bg-white"
              >
                <option value="">Alle fylker</option>
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
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requires_membership"
              checked={form.requires_membership}
              onChange={e => update('requires_membership', e.target.checked)}
              className="w-4 h-4 rounded text-ps-primary focus:ring-ps-primary"
            />
            <label htmlFor="requires_membership" className="text-sm font-medium text-slate-600">
              Krever aktivt medlemskap
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-300 transition-colors disabled:opacity-40"
            >
              Lagre utkast
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 shadow-sm"
            >
              {loading ? 'Lagrer...' : 'Publiser arrangement'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
