'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AppHeader() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-40">
      
      {/* כותרת לחיצה */}
      <button
        onClick={() => router.push('/')}
        className="text-lg font-bold text-black"
      >
        יומן הזמנות
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="text-sm border px-3 py-1 rounded"
      >
        Logout
      </button>
    </header>
  )
}
