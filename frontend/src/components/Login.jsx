import React, { useState } from 'react' 
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const nav = useNavigate()

  const Auth = async (path) => {
    if(username=="No one"){
      return alert('Username cant be this.....')
    }
    if (!username || !password) {
      return alert('Enter both details')
    }
    try {
      const res = await api.post(`/api/auth/${path}`, { username, password })
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('me', JSON.stringify(res.data.user))
        nav('/dashboard')
        window.location.reload()
      } else {
        alert(res.data.message || 'Something went wrong')
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Error occurred')
    }
  }

  return (
    <div className="max-w-md w-[90%] sm:w-full mx-auto bg-gray-900 shadow-2xl rounded-2xl p-6 sm:p-8 mt-10 border border-gray-700">
      <h3 className="text-xl sm:text-2xl font-semibold text-center text-white mb-6">
        Login / Register
      </h3>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full mb-4 px-4 py-2 bg-gray-800 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 text-sm sm:text-base"
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-6 px-4 py-2 bg-gray-800 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 text-sm sm:text-base"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => Auth('login')}
          className="w-full sm:w-1/2 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-500 hover:to-blue-400 transition transform hover:scale-105"
        >
          Login
        </button>

        <button
          onClick={() => Auth('register')}
          className="w-full sm:w-1/2 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-medium hover:from-green-500 hover:to-green-400 transition transform hover:scale-105"
        >
          Register
        </button>
      </div>
    </div>
  )
}
