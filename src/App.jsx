import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import Calendar from './components/Calendar'
import KanbanBoard from './components/KanbanBoard'
import { useState } from 'react'
import JavelinBoard from './components/JavelinBoard'
function AppContent() {
  const { currentUser, logout } = useAuth()
  const [view, setView] = useState('calendar')

  if (!currentUser) return <LoginPage />

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">

      {/* Header globale */}
      <header className="bg-gray-800 px-6 py-3 flex items-center 
                         justify-between shadow-lg border-b border-gray-700">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-white">🚀 SG Calendar</h1>

          {/* Tab navigazione */}
          <nav className="flex gap-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${view === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              📅 Calendario
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${view === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              📋 Task Board
            </button>
            <button
              onClick={() => setView('javelin')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${view === 'javelin'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              🎯 Javelin
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            Ciao, <span className="text-white font-semibold">{currentUser.name}</span>
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Esci →
          </button>
        </div>
      </header>

      {/* Contenuto */}
      <div className="flex-1 overflow-hidden">
{view === 'calendar' && <Calendar />}
{view === 'kanban'   && <KanbanBoard />}
{view === 'javelin'  && <JavelinBoard />}      </div>
    </div>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}