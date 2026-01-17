'use client'

import { createSupabaseBrowser } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createSupabaseBrowser()
  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <button
      onClick={logout}
      className="border px-4 py-2 rounded"
    >
      Logout
    </button>
  )
}
