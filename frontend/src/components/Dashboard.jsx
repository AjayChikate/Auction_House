import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const nav = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [history, setHistory] = useState([])
  const [wins, setWins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) {
      nav('/login')
      return
    }
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/api/profile')
        const { personalrooms = [], wonrooms = [] } = res.data
        setHistory(personalrooms)
        setWins(wonrooms)
      } catch (err) {
        console.error('Error fetching history:', err)
        setError(err.response?.data?.message || 'Failed to load your dashboard. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [isLoggedIn])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b border-gray-700 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-400 mb-2 sm:mb-0">
          Auction Dashboard
        </h1>
        <div className="text-lg sm:text-2xl font-semibold text-purple-400">
          Welcome, {user?.username || ''}
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-green-400 mb-3">
          Your Auction Rooms History
        </h2>
        <div className="overflow-x-auto border border-gray-700 rounded-lg shadow-lg">
          <table className="min-w-full border-collapse text-sm sm:text-base">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Auction</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Product</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Base Price</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Final Bid</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Winner</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500 italic">
                    Loading...
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((item, i) => (
                  <tr key={item._id || i} className="border-t border-gray-700 hover:bg-gray-800 transition">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-blue-400 font-bold">{item.name}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-purple-400 font-semibold">{item.product_name}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-400">{item.baseprice}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-red-400">{item.highestBid?.amount ?? 0}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-yellow-400 font-semibold">
                      {item.highestBid?.bidderName || 'No one'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500 italic">
                    No auctions created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-green-400 mb-3">
          Your Auction Wins
        </h2>
        <div className="overflow-x-auto border border-gray-700 rounded-lg shadow-lg">
          <table className="min-w-full border-collapse text-sm sm:text-base">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Auction</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Owner</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Product</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Base Price</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Purchased At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500 italic">
                    Loading...
                  </td>
                </tr>
              ) : wins.length > 0 ? (
                wins.map((item, i) => (
                  <tr key={item._id || i} className="border-t border-gray-700 hover:bg-gray-800 transition">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-blue-400 font-bold">{item.name}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-yellow-400 font-semibold">{item.creatorName}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-purple-400 font-semibold">{item.product_name}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-400">{item.baseprice}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-red-400">{item.highestBid?.amount ?? 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500 italic">
                    Not participated in any auctions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
