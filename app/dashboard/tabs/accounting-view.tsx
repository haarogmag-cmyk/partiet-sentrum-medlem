'use client'

import { useState } from 'react'
import { addAccountEntry, deleteAccountEntry } from './economy-actions' // <--- IMPORTER DELETE
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Props {
    orgId: string
    year: number
    manualEntries: any[]
    automaticIncome: any[]
}

export default function AccountingView({ orgId, year, manualEntries, automaticIncome }: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const allEntries = [
      ...automaticIncome.map(i => ({ ...i, source: 'auto', description: i.category === 'kontingent' ? 'Medlemskontingent (Auto)' : 'Arrangementer (Auto)' })),
      ...manualEntries.map(i => ({ ...i, source: 'manual' }))
  ].sort((a, b) => new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime())

  const handleAdd = async (formData: FormData) => {
      setLoading(true)
      formData.append('orgId', orgId)
      formData.append('type', formData.get('amount')?.toString().startsWith('-') ? 'expense' : 'income')
      
      const res = await addAccountEntry(formData)
      setLoading(false)

      if (res?.error) toast.error(res.error)
      else {
          toast.success('Bilag registrert!')
          setIsAdding(false)
      }
  }

  // NY FUNKSJON: SLETT
  const handleDelete = async (id: string) => {
      if(!confirm('Er du sikker på at du vil slette dette bilaget?')) return;
      const res = await deleteAccountEntry(id)
      if(res?.error) toast.error(res.error)
      else toast.success('Bilag slettet')
  }

  return (
    <div className="space-y-6">
        
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-[#5e1639]">Regnskap {year}</h3>
            <Button onClick={() => setIsAdding(!isAdding)} variant="secondary">
                {isAdding ? 'Avbryt' : '+ Registrer bilag'}
            </Button>
        </div>

        {isAdding && (
            <Card className="border-2 border-dashed border-ps-primary/20 bg-[#fffcf1] animate-in fade-in slide-in-from-top-2">
                <CardContent className="p-6">
                    <h4 className="font-bold text-sm uppercase text-ps-primary mb-4">Nytt Bilag</h4>
                    <form action={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Beskrivelse</label>
                            <input name="description" required className="w-full p-2.5 border rounded-lg" placeholder="F.eks. Leie av lokale" />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Kategori</label>
                            <select name="category" className="w-full p-2.5 border rounded-lg bg-white">
                                <option value="annet_ut">Annet (Utgift)</option>
                                <option value="lokale_leie">Lokale leie</option>
                                <option value="mat_drikke">Mat & Drikke</option>
                                <option value="reise">Reise</option>
                                <option value="materiell">Materiell</option>
                                <option value="gaver">Gaver (Inntekt)</option>
                                <option value="annet_inn">Annen inntekt</option>
                            </select>
                        </div>
                        <div className="w-full md:w-32">
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Beløp</label>
                            <input name="amount" type="number" required className="w-full p-2.5 border rounded-lg" placeholder="-500" />
                        </div>
                        <Button type="submit" isLoading={loading}>Lagre</Button>
                    </form>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardContent className="p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase">
                        <tr>
                            <th className="p-4">Dato</th>
                            <th className="p-4">Beskrivelse</th>
                            <th className="p-4">Kategori</th>
                            <th className="p-4 text-right">Beløp</th>
                            <th className="p-4 text-right">Handling</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {allEntries.map((entry: any, i) => (
                            <tr key={i} className="hover:bg-[#fffcf1] group transition-colors">
                                <td className="p-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString('no-NO') : 'Nå'}
                                </td>
                                <td className="p-4 font-medium text-ps-text">
                                    {entry.description}
                                    {entry.source === 'auto' && <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">AUTO</span>}
                                </td>
                                <td className="p-4">
                                    <Badge variant="neutral">{entry.category.replace('_', ' ')}</Badge>
                                </td>
                                <td className={`p-4 text-right font-bold ${entry.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {entry.amount.toLocaleString()} kr
                                </td>
                                <td className="p-4 text-right">
                                    {/* SLETT KNAPP (Kun for manuelle) */}
                                    {entry.source === 'manual' && (
                                        <button 
                                            onClick={() => handleDelete(entry.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Slett bilag"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {allEntries.length === 0 && (
                            <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Ingen transaksjoner registrert i år.</td></tr>
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    </div>
  )
}