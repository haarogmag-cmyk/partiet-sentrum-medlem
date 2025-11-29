'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

type Period = '1w' | '1m' | '6m' | '1y' | 'all'

// Tar imot filtre fra parent
export default function GrowthChart({ filters }: { filters: { org: string, fylke: string, lokal: string } }) {
  const [data, setData] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('1m')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()
      
      const now = new Date()
      let startDate = new Date()
      
      if (period === '1w') startDate.setDate(now.getDate() - 7)
      if (period === '1m') startDate.setMonth(now.getMonth() - 1)
      if (period === '6m') startDate.setMonth(now.getMonth() - 6)
      if (period === '1y') startDate.setFullYear(now.getFullYear() - 1)
      if (period === 'all') startDate = new Date(2020, 0, 1)

      // Vask navnene (Fjern prefiks for å matche postal_codes i databasen)
      const cleanFylke = filters.fylke && filters.fylke !== 'alle' 
        ? filters.fylke.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '') 
        : null;
        
      const cleanLokal = filters.lokal && filters.lokal !== 'alle'
        ? filters.lokal.replace('Partiet Sentrum ', '').replace('Unge Sentrum ', '')
        : null;

      const { data: stats, error } = await supabase.rpc('get_member_stats', {
        start_date: startDate.toISOString(),
        filter_org_type: filters.org === 'us' ? 'us' : 'ps',
        filter_county: cleanFylke,
        filter_municipality: cleanLokal
      })

      if (stats) {
        const formatted = stats.map((item: any) => ({
          ...item,
          dato: new Date(item.date_bucket).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
        }))
        setData(formatted)
      }
      setLoading(false)
    }
    fetchData()
  }, [period, filters]) // Oppdater når filter endres!

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader 
        title="Medlemsutvikling" 
        description="Nye innmeldinger vs. utmeldinger i valgt utvalg"
        action={
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {['1w', '1m', '6m', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as Period)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  period === p ? 'bg-white shadow text-ps-primary' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />
      <CardContent className="flex-1 min-h-0 pb-2">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 animate-pulse">Henter tall...</div>
        ) : (
          <div className="w-full h-full text-xs">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dato" tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} allowDecimals={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle"/>
                
                <Area 
                    type="monotone" 
                    dataKey="new_members" 
                    name="Nye medlemmer"
                    stroke="#16a34a" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorNew)" 
                />
                <Area 
                    type="monotone" 
                    dataKey="resignations" 
                    name="Utmeldinger"
                    stroke="#dc2626" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorOut)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}