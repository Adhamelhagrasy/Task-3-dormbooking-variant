import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { roomNumber: '', startDate: '', endDate: '', purpose: '' }

export default function BookingForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(!id)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    setError('')
    setForm(defaults)
    setReady(!id)

    if (id) {
      async function loadBooking() {
        try {
          const { data } = await api.get(`/bookings/${id}`)
          if (!active) return
          const booking = data.booking
          setForm({
            roomNumber: booking.roomNumber,
            // Date inputs accept only the date part of an ISO timestamp.
            startDate: booking.startDate.slice(0, 10),
            endDate: booking.endDate.slice(0, 10),
            purpose: booking.purpose || ''
          })
          setReady(true)
        } catch (err) {
          if (active) {
            setError(err?.response?.data?.message || 'Could not load booking')
          }
        }
      }
      loadBooking()
    }

    // Ignore a response if the user leaves or opens another booking.
    return () => { active = false }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!ready || saving) return
    setError('')
    setSaving(true)
    const { roomNumber, startDate, endDate, purpose } = form
    const payload = { roomNumber, startDate, endDate, purpose }
    try {
      if (id) {
        await api.patch(`/bookings/${id}`, payload)
      } else {
        await api.post('/bookings', payload)
      }
      nav('/bookings')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save booking')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'New'} Booking</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {!ready && !error && <p role="status">Loading booking...</p>}
        <fieldset disabled={!ready || saving} className="space-y-3">
          <input
            className="input"
            type="text"
            name="roomNumber"
            aria-label="Room number"
            placeholder="Room number (e.g. B2-104)"
            value={form.roomNumber}
            onChange={onChange}
            required
          />
          <label className="block">
            Start date
            <input className="input" type="date" name="startDate" value={form.startDate} onChange={onChange} required />
          </label>
          <label className="block">
            End date
            <input className="input" type="date" name="endDate" value={form.endDate} onChange={onChange} required />
          </label>
          <textarea
            className="input"
            name="purpose"
            aria-label="Purpose (optional)"
            placeholder="Purpose (optional)"
            rows={3}
            value={form.purpose}
            onChange={onChange}
          />
          <button className="btn" type="submit">{saving ? 'Saving...' : 'Save'}</button>
        </fieldset>
        {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  )
}
