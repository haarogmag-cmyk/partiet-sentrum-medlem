'use client'

import { saveBudgetEntry } from './economy-actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { useState } from 'react'

const INCOME_CATS = ['kontingent', 'gaver', 'arrangement', 'offentlig_stotte', 'annet_inn']
const EXPENSE_CATS = ['lokale_leie', 'mat_drikke', 'reise', 'materiell', 'annet_ut']

// En smart input-komponent som håndterer lagring selv
function BudgetInput({ category, type, initialAmount, orgId, year }: any) {
    const [amount, setAmount] = useState(initialAmount)
    const [saving, setSaving] = useState(false)

    const handleBlur = async () => {
        // Ikke lagre hvis verdien er uendret
        if (amount === initialAmount) return

        setSaving(true)
        const formData = new FormData()
        formData.append('orgId', orgId)
        formData.append('year', year.toString())
        formData.append('category', category)
        formData.append('type', type)
        formData.append('amount', amount.toString())

        const res = await saveBudgetEntry(formData)
        setSaving(false)

        if (res?.error) toast.error('Kunne ikke lagre')
        else toast.success(`${category} lagret!`, { duration: 1500 })
    }

    return (
        <div className="relative">
            <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                onBlur={handleBlur}
                disabled={saving}
                className={`w-32 p-2 text-right border rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-ps-primary/50 ${saving ? 'bg-yellow-50 text-yellow-600' : 'bg-white'}`}
            />
            <span className="ml-2 text-xs text-slate-400 font-medium">kr</span>
        </div>
    )
}

export default function BudgetView({ budgetData, orgId, year }: { budgetData: any[], orgId: string, year: number }) {
  
  const getAmount = (cat: string) => budgetData.find(b => b.category === cat)?.amount || 0

  const BudgetRow = ({ category, type }: any) => (
      <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 transition-colors">
          <span className="text-sm font-medium text-ps-text capitalize">{category.replace('_', ' ')}</span>
          <BudgetInput 
            category={category} 
            type={type} 
            initialAmount={getAmount(category)} 
            orgId={orgId} 
            year={year} 
          />
      </div>
  )

  // Summering for visning
  const totalIncome = budgetData.filter(b => b.type === 'income').reduce((a, b) => a + b.amount, 0)
  const totalExpense = budgetData.filter(b => b.type === 'expense').reduce((a, b) => a + b.amount, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* INNTEKTER */}
        <Card className="border-t-4 border-t-green-500">
            <CardHeader title={`Inntektsbudsjett ${year}`} />
            <CardContent>
                <div className="space-y-1">
                    {INCOME_CATS.map(cat => <BudgetRow key={cat} category={cat} type="income" />)}
                </div>
                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Sum Inntekt</span>
                    <span className="text-xl font-black text-green-600">{totalIncome.toLocaleString()} kr</span>
                </div>
            </CardContent>
        </Card>

        {/* UTGIFTER */}
        <Card className="border-t-4 border-t-red-500">
            <CardHeader title={`Utgiftsbudsjett ${year}`} />
            <CardContent>
                <div className="space-y-1">
                    {EXPENSE_CATS.map(cat => <BudgetRow key={cat} category={cat} type="expense" />)}
                </div>
                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Sum Utgift</span>
                    <span className="text-xl font-black text-red-600">{totalExpense.toLocaleString()} kr</span>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}