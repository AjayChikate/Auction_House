import React from "react"
import { FaEnvelope, FaPhoneAlt, FaQuestionCircle } from "react-icons/fa"

const Support = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
        <FaQuestionCircle /> Support Center
      </h1>
      <p className="text-gray-300 mb-8 text-lg">
        Need help? We re here for you! If you have any questions about auctions, payments, or your account,
        check the FAQs below or reach out to us directly.
      </p>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
        <ul className="space-y-3 text-gray-300">
          <li>
            <span className="font-semibold text-cyan-400">Q: How do I join an auction?</span>
            <br /> A: Log in, go to the Lobby, and click on the auction room you want to join.
          </li>
          <li>
            <span className="font-semibold text-cyan-400">Q: How do I create my own auction room?</span>
            <br /> A: Log in, go to the Lobby, and click on the Create Room button ,and fill details to create.
          </li>
          <li>
            <span className="font-semibold text-cyan-400">Q: Can I cancel my bid?</span>
            <br /> A: No, bids are final once placed. Please bid carefully.
          </li>
          <li>
            <span className="font-semibold text-cyan-400">Q: What happens after an auction ends?</span>
            <br /> A: The highest bidder wins. Chats and bids for that room are cleared automatically(to save some space).
          </li>
          <li>
            <span className="font-semibold text-cyan-400">Q: Why owner of auction (auction room creator) allowed to bid?</span>
            <br /> A: This feature is intentionally added so that owner of aution can change or update baseprice during live auction process only to ensure the item isnt sold for less than what  owner personally values.
          </li>
        </ul>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Contact Us</h2>
        <p className="text-gray-300 mb-4">
          Still need help? Contact our support team directly.
        </p>
        <div className="space-y-2">
          <p className="flex items-center gap-2">
            <FaEnvelope className="text-cyan-400" /> 
          </p>
          <p className="flex items-center gap-2">
            <FaPhoneAlt className="text-cyan-400" /> 
          </p>
        </div>
      </div>
    </div>
  )
}

export default Support
