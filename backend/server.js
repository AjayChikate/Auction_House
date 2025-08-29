require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');

const { connectDB, User, AuctionRoom } = require('./models');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin:'*', credentials: true } });

const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());


const signToken = (user) => {
  return jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
}

const authHttp = async (req, res, next) => {
  
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
     //console.log("hi")
    if (!token) return res.status(401).json({ message: 'No token' });
    req.user = jwt.verify(token, JWT_SECRET);
   
    next();
    
  }
   catch (e) {
    //console.log("hi2")
    return res.status(401).json({ message: 'Invalid token by uuser' });
  }
};



app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'Username & password required' });
    }
    const exists = await User.findOne({ username });

    if (exists){
       return res.status(409).json({ message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash });

    const token = signToken(user);
    res.json({ token, user: { _id: user._id, username: user.username } });
  } 
  catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Register failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({ token, user: { _id: user._id, username: user.username } });
  }
   catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Login failed' });
  }
});



app.get('/api/rooms', async (_req, res) => {
  
  const rooms = await AuctionRoom.find({}, { chats: 0, bids: 0 }).sort({ createdAt: -1 }).lean();  //lean mongo documents to plain js obj
  //console.log(rooms[0].createdAt.toLocaleString());
  res.json(rooms);
});

app.post('/api/profile',authHttp,async(req,res)=>{
    
  try{
    const { token, user } = req.body || {};
    const exists = await User.findOne({ username:user});
    if (!exists) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const exist=exists.username
    //const personalrooms = await AuctionRoom.find({ creatorName: exist });
    //const wonrooms = await AuctionRoom.find({ "highestBid.bidderName" : exist });
    const personalrooms = await AuctionRoom.find(
  { creatorName: exist,active: false },   // use user string instead of exist doc
  { 
    name: 1, 
    product_name: 1, 
    baseprice: 1, 
    "highestBid.amount": 1, 
    "highestBid.bidderName": 1 
  }
);
    const wonrooms = await AuctionRoom.find(
  { "highestBid.bidderName" : exist,active: false },   // use user string instead of exist doc
  { 
    name: 1, 
    creatorName:1,
    product_name: 1, 
    baseprice: 1, 
    "highestBid.amount": 1, 
    
  }
);

    res.json({
      message: "Profile data fetched successfully",
      personalrooms,
      wonrooms
    });

    
  }
  catch(e){
    console.error(e);
    res.status(500).json({ message: 'Bad usage' });
  }
})

app.post('/api/rooms', authHttp, async (req, res) => {
  try {
    const { name, pname,pdesc,durationMinutes = 5 ,baseprice} = req.body || {};
    if (!name){
      return res.status(400).json({ message: 'Name is required' });
    }
    const start=Date.now()
    const endTime = new Date(start+ Number(durationMinutes) * 60 * 1000);

    const room = await AuctionRoom.create({
      name,
      product_name:pname,
      product_desc:pdesc,
      creator: req.user._id,
      creatorName: req.user.username,
      endTime:endTime,
      baseprice:baseprice,
      active: true,
      highestBid: { amount: 0, bidder: null, bidderName: '' },
      bids: [],
      chats: []
    });

    scheduleAuctionEnd(room._id, endTime);
    res.status(201).json(room);
    io.emit('roomsUpdated');
  }
   catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Creation of yourr room failed' });
  }
});

