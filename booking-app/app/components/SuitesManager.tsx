'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Suite = {
  id: string
  name: string
}

export default function SuitesManager() {
  const [suites, setSuites] = useState<Suite[]>([])
  const [newSuiteName, setNewSuiteName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()


  const loadSuites = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('suites')
      .select('id, name')
      .order('created_at')

    if (error) {
      setError(error.message)
    } else {
      setSuites(data || [])
    }

    setLoading(false)
  }

  const createSuite = async () => {
    if (!newSuiteName.trim()) return

    const { error } = await supabase.from('suites').insert({
      name: newSuiteName,
    })

    if (error) {
      setError(error.message)
    } else {
      setNewSuiteName('')
      loadSuites()
    }
  }

  useEffect(() => {
    loadSuites()
  }, [])

  if (loading) return <div>טוען סוויטות...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">הסוויטות שלי</h2>

      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-2">
        {suites.map((suite) => (
          <li
            key={suite.id}
            onClick={() => router.push(`/suite/${suite.id}`)}
            className="border p-3 rounded cursor-pointer hover:bg-gray-100"
          >
            {suite.name}
          </li>
        ))}
      </ul>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-2">יצירת סוויטה חדשה</h3>
        <input
          className="border p-2 w-full mb-2"
          placeholder="שם הסוויטה"
          value={newSuiteName}
          onChange={(e) => setNewSuiteName(e.target.value)}
        />
        <button
          onClick={createSuite}
          className="bg-black text-white px-4 py-2"
        >
          צור סוויטה
        </button>
      </div>
    </div>
  )
}
