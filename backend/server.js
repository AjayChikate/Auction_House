require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');

const { connectDB, User, AuctionRoom, MAX_BIDS_STORED, MAX_CHATS_STORED } = require('./models');


const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: missing required env var ${key}`);
    process.exit(1);
  }
}
 
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const BCRYPT_ROUNDS = 10;
const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' })); 

const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'], credentials: true },
});


const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const signToken = (user) =>
  jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const RESERVED_USERNAMES = new Set(['no one', 'system', 'admin']);

const validateCredentials = (username, password) => {
  if (typeof username !== 'string' || typeof password !== 'string') return 'Invalid input';
  if (!USERNAME_RE.test(username)) return 'Username must be 3-30 chars, letters/numbers/underscore only';
  if (RESERVED_USERNAMES.has(username.toLowerCase())) return 'This username is reserved';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
};

const authHttp = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


// Rate limiting (HTTP) — protects auth + room creation from abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

const createRoomLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many rooms created, slow down' },
});

//routes
app.post(
  '/api/auth/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    const validationError = validateCredentials(username, password);
    if (validationError) return res.status(400).json({ message: validationError });

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ message: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ username, passwordHash });

    const token = signToken(user);
    res.status(201).json({ token, user: { _id: user._id, username: user.username } });
  })
);

app.post(
  '/api/auth/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { _id: user._id, username: user.username } });
  })
);


// Room routes
app.get(
  '/api/rooms',
  asyncHandler(async (_req, res) => {
    const rooms = await AuctionRoom.find({}, { chats: 0, bids: 0 })
      .sort({ createdAt: -1 })
      .limit(100) 
      .lean();
    res.json(rooms);
  })
);

app.get(
  '/api/rooms/:id',
  authHttp,
  asyncHandler(async (req, res) => {
    const room = await AuctionRoom.findById(req.params.id).lean();
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  })
);

app.post(
  '/api/rooms',
  authHttp,
  createRoomLimiter,
  asyncHandler(async (req, res) => {
    const { name, pname, pdesc, durationMinutes = 5, baseprice = 0 } = req.body || {};

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (name.length > 100 || (pdesc && String(pdesc).length > 1000)) {
      return res.status(400).json({ message: 'Name/description too long' });
    }
    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60) {
      return res.status(400).json({ message: 'Duration must be between 1 minute and 24 hours' });
    }
    const base = Number(baseprice);
    if (!Number.isFinite(base) || base < 0) {
      return res.status(400).json({ message: 'Base price must be a non-negative number' });
    }

    const endTime = new Date(Date.now() + duration * 60 * 1000);

    const room = await AuctionRoom.create({
      name: name.trim(),
      product_name: pname,
      product_desc: pdesc,
      creator: req.user._id,
      creatorName: req.user.username,
      endTime,
      baseprice: base,
      active: true,
      highestBid: { amount: 0, bidder: null, bidderName: '' },
      bids: [],
      chats: [],
    });

    scheduleAuctionEnd(room._id, endTime);
    res.status(201).json(room);
    io.emit('roomsUpdated');
  })
);

app.get(
  '/api/profile',
  authHttp,
  asyncHandler(async (req, res) => {
    const me = req.user.username;

    const [personalrooms, wonrooms] = await Promise.all([
      AuctionRoom.find(
        { creatorName: me, active: false },
        { name: 1, product_name: 1, baseprice: 1, 'highestBid.amount': 1, 'highestBid.bidderName': 1 }
      ).lean(),
      AuctionRoom.find(
        { 'highestBid.bidderName': me, active: false },
        { name: 1, creatorName: 1, product_name: 1, baseprice: 1, 'highestBid.amount': 1 }
      ).lean(),
    ]);

    res.json({ message: 'Profile data fetched successfully', personalrooms, wonrooms });
  })
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});



// Socket.io auth middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('unauthorised user'));
    socket.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return next(new Error('unauthorised user'));
  }
});


const timers = new Map();

const scheduleAuctionEnd = (roomId, endTime) => {
  clearAuctionTimer(roomId);
  const delay = Math.max(0, new Date(endTime).getTime() - Date.now());
  const to = setTimeout(() => endAuction(roomId).catch(console.error), delay);
  timers.set(String(roomId), to);
};

const clearAuctionTimer = (roomId) => {
  const key = String(roomId);
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
};

const endAuction = async (roomId) => {
  const room = await AuctionRoom.findOneAndUpdate(
    { _id: roomId, active: true },
    {
      $set: { active: false },
      $push: {
        bids: { $each: [], $slice: -MAX_BIDS_STORED },
        chats: { $each: [], $slice: -MAX_CHATS_STORED },
      },
    },
    { new: true }
  );
  if (!room) return;

  io.to(String(roomId)).emit('A_ended', {
    roomId: String(room._id),
    highestBid: room.highestBid,
    finalBids: room.bids,
  });

  clearAuctionTimer(roomId);
};


const socketHits = new Map(); 
const checkSocketRate = (socketId, limit, windowMs) => {
  const now = Date.now();
  const entry = socketHits.get(socketId) || { count: 0, windowStart: now };
  if (now - entry.windowStart > windowMs) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  socketHits.set(socketId, entry);
  return entry.count <= limit;
};

io.on('connection', (socket) => {
  socket.on('joinroom', async ({ roomId }) => {
    try {
      const room = await AuctionRoom.findById(roomId).lean();
      if (!room) return socket.emit('errorMsg', 'Room not found');
      socket.join(String(roomId));
      socket.emit('roomstate', {
        roomId: String(room._id),
        name: room.name,
        creatorName: room.creatorName,
        product_name: room.product_name,
        product_desc: room.product_desc,
        active: room.active,
        createdAt: room.createdAt,
        endTime: room.endTime,
        highestBid: room.highestBid,
        baseprice: room.baseprice,
        bids: (room.bids || []).slice(-20),
        chats: (room.chats || []).slice(-20),
      });
    } catch (e) {
      socket.emit('errorMsg', 'Failed to join room');
    }
  });

  socket.on('leaveroom', ({ roomId }) => {
    socket.leave(String(roomId));
  });

  socket.on('chatmessage', async ({ roomId, text }) => {
    if (!checkSocketRate(`${socket.id}:chat`, 10, 5000)) {
      return socket.emit('errorMsg', 'You are sending messages too fast');
    }
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) return;
    if (trimmed.length > 500) return socket.emit('errorMsg', 'Message too long');

    try {
      const msg = { user: socket.user._id, username: socket.user.username, text: trimmed, at: new Date() };
      const room = await AuctionRoom.findByIdAndUpdate(
        roomId,
        { $push: { chats: { $each: [msg], $slice: -MAX_CHATS_STORED } } },
        { new: true }
      );
      if (!room) return socket.emit('errorMsg', 'Room not found');
      io.to(String(roomId)).emit('chatmessage', msg);
    } catch (e) {
      socket.emit('errorMsg', 'Failed to send message');
    }
  });

  socket.on('placebid', async ({ roomId, amount }) => {
    if (!checkSocketRate(`${socket.id}:bid`, 5, 2000)) {
      return socket.emit('errorMsg', 'You are bidding too fast');
    }
    const bidAmount = Number(amount);
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      return socket.emit('errorMsg', 'Invalid bid');
    }

    const bid = {
      amount: bidAmount,
      bidder: socket.user._id,
      bidderName: socket.user.username,
      at: new Date(),
    };

    try {
      const room = await AuctionRoom.findOneAndUpdate(
        {
          _id: roomId,
          active: true,
          endTime: { $gt: new Date() },
          baseprice: { $lt: bidAmount },
          'highestBid.amount': { $lt: bidAmount },
        },
        {
          $set: { highestBid: { amount: bid.amount, bidder: bid.bidder, bidderName: bid.bidderName } },
          $push: { bids: { $each: [bid], $slice: -MAX_BIDS_STORED } },
        },
        { new: true }
      );

      if (!room) {
        const current = await AuctionRoom.findById(roomId).lean();
        if (!current) return socket.emit('errorMsg', 'Room not found');
        if (!current.active || new Date() >= new Date(current.endTime)) {
          return socket.emit('errorMsg', 'Auction already ended');
        }
        if (bidAmount <= current.baseprice) {
          return socket.emit('errorMsg', 'Bid must be higher than base price');
        }
        return socket.emit('errorMsg', 'Bid must be higher than current highest');
      }

      io.to(String(roomId)).emit('bidupdate', { highestBid: room.highestBid, lastBid: bid });
    } catch (e) {
      socket.emit('errorMsg', 'Failed to place bid');
    }
  });

  socket.on('disconnect', () => {
    socketHits.delete(`${socket.id}:chat`);
    socketHits.delete(`${socket.id}:bid`);
  });
});


// Start
(async () => {
  await connectDB(process.env.MONGO_URI);
  const activeRooms = await AuctionRoom.find({ active: true }, { endTime: 1 }).lean();
  activeRooms.forEach((r) => scheduleAuctionEnd(r._id, r.endTime));
  server.listen(PORT, () => console.log(`Server listening on :${PORT}`));
})();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
