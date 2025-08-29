import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { FaGithub } from 'react-icons/fa'
import Login from './components/Login'
import Lobby from './components/Lobby'
import AuctionRoom from './components/AuctionRoom'
import Dashboard from './components/Dashboard'
import Support from './components/Support'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('me')
    setIsLoggedIn(false)
    navigate('/login')
    window.location.reload()
  }

  return (
    <div className="min-h-screen font-sans bg-gray-900 text-gray-100 flex flex-col justify-between">
      
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-4 sm:px-6 py-3 bg-gray-800/90 backdrop-blur-md shadow-xl rounded-full w-[95%] sm:w-max">
      <div className="text-xl font-bold text-cyan-400">Auction House </div>
        <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
          <Link
            to="/"
            className="text-base sm:text-lg font-medium text-gray-200 hover:text-blue-400 transition-colors"
          >
            Lobby
          </Link>
          <Link
            to="/dashboard"
            className="text-base sm:text-lg font-medium text-gray-200 hover:text-blue-400 transition-colors"
          >
            My Profile
          </Link>
        </div>

        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="ml-auto w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full font-semibold transition-shadow shadow-md text-center"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="ml-auto w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-shadow shadow-md text-center"
          >
            Login/Register
          </Link>
        )}
      </nav>

      
      <main className="pt-28 px-4 sm:px-6 flex-grow">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/login" element={<Login />} />
          <Route path="/room/:id" element={<AuctionRoom />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

     
      <footer className="bg-gray-800 text-gray-300 py-6 border-t border-gray-700 mt-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
    
          <div className="text-xl font-bold text-cyan-400">Auction House </div>

         
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-slate-400 transition">
              Home
            </Link>
            <Link to="/support" className="hover:text-slate-400 transition">
              Support
            </Link>
            <a
              href="https://github.com/AjayChikate"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-400 transition flex items-center gap-1"
            >
              <FaGithub /> GitHub
            </a>
          </div>

          
          <p className="text-xs text-gray-500 text-center md:text-right">
            &copy; {new Date().getFullYear()} Auction House. Coded by Ajay
          </p>
        </div>
      </footer>
    </div>
  )
}
