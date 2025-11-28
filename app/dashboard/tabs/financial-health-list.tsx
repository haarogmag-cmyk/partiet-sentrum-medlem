'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FinancialHealthList({ data, orgType }: { data: any[], orgType: string }) {
  
  // Beregn resultat
  const list = data.map(d => ({
      ...d,
      result: d.actual_income + d.actual_expense, // Expense er negativt
      status: (d.actual_income + d.actual_expense) >= 0 ? 'positive' : 'negative'
  })).sort((a, b) => b.result - a.result) // Best øverst

  return (
    <Card>
        <CardHeader 
            title={`Økonomisk Status: ${orgType === 'us' ? 'Unge Sentrum' : 'Partiet Sentrum'}`} 
            description="Oversikt over resultatet (Inntekt - Utgifter) for alle lag." 
        />
        <CardContent className="p-0">
            <div className="overflow-x-auto">
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
                            <tr key={item.org_id} className="hover:bg-[#fffcf1]">
                                <td className="p-4 font-bold text-[#5e1639]">
                                    {item.org_name.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')}
                                    <span className="block text-[10px] text-slate-400 font-normal uppercase">{item.level}</span>
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
                            <tr><td colSpan={5} className="p-6 text-center text-slate-400">Ingen data funnet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
  )
}