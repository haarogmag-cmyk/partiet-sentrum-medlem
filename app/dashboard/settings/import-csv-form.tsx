'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { importMembersFromCSV } from './import-actions'

export default function ImportCSVForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setResult(null)

    const fileInput = formData.get('csvFile') as File

    if (!fileInput || fileInput.size === 0) {
      setLoading(false)
      toast.error('Vennligst velg en CSV-fil.')
      return
    }

    const res = await importMembersFromCSV(formData)
    setLoading(false)

    if (res?.success) {
      setResult(res.message)
      toast.success('Import fullført!')
    } else {
      toast.error(`Import feilet: ${res?.error}`)
      setResult(res?.error || 'Feil ved import')
    }
  }

  return (
    <Card className="border-l-4 border-l-ps-primary">
      <CardHeader
        title="CSV Masseimport"
        description="Importer medlemmer fra en Excel-fil (CSV-format) med riktig kolonnestruktur."
      />
      <CardContent className="space-y-4">

        <div className="bg-ps-primary/5 p-4 rounded-lg text-sm border border-ps-primary/10">
          <p className="font-bold mb-2">Krav til CSV-fil:</p>
          <p className="text-xs">
            Filen må inneholde disse kolonnene i overskriften (case-sensitive):
          </p>
          <code className="block bg-white p-2 mt-1 rounded text-xs font-mono">
            email, first_name, last_name, phone, postal_code, is_youth
          </code>
          <p className="text-xs mt-2">
            Alle importerte brukere får passordet: <strong>Password1</strong> (de må bruke Magic Link for å logge inn første gang).
          </p>
        </div>

        {/* onSubmit brukes i stedet for action */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleSubmit(formData)
          }}
          className="space-y-4"
        >
          <input
            type="file"
            name="csvFile"
            accept=".csv"
            required
            className="w-full p-2 border rounded-lg bg-slate-50"
          />

          <Button type="submit" isLoading={loading} className="w-full md:w-auto">
            📥 Start Import
          </Button>
        </form>

        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.includes('Fullført')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            <p className="font-bold">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
