'use client'
import { ObservatoryPage } from '@/components/ui/Observatory'
import { NavHeader } from '@/components/ui/NavHeader'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Page() {
  const [profile, setProfile] = useState<any>(null)
  const [isTradie, setIsTradie] = useState(false)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      setProfile(prof)
      setIsTradie(prof?.role === 'tradie')
    })
  }, [])
  return (
    <>
      <NavHeader profile={profile} isTradie={isTradie} backLabel="← Dashboard" backHref={isTradie ? '/tradie/dashboard' : '/dashboard'} />
      <ObservatoryPage />
    </>
  )
}
