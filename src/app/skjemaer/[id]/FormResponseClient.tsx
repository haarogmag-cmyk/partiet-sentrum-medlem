'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Form } from '@/lib/database.types'
import { toast } from 'sonner'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

export default function FormResponseClient({ form }: { form: Form }) {
  const fields = form.fields as unknown as FormField[]
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function update(id: string, value: string | boolean) {
    setValues(prev => ({ ...prev, [id]: value }))
  }

  function validate() {
    for (const field of fields) {
      if (field.required) {
        const val = values[field.id]
        if (val === undefined || val === '' || val === false) {
          toast.error(`«${field.label}» er påkrevd.`)
          return false
        }
      }
    }
    return true
  }

  async function submit() {
    if (!validate()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('form_responses').insert({
      form_id: form.id,
      profile_id: user?.id ?? null,
      respondent_name: (values['name'] as string) ?? null,
      respondent_email: (values['email'] as string) ?? null,
      data: values,
    })

    if (error) {
      toast.error('Klarte ikke å sende inn. Prøv igjen.')
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div className="max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
          <h1 className="text-2xl font-black text-ps-primary mb-3">Takk for påmeldingen!</h1>
          <p className="text-slate-500">Vi har mottatt svaret ditt på «{form.title}».</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-ps-primary mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-slate-500">{form.description}</p>
          )}
          {form.closes_at && (
            <p className="text-xs text-slate-400 mt-2">
              Stenger {new Date(form.closes_at).toLocaleDateString('nb-NO', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-5">
          {fields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-semibold text-ps-text mb-1.5">
                {field.label}
                {field.required && <span className="text-ps-primary ml-1">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  value={(values[field.id] as string) ?? ''}
                  onChange={e => update(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  value={(values[field.id] as string) ?? ''}
                  onChange={e => update(field.id, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all bg-white"
                >
                  <option value="">Velg...</option>
                  {(field.options ?? []).filter(Boolean).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(values[field.id] as boolean) ?? false}
                    onChange={e => update(field.id, e.target.checked)}
                    className="w-4 h-4 rounded text-ps-primary focus:ring-ps-primary"
                  />
                  <span className="text-sm text-slate-600">{field.placeholder || field.label}</span>
                </label>
              ) : (
                <input
                  type={field.type}
                  value={(values[field.id] as string) ?? ''}
                  onChange={e => update(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ps-primary focus:ring-2 focus:ring-ps-primary/20 outline-none text-sm transition-all"
                />
              )}
            </div>
          ))}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-ps-primary text-white font-bold text-sm hover:bg-ps-dark transition-colors disabled:opacity-40 shadow-sm hover:shadow-md mt-2"
          >
            {loading ? 'Sender...' : 'Send inn påmelding →'}
          </button>
        </div>
      </div>
    </div>
  )
}
