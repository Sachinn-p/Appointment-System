import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

interface User {
  id: number
  name: string
  email: string
}

interface Appointment {
  id: number
  title: string
  description?: string
  start_time: string
  end_time: string
  user_id: number
}

interface Slot {
  start: string
  end: string
  available: boolean
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.detail ?? `Request failed (${res.status})`)
  return data
}

const todayISO = () => new Date().toISOString().slice(0, 10)

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const fmtRange = (start: string, end: string) =>
  `${new Date(start).toLocaleDateString()} · ${fmtTime(start)} – ${fmtTime(end)}`

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [day, setDay] = useState(todayISO())
  const [userId, setUserId] = useState<number | ''>('')
  const [slot, setSlot] = useState<Slot | null>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)

  const loadAppointments = () => api('/appointments/').then(setAppointments)
  const loadSlots = (d: string) =>
    api(`/slots/?day=${d}`).then((data: Slot[]) => {
      setSlots(data)
      setSlot(null)
    })

  useEffect(() => {
    ;(async () => {
      try {
        const usersData = await api('/users/')
        setUsers(usersData as User[])
        await loadAppointments()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    loadSlots(day).catch((err: Error) => setError(err.message))
  }, [day])

  const createUser = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const created: User = await api('/users/', {
        method: 'POST',
        body: JSON.stringify({ name: newName, email: newEmail }),
      })
      setUsers((prev) => [...prev, created])
      setUserId(created.id)
      setNewName('')
      setNewEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const book = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (userId === '' || !slot) {
      setError('Pick a person and a time slot first.')
      return
    }
    setBusy(true)
    try {
      await api(`/users/${userId}/appointments/`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          start_time: slot.start,
          end_time: slot.end,
        }),
      })
      setTitle('')
      await Promise.all([loadAppointments(), loadSlots(day)])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="App">
      <h1>Appointment Booking</h1>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="columns">
        <section className="panel">
          <h2>Book an appointment</h2>
          <form onSubmit={book} className="stack">
            <label>
              Person
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value === '' ? '' : Number(e.target.value))}
                required
              >
                <option value="" disabled>
                  Select a person…
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} required />
            </label>

            <fieldset className="slots">
              <legend>Available slots (09:00 – 17:00)</legend>
              <div className="slot-grid">
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s.start}
                    className={`slot ${slot?.start === s.start ? 'selected' : ''}`}
                    disabled={!s.available}
                    onClick={() => setSlot(s)}
                  >
                    {fmtTime(s.start)}
                  </button>
                ))}
              </div>
              {slot && (
                <p className="slot-picked">
                  Selected: {fmtRange(slot.start, slot.end)}
                </p>
              )}
            </fieldset>

            <label>
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Check-up, consultation…"
                required
              />
            </label>

            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Booking…' : 'Book appointment'}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Appointments</h2>
          {appointments.length === 0 ? (
            <p>No appointments yet.</p>
          ) : (
            <ul className="list">
              {appointments.map((a) => (
                <li key={a.id}>
                  <strong>{a.title}</strong>
                  <span>{fmtRange(a.start_time, a.end_time)}</span>
                  <span className="muted">
                    {users.find((u) => u.id === a.user_id)?.name ?? `User #${a.user_id}`}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2>People</h2>
          {users.length === 0 ? (
            <p>No people yet — add one below.</p>
          ) : (
            <ul className="list">
              {users.map((u) => (
                <li key={u.id}>
                  <strong>{u.name}</strong>
                  <span className="muted">{u.email}</span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={createUser} className="stack inline-form">
            <label>
              Name
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              Add person
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default App
