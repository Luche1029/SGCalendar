import { useGoogleLogin } from '@react-oauth/google'
import { createGoogleEvent } from '../lib/googleCalendar'
import { saveMemberSync } from '../lib/supabase'
import { useState } from 'react'

export default function SyncButton({ event, currentUser, onSynced }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const doSync = async (token) => {
    setLoading(true)
    setError('')
    try {
      const googleEvent = await createGoogleEvent(token, event)
      await saveMemberSync(event.id, currentUser.id, googleEvent.id)
      onSynced()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const login = useGoogleLogin({
    onSuccess: (response) => doSync(response.access_token),
    onError: () => setError('Autenticazione Google fallita'),
    scope: 'https://www.googleapis.com/auth/calendar.events',
    overrideScope: true,
  })

  const handleClick = (e) => {
    e.stopPropagation()
    login()
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1 px-2 py-1 bg-white text-gray-800 
                   hover:bg-gray-100 rounded text-xs font-semibold transition-colors 
                   disabled:opacity-50"
      >
        {loading ? '⏳ Invio...' : (
          <>
            <img
              src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_16dp.png"
              alt="Google Calendar"
              className="w-3 h-3"
            />
            Invia a Google
          </>
        )}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}