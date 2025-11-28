'use client'

import { useState } from 'react'
import { addAccountEntry } from './economy-actions'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Props {
    orgId: string
    year: number
    manualEntries: any[]    // Manuelle bilag fra databasen
    automaticIncome: any[]  // Beregnede inntekter (Kontingent + Events)
}

export default function AccountingView({ orgId, year, manualEntries, automaticIncome }: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  // Slå sammen automatiske og manuelle poster til én liste
  const allEntries = [
      ...automaticIncome.map(i => ({ ...i, source: 'auto', description: i.category === 'kontingent' ? 'Medlemskontingent (Auto)' : 'Arrangementer (Auto)' })),
      ...manualEntries.map(i => ({ ...i, source: 'manual' }))
  ].sort((a, b) => new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime())

  const handleAdd = async (formData: FormData) => {
      setLoading(true)
      // Legg til skjulte felt
      formData.append('orgId', orgId)
      formData.append('type', formData.get('amount')?.toString().startsWith('-') ? 'expense' : 'income') // Enkel logikk: Negativt tall = utgift
      
      const res = await addAccountEntry(formData)
      setLoading(false)

      if (res?.error) {
          toast.error(res.error)
      } else {
          toast.success('Bilag registrert!')
          setIsAdding(false)
      }
  }

  return (
    <div className="space-y-6">
        
        {/* HEADER & KNAPP */}
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-[#5e1639]">Regnskap {year}</h3>
            <Button onClick={() => setIsAdding(!isAdding)} variant="secondary" className="text-xs">
                {isAdding ? 'Avbryt' : '+ Registrer bilag'}
            </Button>
        </div>

        {/* SKJEMA FOR NYTT BILAG */}
        {isAdding && (
            <Card className="border-2 border-dashed border-ps-primary/20 bg-[#fffcf1]">
                <CardContent className="p-4">
                    <form action={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-bold uppercase text-slate-500">Beskrivelse</label>
                            <input name="description" required className="w-full p-2 border rounded" placeholder="F.eks. Leie av lokale" />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-xs font-bold uppercase text-slate-500">Kategori</label>
                            <select name="category" className="w-full p-2 border rounded bg-white">
                                <option value="annet_ut">Annet (Utgift)</option>
                                <option value="lokale_leie">Lokale leie</option>
                                <option value="mat_drikke">Mat & Drikke</option>
                                <option value="reise">Reise</option>
                                <option value="materiell">Materiell</option>
                                <option value="gaver">Gaver (Inntekt)</option>
                            </select>
                        </div>
                        <div className="w-full md:w-32">
                            <label className="text-xs font-bold uppercase text-slate-500">Beløp</label>
                            <input name="amount" type="number" required className="w-full p-2 border rounded" placeholder="-500" />
                            <p className="text-[10px] text-slate-400">Minus for utgift</p>
                        </div>
                        <Button type="submit" isLoading={loading}>Lagre</Button>
                    </form>
                </CardContent>
            </Card>
        )}

        {/* TABELL OVER TRANSAKSJONER */}
        <Card>
            <CardContent className="p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="p-3">Dato</th>
                            <th className="p-3">Beskrivelse</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3 text-right">Beløp</th>
                            <th className="p-3 text-right">Kilde</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {allEntries.map((entry: any, i) => (
                            <tr key={i} className="hover:bg-[#fffcf1]">
                                <td className="p-3 text-slate-400 font-mono text-xs">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'Nå'}
                                </td>
                                <td className="p-3 font-medium text-[#5e1639]">{entry.description}</td>
                                <td className="p-3">
                                    <Badge variant="neutral" className="text-[10px]">{entry.category}</Badge>
                                </td>
                                <td className={`p-3 text-right font-bold ${entry.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {entry.amount.toLocaleString()} kr
                                </td>
                                <td className="p-3 text-right text-xs text-slate-400 uppercase font-bold">
                                    {entry.source === 'auto' ? '⚡ Auto' : '👤 Manuell'}
                                </td>
                            </tr>
                        ))}
                        {allEntries.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Ingen transaksjoner registrert.</td></tr>
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    </div>
  )
}