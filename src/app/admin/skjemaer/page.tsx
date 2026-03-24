'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

type FieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // for select fields
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Tekst', icon: '✏️' },
  { value: 'email', label: 'E-post', icon: '📧' },
  { value: 'tel', label: 'Telefon', icon: '📱' },
  { value: 'number', label: 'Tall', icon: '🔢' },
  { value: 'textarea', label: 'Lang tekst', icon: '📝' },
  { value: 'select', label: 'Nedtrekksliste', icon: '📋' },
  { value: 'checkbox', label: 'Avkrysning', icon: '☑️' },
  { value: 'date', label: 'Dato', icon: '📅' },
]

function newField(type: FieldType = 'text'): FormField {
  return {
    id: Math.random().toString(36).slice(2, 8),
    type,
    label: '',
    placeholder: '',
    required: false,
    options: type === 'select' ? [''] : undefined,
  }
}

export default function NyttSkjemaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [requiresMembership, setRequiresMembership] = useState(false)
  const [fields, setFields] = useState<FormField[]>([newField('text')])

  function addField(type: FieldType) {
    setFields(prev => [...prev, newField(type)])
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  function removeField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id))
  }

  function moveField(id: string, dir: -1 | 1) {
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function updateOption(fieldId: string, optIdx: number, value: string) {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f
      const opts = [...(f.options ?? [])]
      opts[optIdx] = value
      return { ...f, options: opts }
    }))
  }

  function addOption(fieldId: string) {
    setFields(prev => prev.map(f =>
      f.id === fieldId ? { ...f, options: [...(f.options ?? []), ''] } : f
    ))
  }

  function removeOption(fieldId: string, optIdx: number) {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f
      const opts = (f.options ?? []).filter((_, i) => i !== optIdx)
      return { ...f, options: opts }
    }))
  }

  async function save(active: boolean) {
    if (!title.trim()) { toast.error('Tittel er påkrevd.'); return }
    if (fields.some(f => !f.label.trim())) { toast.error('Alle felt må ha en etikett.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { error } = await supabase.from('forms').insert({
      title,
      description: description || null,
      slug,
      fields: fields as unknown as import('@/lib/database.types').Json,
      is_active: active,
      requires_membership: requiresMembership,
      closes_at: closesAt || null,
      created_by: user.id,
    })

    if (error) {
      toast.error('Klarte ikke å lagre skjemaet.')
    } else {
      toast.success(active ? 'Skjemaet er publisert!' : 'Utkast lagret.')
      router.push('/admin')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
            ← Admin
          </Link>
          <span className="text-slate-200">|</span>
          <span className="font-bold text-ps-text text-sm">Nytt skjema</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-black text-ps-text">Bygg påmeldingsskjema</h1>

        {/* Skjema-info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Skjemainfo</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tittel *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Påmelding sommerfest 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Beskrivelse</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Kort beskrivelse av skjemaet"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Stenger</label>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={e => setClosesAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
              />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresMembership}
                  onChange={e => setRequiresMembership(e.target.checked)}
                  className="w-4 h-4 rounded text-ps-primary"
                />
                <span className="text-sm font-medium text-slate-600">Krever medlemskap</span>
              </label>
            </div>
          </div>
        </div>

        {/* Felt-bygger */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Felt</h2>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3"
              >
                {/* Field header */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {FIELD_TYPES.find(t => t.value === field.type)?.icon ?? '✏️'}
                  </span>
                  <select
                    value={field.type}
                    onChange={e => updateField(field.id, { type: e.target.value as FieldType, options: e.target.value === 'select' ? [''] : undefined })}
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                  >
                    {FIELD_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => moveField(field.id, -1)}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 text-xs"
                    >↑</button>
                    <button
                      onClick={() => moveField(field.id, 1)}
                      disabled={idx === fields.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 text-xs"
                    >↓</button>
                    <button
                      onClick={() => removeField(field.id)}
                      disabled={fields.length === 1}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 text-xs ml-1"
                    >✕</button>
                  </div>
                </div>

                {/* Label + placeholder */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Etikett *</label>
                    <input
                      value={field.label}
                      onChange={e => updateField(field.id, { label: e.target.value })}
                      placeholder="Fullt navn"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-ps-primary outline-none text-sm bg-white"
                    />
                  </div>
                  {field.type !== 'checkbox' && field.type !== 'select' && field.type !== 'date' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Plassholdertekst</label>
                      <input
                        value={field.placeholder ?? ''}
                        onChange={e => updateField(field.id, { placeholder: e.target.value })}
                        placeholder="Ola Nordmann"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-ps-primary outline-none text-sm bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Options for select */}
                {field.type === 'select' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Alternativer</label>
                    <div className="space-y-2">
                      {(field.options ?? []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2">
                          <input
                            value={opt}
                            onChange={e => updateOption(field.id, optIdx, e.target.value)}
                            placeholder={`Alternativ ${optIdx + 1}`}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:border-ps-primary outline-none text-sm bg-white"
                          />
                          <button
                            onClick={() => removeOption(field.id, optIdx)}
                            disabled={(field.options?.length ?? 0) <= 1}
                            className="px-2 py-1.5 text-red-400 hover:text-red-600 disabled:opacity-30 text-sm"
                          >✕</button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(field.id)}
                        className="text-xs text-ps-primary font-semibold hover:underline"
                      >
                        + Legg til alternativ
                      </button>
                    </div>
                  </div>
                )}

                {/* Required toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4 rounded text-ps-primary"
                  />
                  <span className="text-xs font-medium text-slate-500">Påkrevd felt</span>
                </label>
              </div>
            ))}
          </div>

          {/* Add field */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 mb-3">Legg til felt:</p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => addField(t.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-ps-primary/10 hover:text-ps-primary text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Forhåndsvisning</h2>
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-semibold text-ps-text mb-1.5">
                  {field.label || <span className="text-slate-300 italic">Ingen etikett</span>}
                  {field.required && <span className="text-ps-primary ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    disabled
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none opacity-60"
                  />
                ) : field.type === 'select' ? (
                  <select disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm opacity-60">
                    <option>Velg...</option>
                    {(field.options ?? []).filter(Boolean).map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 opacity-60">
                    <input type="checkbox" disabled className="w-4 h-4 rounded" />
                    <span className="text-sm text-slate-600">{field.placeholder || field.label}</span>
                  </label>
                ) : (
                  <input
                    disabled
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm opacity-60"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => save(false)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-300 transition-colors disabled:opacity-40"
          >
            Lagre utkast
          </button>
          <button
            onClick={() => save(true)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 shadow-sm"
          >
            {loading ? 'Lagrer...' : 'Publiser skjema ✓'}
          </button>
        </div>
      </main>
    </div>
  )
}
