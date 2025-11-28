'use client'

import { useState } from 'react'
import { updateVolunteerProfile } from './volunteer-actions'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function VolunteerCard({ currentRoles }: { currentRoles: any }) {
  const [loading, setLoading] = useState(false)
  
  // Standardverdier (hvis null)
  const roles = currentRoles || {}

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const res = await updateVolunteerProfile(formData)
    setLoading(false)

    if (res?.error) toast.error(res.error)
    else toast.success('Takk for at du vil bidra! 🙌')
  }

  return (
    <Card className="border-l-4 border-l-yellow-400">
        <CardHeader 
            title="Vil du bidra?" 
            description="Kryss av for det du kan tenke deg å hjelpe til med i valgkampen." 
        />
        <CardContent>
            <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Checkbox name="stand" label="Stå på stand" defaultChecked={roles.stand} icon="🎪" />
                    <Checkbox name="flyers" label="Dele ut flyers" defaultChecked={roles.flyers} icon="📬" />
                    <Checkbox name="car" label="Har bil / Transport" defaultChecked={roles.car} icon="🚗" />
                    <Checkbox name="writer" label="Skrive leserinnlegg" defaultChecked={roles.writer} icon="✍️" />
                    <Checkbox name="digital" label="Dele i sosiale medier" defaultChecked={roles.digital} icon="📱" />
                    <Checkbox name="call" label="Ringe medlemmer" defaultChecked={roles.call} icon="📞" />
                </div>
                
                <div className="pt-2 flex justify-end">
                    <Button type="submit" isLoading={loading} variant="secondary" className="w-full md:w-auto">
                        Lagre mine valg
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  )
}

// Liten hjelpekomponent for finere checkboxes
function Checkbox({ name, label, defaultChecked, icon }: any) {
    return (
        <label className="flex items-center gap-3 p-3 border border-ps-primary/10 rounded-xl cursor-pointer hover:bg-[#fffcf1] transition-colors group">
            <input 
                type="checkbox" 
                name={name} 
                defaultChecked={defaultChecked} 
                className="w-5 h-5 accent-ps-primary cursor-pointer"
            />
            <span className="flex items-center gap-2 text-sm font-medium text-ps-text group-hover:text-ps-primary">
                <span>{icon}</span> {label}
            </span>
        </label>
    )
}