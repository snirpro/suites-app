'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { createSupabaseBrowser } from '@/lib/supabaseBrowser'

type Suite = {
  id: string
  name: string
}

type CalendarBooking = {
  id: string
  suite_id: string
  suite_name: string
  customer_name: string
  customer_phone: string
  checkin_at: string
  checkout_at: string
  guests: number
  price: number
  notes: string
  status: 'active' | 'canceled'
}

const SUITE_COLORS = [
  '#16a34a',
  '#2563eb',
  '#dc2626',
  '#9333ea',
  '#f59e0b',
]

function formatUTC(iso: string) {
  const d = new Date(iso)
  return d.toISOString().replace('T', ' ').slice(0, 16)
}

export default function SuitesManager() {
  const supabase = createSupabaseBrowser()
  const router = useRouter()

  const [suites, setSuites] = useState<Suite[]>([])
  const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>([])
  const [suiteColors, setSuiteColors] = useState<Record<string, string>>({})

  const [newSuiteName, setNewSuiteName] = useState('')
  const [editingSuite, setEditingSuite] = useState<Suite | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* =========================
     Load Suites
  ========================= */
  const loadSuites = async () => {
    const { data, error } = await supabase
      .from('suites')
      .select('id, name')
      .order('created_at')

    if (error) setError(error.message)
    else setSuites(data || [])
  }

  /* =========================
     Load Calendar Bookings
  ========================= */
  const loadCalendarBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        customer_phone,
        checkin_at,
        checkout_at,
        guests,
        price,
        notes,
        status,
        suite_id,
        suites ( name )
      `)
      .eq('status', 'active')

    if (error || !data) return

    const bookings: CalendarBooking[] = data.map((b: any) => ({
      id: b.id,
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      checkin_at: b.checkin_at,
      checkout_at: b.checkout_at,
      guests: b.guests,
      price: b.price,
      notes: b.notes,
      status: b.status,
      suite_id: b.suite_id,
      suite_name: b.suites.name,
    }))

    setCalendarBookings(bookings)

    // צבע לכל סוויטה
    const colors: Record<string, string> = {}
    let i = 0
    bookings.forEach((b) => {
      if (!colors[b.suite_id]) {
        colors[b.suite_id] = SUITE_COLORS[i % SUITE_COLORS.length]
        i++
      }
    })
    setSuiteColors(colors)
  }

  useEffect(() => {
    loadSuites()
    loadCalendarBookings()
  }, [])

  /* =========================
     Suite CRUD
  ========================= */
  const createSuite = async () => {
    if (!newSuiteName.trim()) return

    const { error } = await supabase.from('suites').insert({ name: newSuiteName })
    if (!error) {
      setNewSuiteName('')
      loadSuites()
    }
  }

  const updateSuite = async () => {
    if (!editingSuite) return
    await supabase.from('suites').update({ name: editingSuite.name }).eq('id', editingSuite.id)
    setEditingSuite(null)
    loadSuites()
  }

  const deleteSuite = async (id: string) => {
    const ok = window.confirm('למחוק את הסוויטה?')
    if (!ok) return
    await supabase.from('suites').delete().eq('id', id)
    loadSuites()
  }

  return (
    <div className="space-y-6">

      <h2 className="text-xl font-bold">הסוויטות שלי</h2>

      {error && <div className="text-red-600">{error}</div>}

      {/* =========================
         Suites List
      ========================= */}
      <ul className="space-y-2">
        {suites.map((suite) => (
          <li
            key={suite.id}
            className="border rounded px-3 py-2 flex justify-between items-center"
          >
            <span
              onClick={() => router.push(`/suite/${suite.id}`)}
              className="cursor-pointer font-medium"
            >
              {suite.name}
            </span>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpenId(menuOpenId === suite.id ? null : suite.id)
                }}
                className="px-2 text-xl"
              >
                ⋮
              </button>

              {menuOpenId === suite.id && (
                <div className="absolute right-0 mt-1 bg-white border rounded shadow z-10">
                  <button
                    className="block px-4 py-2 w-full text-right hover:bg-gray-100"
                    onClick={() => {
                      setEditingSuite(suite)
                      setMenuOpenId(null)
                    }}
                  >
                    ✏️ ערוך
                  </button>
                  <button
                    className="block px-4 py-2 w-full text-right text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      deleteSuite(suite.id)
                      setMenuOpenId(null)
                    }}
                  >
                    🗑️ מחק
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* =========================
         Create Suite
      ========================= */}
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

      {/* =========================
         Combined Calendar
      ========================= */}
      <div className="border rounded p-4 mt-6">
        <h3 className="font-semibold mb-2">לוח תפוסה – כל הסוויטות</h3>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          height="auto"
          fixedWeekCount={false}
          dayMaxEvents={true}
          displayEventTime={false}
          events={calendarBookings.map((b) => ({
            id: b.id,
            title: b.customer_name,
            start: b.checkin_at,
            end: b.checkout_at,
            backgroundColor: suiteColors[b.suite_id],
            borderColor: suiteColors[b.suite_id],
            extendedProps: { booking: b },
          }))}
          eventClick={(info) => {
            const booking = info.event.extendedProps.booking
            if (booking) setSelectedBooking(booking)
          }}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(suiteColors).map(([suiteId, color]) => {
            const suite = calendarBookings.find(b => b.suite_id === suiteId)
            if (!suite) return null

            return (
              <div key={suiteId} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-sm">{suite.suite_name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* =========================
         Booking Details Modal
      ========================= */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded max-w-md w-full space-y-2">
            <h3 className="font-bold">פרטי הזמנה</h3>

            <div><b>שם:</b> {selectedBooking.customer_name}</div>
            <div><b>טלפון:</b> {selectedBooking.customer_phone}</div>
            <div><b>כניסה:</b> {formatUTC(selectedBooking.checkin_at)}</div>
            <div><b>יציאה:</b> {formatUTC(selectedBooking.checkout_at)}</div>
            <div><b>אורחים:</b> {selectedBooking.guests}</div>
            <div><b>מחיר:</b> ₪{selectedBooking.price}</div>

            {selectedBooking.notes && (
              <div className="border-t pt-2">
                <b>הערות:</b>
                <div>{selectedBooking.notes}</div>
              </div>
            )}

            <div className="flex gap-2 pt-3">
              <button
                className="bg-blue-600 text-white px-3 py-2"
                onClick={() => router.push(`/suite/${selectedBooking.suite_id}`)}
              >
                ערוך ביומן
              </button>

              <button
                className="bg-red-600 text-white px-3 py-2"
                onClick={async () => {
                  await supabase
                    .from('bookings')
                    .update({ status: 'canceled' })
                    .eq('id', selectedBooking.id)

                  setSelectedBooking(null)
                  loadCalendarBookings()
                }}
              >
                בטל
              </button>

              <button
                className="border px-3 py-2"
                onClick={() => setSelectedBooking(null)}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
         Edit Suite Modal
      ========================= */}
      {editingSuite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-sm space-y-3">
            <h3 className="font-bold">עריכת סוויטה</h3>
            <input
              className="border p-2 w-full"
              value={editingSuite.name}
              onChange={(e) =>
                setEditingSuite({ ...editingSuite, name: e.target.value })
              }
            />
            <div className="flex gap-2">
              <button
                className="bg-black text-white px-4 py-2"
                onClick={updateSuite}
              >
                שמור
              </button>
              <button
                className="border px-4 py-2"
                onClick={() => setEditingSuite(null)}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
