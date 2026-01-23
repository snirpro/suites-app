'use client'
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

type Props = {
  booking: Booking
  onClose: () => void
  onEdit?: (b: Booking) => void
  onCancel?: (b: Booking) => Promise<void>
  onDelete?: (b: Booking) => Promise<void>
  onWhatsApp?: (b: Booking) => void
  allowEdit?: boolean
  allowDelete?: boolean
}

export default function BookingDetailsModal({
  booking,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onWhatsApp,
  allowEdit = true,
  allowDelete = true
}: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-xl overflow-hidden">

        <div className="px-4 py-3 border-b flex justify-between">
          <h2 className="font-bold">פרטי הזמנה</h2>
          <button onClick={onClose}>סגור</button>
        </div>

        <div className="p-4 space-y-1 text-sm">
          <div><b>שם:</b> {booking.customer_name}</div>
          <div><b>טלפון:</b> {booking.customer_phone}</div>
          <div><b>אורחים:</b> {booking.guests}</div>
          <div><b>מחיר:</b> ₪{booking.price}</div>

          {booking.notes && (
            <div className="border-t pt-2 mt-2">
              <b>הערות:</b>
              <div className="whitespace-pre-wrap">{booking.notes}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex flex-col gap-2">
          {booking.status === 'active' && (
            <>
              {onWhatsApp && (
                <button className="bg-green-600 text-white py-2" onClick={() => onWhatsApp(booking)}>
                  שלח לוואטסאפ
                </button>
              )}

              {allowEdit && onEdit && (
                <button className="bg-blue-600 text-white py-2" onClick={() => onEdit(booking)}>
                  ערוך הזמנה
                </button>
              )}

              {onCancel && (
                <button className="bg-red-600 text-white py-2" onClick={() => onCancel(booking)}>
                  בטל הזמנה
                </button>
              )}
            </>
          )}

          {booking.status === 'canceled' && allowDelete && onDelete && (
            <button className="bg-red-800 text-white py-2" onClick={() => onDelete(booking)}>
              מחק הזמנה
            </button>
          )}
        </div>
      </div>
    </div>
  )
}