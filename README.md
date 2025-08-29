# 🏛️ Auction House – A Real Time Bidding Web App  

Auction House is a Full-stack web app built with **React, Node.js, Express,MongoDB and Web Sockets**.  
It allows users to create auction rooms, place live bids,do live chatting, and compete in real-time.  
Designed for speed, transparency, and excitement with smooth UX and secure transactions.  

---

## 🚀 Features  

- 🔐 **Authentication**  
  Secure signup/login system with JWT & bcrypt.  

- 🏗️ **Auction Room Creation**  
  Users can create auction rooms, set a base price, and start the bidding.  

- ⚒️ **Real-Time Bidding**  
  Highest bid updates instantly with socket-powered interactions.  

- 📢 **Chat System**  
  Live chat inside auction rooms for seamless communication using sockets.  

- 📊 **Auction Timer**  
  Countdown timer with auto-close once the auction ends.  

- 📜 **Dashboard**
  
  The Dashboard gives users a quick overview of the auction platform where they can see all rooms created and view past auctions,
  including winning bid details and participants.And also track record of their personal wins 

- 🧹 **Auto Cleanup**  
  Once auction ends, chats & bids reset to save database space.  

- 🌐 **MongoDB Integration**  
  All auctions, bids, and users are stored in a MongoDB database.  

---

## 🛠️ Installation  

```bash
git clone https://github.com/AjayChikate/Auction_House.git
cd Auction_House

cd backend
npm install

- create .env file (in backend folder)
MONGO_URI=mongodb://localhost:27017/
JWT_SECRET=ajay123 (set as per you)
CORS_ORIGIN=http://localhost:5173 (your frontend url)
PORT=5000 (your backend port)

cd ..

cd frontend
npm install

- create .env file (in frontend folder)
VITE_API_BASE=http://localhost:5000 (your backend url)

cd..

cd backend
npm run dev

cd frontend
npm run dev

