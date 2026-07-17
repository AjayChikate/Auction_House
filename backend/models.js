const mongoose = require('mongoose');

const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set. Refusing to start without a database.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, { dbName: 'socket_auctions' });
  console.log('Mongo connected');
};

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/, 
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const BidSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidderName: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AuctionRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    product_name: { type: String, trim: true, maxlength: 100 },
    product_desc: { type: String, maxlength: 1000, default: '' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    creatorName: { type: String, required: true },
    endTime: { type: Date, required: true },
    active: { type: Boolean, default: true },
    baseprice: { type: Number, default: 0, min: 0 },
    highestBid: {
      amount: { type: Number, default: 0 },
      bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      bidderName: { type: String, default: '' },
    },
    bids: { type: [BidSchema], default: [] },
    chats: { type: [ChatSchema], default: [] },
  },
  { timestamps: true }
);

AuctionRoomSchema.index({ active: 1, createdAt: -1 });
AuctionRoomSchema.index({ creatorName: 1, active: 1 });
AuctionRoomSchema.index({ 'highestBid.bidderName': 1, active: 1 });


const MAX_BIDS_STORED = 30;
const MAX_CHATS_STORED = 10;

const User = mongoose.model('User', UserSchema);
const AuctionRoom = mongoose.model('AuctionRoom', AuctionRoomSchema);

module.exports = { connectDB, User, AuctionRoom, MAX_BIDS_STORED, MAX_CHATS_STORED };
