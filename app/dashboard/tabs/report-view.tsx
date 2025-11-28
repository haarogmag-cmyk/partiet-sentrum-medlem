import { Card, CardHeader, CardContent } from '@/components/ui/card'

// Hjelpefunksjon for å summere kategorier
function sumByCategory(items: any[], category: string) {
    return items.filter(i => i.category === category).reduce((sum, item) => sum + item.amount, 0)
}

export default function ReportView({ budget, accounting }: { budget: any[], accounting: any[] }) {
  
  // Vi trenger en liste over ALLE unike kategorier som finnes i enten budsjett eller regnskap
  const categories = Array.from(new Set([
      ...budget.map(b => b.category),
      ...accounting.map(a => a.category)
  ]));

  // Skiller inntekt og utgift for ryddighet
  const incomeCats = categories.filter(c => !['lokale_leie','mat_drikke','reise','materiell','annet_ut'].includes(c));
  const expenseCats = categories.filter(c => ['lokale_leie','mat_drikke','reise','materiell','annet_ut'].includes(c));

  const Row = ({ cat }: { cat: string }) => {
      const plan = sumByCategory(budget, cat);
      const real = Math.abs(sumByCategory(accounting, cat)); // Vis utgifter som positive tall i rapporten
      const diff = real - plan;
      const isExpense = expenseCats.includes(cat);
      
      // Fargekoding: Grønn er bra (Mer inntekt enn planlagt, eller mindre utgift enn planlagt)
      const isGood = isExpense ? diff <= 0 : diff >= 0;
      
      return (
          <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded">
              <span className="capitalize text-sm font-medium text-slate-700 w-1/3">{cat.replace('_', ' ')}</span>
              <div className="flex-1 grid grid-cols-3 gap-4 text-right text-sm">
                  <span className="text-slate-400">{plan.toLocaleString()}</span>
                  <span className="font-bold text-[#5e1639]">{real.toLocaleString()}</span>
                  <span className={`font-mono text-xs ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                      {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                  </span>
              </div>
          </div>
      )
  }

  const totalBudgetResult = budget.reduce((sum, b) => b.type === 'expense' ? sum - b.amount : sum + b.amount, 0);
  const totalRealResult = accounting.reduce((sum, a) => sum + a.amount, 0); // Utgifter er allerede negative i accounting

  return (
    <div className="space-y-6">
        <h3 className="font-bold text-lg text-[#5e1639]">Årsrapport (Hittil i år)</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* INNTEKTER */}
            <Card className="border-l-4 border-green-500">
                <CardHeader title="Inntekter" />
                <CardContent className="pt-0">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2 px-2">
                        <span className="w-1/3">Post</span>
                        <div className="flex-1 grid grid-cols-3 text-right">
                            <span>Budsjett</span><span>Faktisk</span><span>Avvik</span>
                        </div>
                    </div>
                    {incomeCats.map(c => <Row key={c} cat={c} />)}
                </CardContent>
            </Card>

            {/* UTGIFTER */}
            <Card className="border-l-4 border-red-500">
                <CardHeader title="Utgifter" />
                <CardContent className="pt-0">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2 px-2">
                        <span className="w-1/3">Post</span>
                        <div className="flex-1 grid grid-cols-3 text-right">
                            <span>Budsjett</span><span>Faktisk</span><span>Avvik</span>
                        </div>
                    </div>
                    {expenseCats.map(c => <Row key={c} cat={c} />)}
                </CardContent>
            </Card>
        </div>

        {/* TOTALT RESULTAT */}
        <Card className={totalRealResult >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            <CardContent className="p-6 flex justify-between items-center">
                <div>
                    <h4 className="text-lg font-bold text-[#5e1639]">Årsresultat</h4>
                    <p className="text-sm text-slate-500">Budsjattert resultat: {totalBudgetResult.toLocaleString()} kr</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-[#5e1639]">{totalRealResult.toLocaleString()} kr</p>
                    <p className={`text-sm font-bold ${totalRealResult >= totalBudgetResult ? 'text-green-600' : 'text-red-600'}`}>
                        {totalRealResult >= totalBudgetResult ? 'Bedre enn budsjett' : 'Dårligere enn budsjett'}
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}