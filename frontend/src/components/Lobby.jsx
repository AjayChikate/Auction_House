import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import { connectSocket } from '../utils/socket'
import { useNavigate } from 'react-router-dom'
import Timer from './Timer'
import { FaCoins } from "react-icons/fa"; 

export default function Lobby() {
  const [rooms, setRooms] = useState([])
  const [name, setName] = useState('')
  const [pname, setPname] = useState('')
  const [pdesc, setPdesc] = useState('')
  const [duration, setDuration] = useState(5)
  const [baseprice, setBaseprice] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    load()
    const s = connectSocket()
    s.on('roomsUpdated', load)
    return () => {
      s.off('roomsUpdated', load)
    }
  }, [])

  async function load() {
    const res = await api.get('/api/rooms')
    setRooms(res.data || res)
  }

  async function createRoom() {
    const token = localStorage.getItem('token')
    if (!token) return alert('Login first')
    if (!name) return alert('Enter name')
    if (!pname) return alert('Enter product name')
    if (baseprice < 0) return alert('invalid')

    await api.post('/api/rooms', {
      name,
      pname,
      pdesc,
      durationMinutes: Number(duration),
      baseprice,
    })

    setName('')
    setPname('')
    setPdesc('')
    setBaseprice(0)
    setDuration(5)
    setShowModal(false)
    load()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 sm:px-8 py-6">
     
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-400 text-center sm:text-left">
          <FaCoins/> Auction Lobby
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm sm:text-base"
        >
          + Create Room
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((r) => (
          <div
            key={r._id}
            className="bg-gray-800 rounded-xl p-4 sm:p-5 shadow-md hover:shadow-xl transition"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="text-2xl sm:text-3xl font-bold text-white break-words">
                {r.name}
              </div>
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
              Base Price:{' '}
              <span className="font-semibold text-green-400">
                ₹{r.baseprice}
              </span>
            </div>

            {r.active ? (
              <div className="text-xs sm:text-sm text-gray-300 mb-2">
                Highest:{' '}
                <span className="font-semibold text-emerald-400">
                  ₹{r.highestBid?.amount || 0}
                </span>{' '}
                by{' '}
                <span className="text-blue-400">
                  {r.highestBid?.bidderName || 'No one'}
                </span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-300 mb-2">
                Sold to:{' '}
                <span className="text-pink-400 font-semibold">
                  {r.highestBid?.bidderName || 'No one'}
                </span>{' '}
                at{' '}
                <span className="text-red-400 font-semibold">
                  ₹{r.highestBid?.amount || 0}
                </span>
              </div>
            )}

            <div className="text-xs sm:text-sm text-gray-300 mb-3">
              Ends:{' '}
              <span className="text-yellow-400">
                {new Date(r.endTime).toLocaleString()}
              </span>
            </div>

            <button
              disabled={!r.active}
              onClick={() => {
                const token = localStorage.getItem('token')
                if (!token) nav('/login')
                else nav(`/room/${r._id}`)
              }}
              className={`w-full py-2 px-4 rounded-lg font-medium text-sm sm:text-base ${
                r.active
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {r.active ? 'Join Room' : 'Closed'}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-gray-800 p-5 sm:p-6 rounded-xl w-full max-w-md shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-blue-400">
              Create New Room
            </h3>

            
            <label className="block mb-2 font-medium text-sm">Room Name</label>
            <input
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              placeholder="Room name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

        
            <label className="block mb-2 font-medium text-sm">Product Name</label>
            <input
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              placeholder="Product name"
              value={pname}
              onChange={(e) => setPname(e.target.value)}
            />

            <label className="block mb-2 font-medium text-sm">
              About Product (optional)
            </label>
            <input
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              placeholder="Product description"
              value={pdesc}
              onChange={(e) => setPdesc(e.target.value)}
            />

       
            <label className="block mb-2 font-medium text-sm">
              Duration (minutes)
            </label>
            <input
              type="number"
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <label className="block mb-2 font-medium text-sm">Base Price ₹</label>
            <input
              type="number"
              className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
              placeholder="Base Price"
              value={baseprice}
              onChange={(e) => setBaseprice(e.target.value)}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createRoom}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
