'use client'

import { useState } from 'react'
import { saveBudgetEntry } from './economy-actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const INCOME_CATS = ['kontingent', 'gaver', 'arrangement', 'offentlig_stotte', 'annet_inn']
const EXPENSE_CATS = ['lokale_leie', 'mat_drikke', 'reise', 'materiell', 'annet_ut']

export default function BudgetView({ budgetData, orgId, year }: { budgetData: any[], orgId: string, year: number }) {
  
  // Hjelpefunksjon for å finne tall
  const getAmount = (cat: string) => budgetData.find(b => b.category === cat)?.amount || 0

  const handleSave = async (formData: FormData) => {
      const res = await saveBudgetEntry(formData)
      if (res?.error) toast.error(res.error)
      else toast.success('Budsjettpost lagret')
  }

  // En liten komponent for hver linje for å spare kode
  const BudgetRow = ({ category, type, label }: any) => (
      <form action={handleSave} className="flex items-center justify-between py-2 border-b border-slate-50">
          <span className="text-sm font-medium text-slate-600 w-1/3">{label || category}</span>
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="type" value={type} />
          <div className="flex items-center gap-2">
              <input 
                  name="amount" 
                  type="number" 
                  defaultValue={getAmount(category)} 
                  className="w-32 p-1 text-right border rounded text-sm"
              />
              <span className="text-xs text-slate-400">kr</span>
              <Button size="sm" variant="ghost" type="submit">💾</Button>
          </div>
      </form>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader title={`Inntektsbudsjett ${year}`} />
            <CardContent>
                {INCOME_CATS.map(cat => <BudgetRow key={cat} category={cat} type="income" />)}
                <div className="mt-4 pt-4 border-t font-bold flex justify-between">
                    <span>TOTAL INNTEKT</span>
                    <span>{budgetData.filter(b => b.type === 'income').reduce((a, b) => a + b.amount, 0).toLocaleString()} kr</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader title={`Utgiftsbudsjett ${year}`} />
            <CardContent>
                {EXPENSE_CATS.map(cat => <BudgetRow key={cat} category={cat} type="expense" />)}
                <div className="mt-4 pt-4 border-t font-bold flex justify-between text-red-600">
                    <span>TOTAL UTGIFT</span>
                    <span>{budgetData.filter(b => b.type === 'expense').reduce((a, b) => a + b.amount, 0).toLocaleString()} kr</span>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}