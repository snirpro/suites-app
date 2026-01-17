'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { supabase } from '@/lib/supabaseClient'
import AuthGuard from '@/app/components/AuthGuard'
import AppHeader from '@/app/components/AppHeader'

function formatUTC(isoString: string) {
  const d = new Date(isoString)

  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')

  return `${day}.${month}.${year} ${hours}:${minutes}`
}

function formatUTCTime(iso: string) {
  const d = new Date(iso)
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function buildWhatsAppMessage(booking: any) {
  return `
סיכום הזמנה 🏡

שם: ${booking.customer_name}
טלפון: ${booking.customer_phone}

כניסה: ${formatUTC(booking.checkin_at)}
יציאה: ${formatUTC(booking.checkout_at)}

אורחים: ${booking.guests}
מחיר: ₪${booking.price}

${booking.notes ? `הערות: ${booking.notes}` : ''}
`.trim()
}

function normalizePhone(phone: string) {
  const p = (phone || '').replace(/\s|-/g, '')
  if (p.startsWith('0')) return `972${p.slice(1)}`
  return p
}

function openWhatsApp(booking: any) {
  const phone = normalizePhone(booking.customer_phone)
  const message = buildWhatsAppMessage(booking)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

type Booking = {
  id: string
  customer_name: string
  customer_phone: string
  checkin_at: string
  checkout_at: string
  guests: number
  price: number
  notes: string
  status: 'active' | 'canceled'
}

type NewBooking = {
  customer_name: string
  customer_phone: string
  checkin_at: string
  checkout_at: string
  guests: number
  price: number
  notes: string
}

export default function SuiteCalendarPage() {
  const { suiteId } = useParams()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newBooking, setNewBooking] = useState<NewBooking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        customer_name,
        customer_phone,
        checkin_at,
        checkout_at,
        guests,
        price,
        notes,
        status
      `
      )
      .eq('suite_id', suiteId)

    if (!error && data) setBookings(data as Booking[])
  }

  useEffect(() => {
    loadBookings()
  }, [suiteId])

  const calendarEvents = useMemo(() => {
    return bookings.map((b) => ({
      id: b.id,
      title: `${b.customer_name} (${formatUTCTime(b.checkin_at)}–${formatUTCTime(b.checkout_at)})`,
      start: b.checkin_at,
      end: b.checkout_at,
      backgroundColor: b.status === 'canceled' ? '#dc2626' : '#16a34a',
      borderColor: '#000000',
      textColor: '#ffffff',
      classNames: b.status === 'canceled' ? ['line-through'] : []
    }))
  }, [bookings])

  const inputClass =
    'w-full rounded-xl border border-black/20 bg-white px-3 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-black/20'
  const labelClass = 'text-sm font-semibold text-black/80'
  const sectionTitleClass = 'text-lg sm:text-base font-bold'

  return (
    <AuthGuard>
        <AppHeader />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-black/10">
          <div className="px-3 sm:px-6 py-3 flex items-center justify-between">

            {/* Quick Add (mobile friendly) */}
            <button
              className="sm:hidden rounded-xl bg-black text-white px-3 py-2 text-sm"
              onClick={() => {
                const now = new Date()
                const yyyy = now.getUTCFullYear()
                const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
                const dd = String(now.getUTCDate()).padStart(2, '0')
                const today = `${yyyy}-${mm}-${dd}`

                const checkoutDate = new Date(`${today}T00:00:00Z`)
                checkoutDate.setDate(checkoutDate.getDate() + 1)

                setNewBooking({
                  customer_name: '',
                  customer_phone: '',
                  checkin_at: `${today}T14:00`,
                  checkout_at: `${checkoutDate.toISOString().slice(0, 10)}T11:00`,
                  guests: 1,
                  price: 0,
                  notes: ''
                })
                setSelectedBooking(null)
                setEditingBookingId(null)
                setShowForm(true)
              }}
            >
              + הזמנה
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="px-2 sm:px-6 py-3">
          <div className="rounded-2xl border border-black/10 overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"

              /* ❌ מונע שינוי view אוטומטי במובייל */
              handleWindowResize={false}

              selectable
              displayEventTime={false}

              events={calendarEvents}

              /* ✅ גובה חכם למובייל */
              height="auto"
              contentHeight="auto"
              expandRows={true}

              headerToolbar={{
                left: 'prev,next',
                center: 'title',
                right: ''
              }}

              /* ✅ חודש אמיתי */
              fixedWeekCount={false}

              /* ✅ לא לחתוך אירועים */
              dayMaxEventRows={2}

              longPressDelay={250}

              select={(info) => {
                const checkinDate = info.startStr
                const checkoutDate = new Date(info.startStr)
                checkoutDate.setDate(checkoutDate.getDate() + 1)

                setNewBooking({
                  customer_name: '',
                  customer_phone: '',
                  checkin_at: `${checkinDate}T14:00`,
                  checkout_at: `${checkoutDate.toISOString().slice(0, 10)}T11:00`,
                  guests: 1,
                  price: 0,
                  notes: ''
                })

                setSelectedBooking(null)
                setEditingBookingId(null)
                setShowForm(true)
              }}

              eventClick={(info) => {
                const booking = bookings.find((b) => b.id === info.event.id)
                if (!booking) return
                setSelectedBooking(booking)
                setShowForm(false)
              }}
            />

          </div>
        </div>

        {/* FORM MODAL (Mobile bottom sheet + desktop modal) */}
        {showForm && newBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
              {/* Top bar */}
              <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
                <h2 className={sectionTitleClass}>
                  {editingBookingId ? 'עריכת הזמנה' : 'הזמנה חדשה'}
                </h2>

                <button
                  className="rounded-xl border border-black/15 px-3 py-2 text-sm"
                  onClick={() => {
                    setShowForm(false)
                    setError(null)
                    setEditingBookingId(null)
                    setNewBooking(null)
                  }}
                >
                  סגור
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(92vh-140px)] sm:max-h-[calc(85vh-140px)]">
                <div className="space-y-1">
                  <div className={labelClass}>שם הלקוח</div>
                  <input
                    type="text"
                    className={inputClass}
                    value={newBooking.customer_name || ''}
                    onChange={(e) =>
                      setNewBooking((prev) =>
                        prev
                          ? {
                              ...prev,
                              customer_name: e.target.value
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className="space-y-1">
                  <div className={labelClass}>טלפון</div>
                  <input
                    type="tel"
                    inputMode="tel"
                    className={inputClass}
                    value={newBooking.customer_phone || ''}
                    onChange={(e) =>
                      setNewBooking((prev) =>
                        prev
                          ? {
                              ...prev,
                              customer_phone: e.target.value
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className={labelClass}>כמות אורחים</div>
                    <input
                      type="number"
                      className={inputClass}
                      value={newBooking.guests ?? ''}
                      onChange={(e) =>
                        setNewBooking((prev) =>
                          prev
                            ? {
                                ...prev,
                                guests: Number(e.target.value)
                              }
                            : prev
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <div className={labelClass}>מחיר</div>
                    <input
                      type="number"
                      className={inputClass}
                      value={newBooking.price ?? ''}
                      onChange={(e) =>
                        setNewBooking((prev) =>
                          prev
                            ? {
                                ...prev,
                                price: Number(e.target.value)
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className={labelClass}>כניסה</div>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={newBooking.checkin_at?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setNewBooking((prev) =>
                        prev
                          ? {
                              ...prev,
                              checkin_at: e.target.value
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className="space-y-1">
                  <div className={labelClass}>יציאה</div>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={newBooking.checkout_at?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setNewBooking((prev) =>
                        prev
                          ? {
                              ...prev,
                              checkout_at: e.target.value
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className="space-y-1">
                  <div className={labelClass}>הערות</div>
                  <textarea
                    className={`${inputClass} min-h-[96px]`}
                    value={newBooking.notes || ''}
                    onChange={(e) =>
                      setNewBooking((prev) =>
                        prev
                          ? {
                              ...prev,
                              notes: e.target.value
                            }
                          : prev
                      )
                    }
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Sticky actions */}
              <div className="px-4 py-3 border-t border-black/10 bg-white">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="w-full sm:w-auto rounded-xl bg-black text-white px-4 py-3 text-base sm:text-sm font-semibold"
                    onClick={async () => {
                      if (
                        !newBooking.customer_name.trim() ||
                        !newBooking.customer_phone.trim() ||
                        !newBooking.checkin_at ||
                        !newBooking.checkout_at ||
                        newBooking.guests <= 0 ||
                        newBooking.price <= 0
                      ) {
                        setError('❌ חובה למלא את כל השדות לפני שמירה')
                        return
                      }

                      setError(null)

                      // Overlap check (includes edit)
                      let overlapQuery = supabase
                        .from('bookings')
                        .select('id')
                        .eq('suite_id', suiteId)
                        .eq('status', 'active')
                        .lt('checkin_at', newBooking.checkout_at)
                        .gt('checkout_at', newBooking.checkin_at)

                      if (editingBookingId) overlapQuery = overlapQuery.neq('id', editingBookingId)

                      const { data: overlapData, error: overlapError } = await overlapQuery

                      if (overlapError) {
                        setError('❌ שגיאה בבדיקת חפיפה')
                        return
                      }

                      if (overlapData && overlapData.length > 0) {
                        setError('❌ התאריכים חופפים להזמנה קיימת')
                        return
                      }

                      // Update or Insert
                      if (editingBookingId) {
                        const { error } = await supabase
                          .from('bookings')
                          .update({
                            customer_name: newBooking.customer_name,
                            customer_phone: newBooking.customer_phone,
                            checkin_at: newBooking.checkin_at,
                            checkout_at: newBooking.checkout_at,
                            guests: newBooking.guests,
                            price: newBooking.price,
                            notes: newBooking.notes
                          })
                          .eq('id', editingBookingId)

                        if (error) {
                          setError('❌ שגיאה בעדכון ההזמנה')
                          return
                        }
                      } else {
                        const { error } = await supabase.from('bookings').insert({
                          suite_id: suiteId,
                          customer_name: newBooking.customer_name,
                          customer_phone: newBooking.customer_phone,
                          checkin_at: newBooking.checkin_at,
                          checkout_at: newBooking.checkout_at,
                          guests: newBooking.guests,
                          price: newBooking.price,
                          notes: newBooking.notes
                        })

                        if (error) {
                          setError('❌ התאריך תפוס או שגיאה בנתונים')
                          return
                        }
                      }

                      setShowForm(false)
                      setEditingBookingId(null)
                      setNewBooking(null)
                      loadBookings()
                    }}
                  >
                    {editingBookingId ? 'שמור שינויים' : 'שמור'}
                  </button>

                  <button
                    className="w-full sm:w-auto rounded-xl border border-black/15 px-4 py-3 text-base sm:text-sm font-semibold"
                    onClick={() => {
                      setShowForm(false)
                      setError(null)
                      setEditingBookingId(null)
                      setNewBooking(null)
                    }}
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS MODAL (Mobile bottom sheet + desktop modal) */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
              <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
                <h2 className={sectionTitleClass}>פרטי הזמנה</h2>
                <button
                  className="rounded-xl border border-black/15 px-3 py-2 text-sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  סגור
                </button>
              </div>

              <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(92vh-170px)] sm:max-h-[calc(85vh-170px)]">
                <div className="rounded-2xl border border-black/10 p-3 space-y-1">
                  <div className="text-sm">
                    <b>שם:</b> {selectedBooking.customer_name}
                  </div>
                  <div className="text-sm">
                    <b>טלפון:</b> {selectedBooking.customer_phone}
                  </div>
                  <div className="text-sm">
                    <b>כניסה:</b> {formatUTC(selectedBooking.checkin_at)}
                  </div>
                  <div className="text-sm">
                    <b>יציאה:</b> {formatUTC(selectedBooking.checkout_at)}
                  </div>
                  <div className="text-sm">
                    <b>אורחים:</b> {selectedBooking.guests}
                  </div>
                  <div className="text-sm">
                    <b>מחיר:</b> ₪{selectedBooking.price}
                  </div>

                  {selectedBooking.notes && (
                    <div className="border-t border-black/10 pt-2 text-sm">
                      <b>הערות:</b>
                      <div className="mt-1 whitespace-pre-wrap">{selectedBooking.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-black/10 bg-white">
                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedBooking.status === 'active' && (
                    <>
                      <button
                        className="w-full sm:w-auto rounded-xl bg-green-600 text-white px-4 py-3 text-base sm:text-sm font-semibold"
                        onClick={() => openWhatsApp(selectedBooking)}
                      >
                        שלח לוואטסאפ
                      </button>

                      <button
                        className="w-full sm:w-auto rounded-xl bg-blue-600 text-white px-4 py-3 text-base sm:text-sm font-semibold"
                        onClick={() => {
                          setEditingBookingId(selectedBooking.id)
                          setNewBooking({
                            customer_name: selectedBooking.customer_name,
                            customer_phone: selectedBooking.customer_phone,
                            checkin_at: selectedBooking.checkin_at,
                            checkout_at: selectedBooking.checkout_at,
                            guests: selectedBooking.guests,
                            price: selectedBooking.price,
                            notes: selectedBooking.notes || ''
                          })
                          setSelectedBooking(null)
                          setShowForm(true)
                        }}
                      >
                        ערוך הזמנה
                      </button>

                      <button
                        className="w-full sm:w-auto rounded-xl bg-red-600 text-white px-4 py-3 text-base sm:text-sm font-semibold"
                        onClick={async () => {
                          await supabase.from('bookings').update({ status: 'canceled' }).eq('id', selectedBooking.id)
                          setSelectedBooking(null)
                          loadBookings()
                        }}
                      >
                        בטל הזמנה
                      </button>
                    </>
                  )}

                  {selectedBooking.status === 'canceled' && (
                    <>
                      <button
                        className="w-full sm:w-auto rounded-xl bg-red-800 text-white px-4 py-3 text-base sm:text-sm font-semibold"
                        onClick={async () => {
                          const confirmDelete = window.confirm('⚠️ האם אתה בטוח שברצונך למחוק את ההזמנה לצמיתות?')
                          if (!confirmDelete) return

                          const { error } = await supabase.from('bookings').delete().eq('id', selectedBooking.id)

                          if (error) {
                            alert('❌ שגיאה במחיקת ההזמנה')
                            return
                          }

                          setSelectedBooking(null)
                          loadBookings()
                        }}
                      >
                        מחק הזמנה
                      </button>

                      <button
                        className="w-full sm:w-auto rounded-xl border border-black/15 px-4 py-3 text-base sm:text-sm font-semibold"
                        onClick={() => setSelectedBooking(null)}
                      >
                        סגור
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
