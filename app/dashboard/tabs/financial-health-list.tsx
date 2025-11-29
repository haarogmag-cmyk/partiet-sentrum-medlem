'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FinancialHealthList({ data, orgType }: { data: any[], orgType: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentFylke = searchParams.get('eco_fylke') // Sjekk om vi er inne i et fylke

  const list = data.map(d => ({
      ...d,
      result: d.actual_income + d.actual_expense,
      status: (d.actual_income + d.actual_expense) >= 0 ? 'positive' : 'negative'
  })).sort((a, b) => b.result - a.result)

  const handleRowClick = (orgName: string, level: string) => {
      if (level === 'local') return;
      const params = new URLSearchParams(searchParams.toString())
      if (level === 'county') {
          params.set('eco_fylke', orgName)
          params.delete('eco_lokal')
      }
      router.replace(`/dashboard?${params.toString()}`)
  }

  // Funksjon for å gå tilbake (opp)
  const goUp = () => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('eco_fylke') // Fjern fylke -> Gå til Nasjonalt
      params.delete('eco_lokal')
      router.replace(`/dashboard?${params.toString()}`)
  }

  return (
    <Card>
        <CardHeader 
            title={`Økonomisk Helse: ${orgType === 'us' ? 'Unge Sentrum' : 'Partiet Sentrum'}`} 
            description="Klikk på et fylke for å se lokallagene." 
            action={
                // VIS TILBAKE-KNAPP HVIS VI ER DYPT NEDE
                currentFylke ? (
                    <Button variant="outline" size="sm" onClick={goUp}>
                        ← Tilbake til oversikt
                    </Button>
                ) : null
            }
        />
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                {/* ... Tabellen er uendret ... */}
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b">
                        <tr>
                            <th className="p-4">Lag / Organisasjon</th>
                            <th className="p-4 text-right">Budsjett (Inn)</th>
                            <th className="p-4 text-right">Faktisk Inn</th>
                            <th className="p-4 text-right">Utgifter</th>
                            <th className="p-4 text-right">Resultat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {list.map((item) => (
                            <tr 
                                key={item.org_id} 
                                onClick={() => handleRowClick(item.org_name, item.level)}
                                className={item.level === 'county' ? "hover:bg-[#fffcf1] cursor-pointer transition-colors group" : ""}
                            >
                                <td className="p-4">
                                    <div className="font-bold text-[#5e1639] group-hover:text-ps-primary flex items-center gap-2">
                                        {item.org_name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
                                        {item.level === 'county' && <span className="text-slate-300 text-xs group-hover:text-ps-primary">→</span>}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-normal uppercase">{item.level === 'county' ? 'Fylkeslag' : 'Lokallag'}</span>
                                </td>
                                <td className="p-4 text-right text-slate-400">{item.budget_income.toLocaleString()}</td>
                                <td className="p-4 text-right text-slate-700">{item.actual_income.toLocaleString()}</td>
                                <td className="p-4 text-right text-red-400">{item.actual_expense.toLocaleString()}</td>
                                <td className="p-4 text-right">
                                    <Badge variant={item.status === 'positive' ? 'success' : 'danger'}>
                                        {item.result > 0 ? '+' : ''}{item.result.toLocaleString()} kr
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                        {list.length === 0 && (
                            <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Ingen data funnet på dette nivået.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
  )
}