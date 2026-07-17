import React, { useEffect, useState, useCallback } from 'react'
import api from '../utils/api'
import { connectSocket } from '../utils/socket'
import { useNavigate } from 'react-router-dom'
import Timer from './Timer'
import { FaCoins } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

const MAX_NAME_LEN = 100
const MAX_DESC_LEN = 1000
const MAX_DURATION_MIN = 24 * 60

export default function Lobby() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [pname, setPname] = useState('')
  const [pdesc, setPdesc] = useState('')
  const [duration, setDuration] = useState(5)
  const [baseprice, setBaseprice] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()
  const { isLoggedIn } = useAuth()

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/rooms')
      setRooms(res.data || [])
    } catch (e) {
      console.error('Failed to load rooms:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const s = connectSocket()
    s.on('roomsUpdated', load)
    return () => {
      s.off('roomsUpdated', load)
    }
  }, [load])

  async function createRoom() {
    if (submitting) return
    if (!isLoggedIn) return nav('/login')
    if (!name.trim()) return alert('Enter a room name')
    if (name.length > MAX_NAME_LEN) return alert(`Room name must be under ${MAX_NAME_LEN} characters`)
    if (!pname.trim()) return alert('Enter a product name')
    if (pdesc.length > MAX_DESC_LEN) return alert(`Description must be under ${MAX_DESC_LEN} characters`)

    const durationNum = Number(duration)
    if (!Number.isFinite(durationNum) || durationNum <= 0 || durationNum > MAX_DURATION_MIN) {
      return alert('Duration must be between 1 minute and 24 hours')
    }
    const baseNum = Number(baseprice)
    if (!Number.isFinite(baseNum) || baseNum < 0) return alert('Base price must be a non-negative number')

    setSubmitting(true)
    try {
      await api.post('/api/rooms', {
        name: name.trim(),
        pname: pname.trim(),
        pdesc,
        durationMinutes: durationNum,
        baseprice: baseNum,
      })
      setName('')
      setPname('')
      setPdesc('')
      setBaseprice(0)
      setDuration(5)
      setShowModal(false)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create room')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 sm:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-400 text-center sm:text-left">
          <FaCoins /> Auction Lobby
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm sm:text-base"
        >
          + Create Room
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading rooms...(Note:- First load may take up to a minute as this app runs on a free hosting tier that sleeps when idle)</div>
      ) : rooms.length === 0 ? (
        <div className="text-center text-gray-500 italic py-10">No auction rooms yet — create the first one!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((r) => (
            <div key={r._id} className="bg-gray-800 rounded-xl p-4 sm:p-5 shadow-md hover:shadow-xl transition">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-white break-words">{r.name}</div>
                <div className="text-sm ">
                  <Timer endTime={r.endTime} />
                </div>
              </div>

              <div className="text-xs sm:text-sm text-gray-400 mb-1">
                by <span className="text-indigo-400">{r.creatorName}</span>
              </div>

              <div className="text-xs sm:text-sm text-gray-300">
                Product: <span className="text-indigo-400">{r.product_name}</span>
              </div>

              <div className="text-xs sm:text-sm text-gray-300">
                Base Price: <span className="font-semibold text-green-400">₹{r.baseprice}</span>
              </div>

              {r.active ? (
                <div className="text-xs sm:text-sm text-gray-300 mb-2">
                  Highest: <span className="font-semibold text-emerald-400">₹{r.highestBid?.amount || 0}</span> by{' '}
                  <span className="text-blue-400">{r.highestBid?.bidderName || 'No one'}</span>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-gray-300 mb-2">
                  Sold to: <span className="text-pink-400 font-semibold">{r.highestBid?.bidderName || 'No one'}</span> at{' '}
                  <span className="text-red-400 font-semibold">₹{r.highestBid?.amount || 0}</span>
                </div>
              )}

              <div className="text-xs sm:text-sm text-gray-300 mb-3">
                Ends: <span className="text-yellow-400">{new Date(r.endTime).toLocaleString()}</span>
              </div>

              <button
                disabled={!r.active}
                onClick={() => {
                  if (!isLoggedIn) nav('/login')
                  else nav(`/room/${r._id}`)
                }}
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm sm:text-base ${
                  r.active ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {r.active ? 'Join Room' : 'Closed'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-gray-800 p-5 sm:p-6 rounded-xl w-full max-w-md shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-blue-400">Create New Room</h3>

            <label className="block mb-2 font-medium text-sm">Room Name</label>
            <input
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              placeholder="Room name"
              value={name}
              maxLength={MAX_NAME_LEN}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="block mb-2 font-medium text-sm">Product Name</label>
            <input
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              placeholder="Product name"
              value={pname}
              maxLength={MAX_NAME_LEN}
              onChange={(e) => setPname(e.target.value)}
            />

            <label className="block mb-2 font-medium text-sm">About Product (optional)</label>
            <input
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              placeholder="Product description"
              value={pdesc}
              maxLength={MAX_DESC_LEN}
              onChange={(e) => setPdesc(e.target.value)}
            />

            <label className="block mb-2 font-medium text-sm">Duration (minutes, max 1440)</label>
            <input
              type="number"
              min={1}
              max={MAX_DURATION_MIN}
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <label className="block mb-2 font-medium text-sm">Base Price ₹</label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              placeholder="Base Price"
              value={baseprice}
              onChange={(e) => setBaseprice(e.target.value)}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createRoom}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
