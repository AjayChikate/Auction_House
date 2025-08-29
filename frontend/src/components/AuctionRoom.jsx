import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { connectSocket } from '../utils/socket'
import Timer from './Timer'
import { FaGavel } from "react-icons/fa";
import { FiSend } from "react-icons/fi"; 


export default function AuctionRoom() {
  const { id } = useParams()
  const [state, setState] = useState(null)
  const [chatText, setChatText] = useState('')
  const [bidAmt, setBidAmt] = useState('')
  const [hasbid, setHasbid] = useState(false)  
  const socketRef = useRef(null)

  const colors = [
    "bg-gradient-to-r from-purple-400 to-purple-600",
    "bg-gradient-to-r from-yellow-400 to-yellow-500",
    "bg-gradient-to-r from-green-400 to-green-600",
    "bg-gradient-to-r from-blue-400 to-blue-700",
    "bg-gradient-to-r from-red-400 to-red-600",
    "bg-gradient-to-r from-orange-400 to-orange-600",
    "bg-gradient-to-r from-blue-400 to-blue-600",
    "bg-gradient-to-r from-white-400 to-white-600",
    "bg-gradient-to-r from-pink-400 to-pink-600",
  ];
  
  useEffect(() => {
    const s = connectSocket()
    socketRef.current = s
    s.emit('joinroom', { roomId: id })
    s.on('roomstate', st => setState(st))
    s.on('chatmessage', m => setState(p => p ? { ...p, chats: [...p.chats, m] } : p))
    s.on('bidupdate', ({ highestBid, lastBid }) => {
      setHasbid(true)
      setTimeout(() => setHasbid(false), 2000);
      setState(p => p ? { ...p, highestBid, bids: [...(p.bids || []), lastBid] } : p)
    })
    s.on('A_ended', d => { alert('Auction ended! Winner: ' + (d.highestBid?.bidderName || 'No one')); setState(p => p ? { ...p, active: false } : p) })
    s.on('errormsg', d => alert(d))
    return () => {
      s.emit('leaveroom', { roomId: id })
      s.off('roomstate')
      s.off('chatmessage')
      s.off('bidupdate')
      s.off('A_ended')
      s.off('errormsg')
    }
  }, [id])
  
  if (!state) return <div className="p-4 text-center text-gray-300">Loading room...</div>

  const sendChat = () => {
    if (!chatText.trim()) return
    socketRef.current.emit('chatmessage', { roomId: id, text: chatText })
    setChatText('')
  }

  const placeBid = () => {
    const amt = Number(bidAmt)
    if (!amt) { alert('Bid must be more than 0'); return }
    socketRef.current.emit('placebid', { roomId: id, amount: amt })
    setBidAmt('')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <div className="flex flex-col lg:flex-row flex-1 gap-6 p-4 md:p-6">
        <div className="w-full lg:w-3/5 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-lg sm:text-xl">{state.active ? '🟢 Live' : '🔴 Ended'}</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 text-center">{state.name}</div>
            <div><Timer endTime={state.endTime} /></div>
          </div>

          <div className="text-base sm:text-lg font-semibold">Highest Bid: <span className="text-green-400">₹{state.highestBid?.amount || 0}</span> <span className="ml-1 text-gray-300">by {state.highestBid?.bidderName || 'No one'}</span></div>

          <h4 className="font-semibold text-purple-400 mt-2">Live Chats</h4>
          <div className="mb-2 flex-1 max-h-[40vh] overflow-y-auto border border-gray-900 p-3 rounded bg-gray-700 shadow-inner flex flex-col-reverse scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
            {(state.chats || []).slice().reverse().map((c, i) => (
              <div key={i} className="bg-gray-900 px-3 py-2 mt-2 rounded-xl text-sm break-words">
                <div className="text-purple-600 font-semibold">{c.username}:</div>
                <div className="text-gray-200">{c.text}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <input value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Type message here" className="border border-gray-700 bg-gray-800 rounded px-3 py-2 flex-1 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base" />
            <button onClick={sendChat} disabled={!state.active} className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md transition disabled:opacity-50 text-sm sm:text-base">
              <FiSend size={20} className="sm:w-6 sm:h-6"/> 
              Send
            </button>
          </div>

          <div className="flex gap-2 mt-2">
            <input type="number" value={bidAmt} onChange={e => setBidAmt(e.target.value)} placeholder="Enter your bid" className="border border-gray-700 bg-gray-900 rounded px-3 py-2 flex-1 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" />
            <button onClick={placeBid} disabled={!state.active} className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md transition disabled:opacity-50 text-sm sm:text-base">
              <FaGavel size={20} className="sm:w-6 sm:h-6"/> 
              Bid
            </button>
          </div>
        </div>

        {hasbid && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => {
              const color = colors[Math.floor(Math.random() * colors.length)];
              return (
                <div
                  key={i}
                  className={`absolute w-2 h-10 bg-gradient-to-r ${color} rounded-sm animate-fall`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    transform: `rotate(${Math.random() * 270}deg) scale(${0.7 + Math.random() * 0.5})`,
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="w-full lg:w-2/5 border border-gray-700 p-4 rounded bg-gray-800 shadow-md flex flex-col space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-yellow-400">Room Info</h4>
            <div><span className="text-gray-400">Creator:</span> {state.creatorName}</div>
            <div><span className="text-gray-400">Active:</span> {String(state.active)}</div>
            <div><span className="text-gray-400">Product Name:</span> {String(state.product_name)}</div>
            <div><span className="text-gray-400">Product Description:</span> {String(state.product_desc)}</div>
            <div><span className="text-gray-400">Base Price:</span> ₹ {state.baseprice}</div>
            <div className="text-sm text-gray-400">Started at: {new Date(state.createdAt).toLocaleString()}</div>
            <div className="text-sm text-gray-400">Ends at: {new Date(state.endTime).toLocaleString()}</div>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-pink-400">Live Biding</h4>
            <ul className="space-y-1 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
              {(state.bids || []).slice().sort((a, b) => b.amount - a.amount).map((b, i) => (
                <li key={i} className="text-green-300 font-medium">₹{b.amount} <span className="text-gray-400">by {b.bidderName}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