app.get('/api/rooms/:id', authHttp,async (req, res) => {
// console.log("hi")
  try{
    const room = await AuctionRoom.findById(req.params.id).lean();
      if (!room){
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json(room);
  }
  catch(e){
     console.log(e);
     res.status(500).json({ message: 'Login failed' });
  }
  
});


io.use((socket, next) => {   // Socket auth middleware
  try {
    const token = socket.handshake.auth?.token; //web sockets connected !!
    if (!token) {
      return next(new Error('unauthorised user'));
    }
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user; // {_id, username}
    return next();
  } 
  catch (e) {
    return next(new Error('unauthorised user'));
  }
});

const timers = new Map();

const scheduleAuctionEnd = (roomId, endTime) => {
  clearAuctionTimer(roomId);
  const delay = Math.max(0, new Date(endTime).getTime() - Date.now());
  const to = setTimeout(() => endAuction(roomId).catch(console.error), delay); //schedulee a cntdown  when delayover, run this endAuction(roomId)
  timers.set(String(roomId), to);
};

const clearAuctionTimer = (roomId) => {
  const key = String(roomId);
  if (timers.has(key)) {
    clearTimeout(timers.get(key));  //cancels the running countdown timer in Node.js.
    timers.delete(key);
  }
};

const endAuction = async (roomId) => {
  const room = await AuctionRoom.findById(roomId);
  if (!room || !room.active) return;
  room.active = false;
  room.chats=[]  //save space
  room.bids=[]
  await room.save();

  io.to(String(roomId)).emit('A_ended', {
    roomId: String(room._id),
    highestBid: room.highestBid,
    finalBids: room.bids
  });


  clearAuctionTimer(roomId);
};

io.on('connection', async (socket) => {


  socket.on('joinroom', async ({ roomId }) => {
    const room = await AuctionRoom.findById(roomId);
    if (!room) return socket.emit('errorMsg', 'Room not found');
    socket.join(String(roomId));
    socket.emit('roomstate', {
      roomId: String(room._id),
      name: room.name,
      creatorName:room.creatorName,
      product_name:room.product_name,
      product_desc:room.product_desc,
      active: room.active,
      createdAt:room.createdAt,
      endTime: room.endTime,
      highestBid: room.highestBid,
      baseprice:room.baseprice,
      bids: room.bids.slice(-20),
      chats: room.chats.slice(-20),
    });
  });

  socket.on('leaveroom', ({ roomId }) => {
    socket.leave(String(roomId));
  });

  socket.on('chatmessage', async ({ roomId, text }) => {
    if (!text?.trim()) return;
    const room = await AuctionRoom.findById(roomId);
    if (!room) return;
    const msg = { user: socket.user._id, username: socket.user.username, text: text.trim(), at: new Date() };
    room.chats.push(msg);
    if (room.chats.length > 200){
       room.chats = room.chats.slice(-200);
    }
    await room.save();
    io.to(String(roomId)).emit('chatmessage', msg);
  });

  socket.on('placebid', async ({ roomId, amount }) => {
    const room = await AuctionRoom.findById(roomId);
    if (!room) {
      return socket.emit('errorMsg', 'Room not found');
    }
    if (!room.active || new Date() >= room.endTime) {
      if (room.active) await endAuction(roomId);
      return socket.emit('errormsg', 'Auction already ended');
    }
    const bidAmount = Number(amount);
   // console.log(bidAmount)
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      return socket.emit('errormsg', 'Invalid bid');
    }
   
    if(bidAmount <= (room.baseprice || 0)){
      
      return socket.emit('errormsg', 'Bid must be higher than base Price');
    }
    if (bidAmount <= (room.highestBid?.amount || 0)) {
      return socket.emit('errormsg', 'Bid must be higher than current highest');
    }

    const bid = {
      amount: bidAmount,
      bidder: socket.user._id,
      bidderName: socket.user.username,
      at: new Date()
    };
    room.bids.push(bid);
    room.highestBid = { amount: bid.amount, bidder: bid.bidder, bidderName: bid.bidderName };
    await room.save();

    io.to(String(roomId)).emit('bidupdate', {
      highestBid: room.highestBid,
      lastBid: bid
    });
  });

  socket.on('disconnect', () => {});
});


(async () => {
  await connectDB(process.env.MONGO_URI);
  const activeRooms = await AuctionRoom.find({ active: true });
  activeRooms.forEach(r => scheduleAuctionEnd(r._id, r.endTime));
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server listening on :${PORT}`));
  
})();

