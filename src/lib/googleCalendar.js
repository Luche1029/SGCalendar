// Inizializza il token Google nella sessione
export function saveGoogleToken(token) {
  sessionStorage.setItem('google_token', token)
}

export function getGoogleToken() {
  return sessionStorage.getItem('google_token')
}

export function clearGoogleToken() {
  sessionStorage.removeItem('google_token')
}

export async function createGoogleEvent(token, event) {
    console.log('API KEY:', import.meta.env.VITE_GOOGLE_API_KEY)  

  console.log('TOKEN:', token) 
  console.log('EVENT:', event)
  // Rimuove il suffisso timezone (+00:00 o Z) e prende solo i primi 16 char
const stripTZ = (dateStr) => dateStr.replace(/([+-]\d{2}:\d{2}|Z)$/, '').slice(0, 16) + ':00'
  const start = stripTZ(event.start_date)
  const end = event.end_date
    ? stripTZ(event.end_date)
    : (() => {
        const d = new Date(start)
        d.setHours(d.getHours() + 1)
        const pad = n => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      })()

  const googleEvent = {
    summary: event.title,
    description: event.description || '',
    start: {
      dateTime: start,
      timeZone: 'Europe/Rome',
    },
    end: {
      dateTime: end,
      timeZone: 'Europe/Rome',
    },
  }

const response = await fetch(
  `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(googleEvent),
  }
)

const responseData = await response.json()
if (!response.ok) {
  throw new Error(responseData.error?.message || 'Errore Google Calendar')
}

return responseData
}