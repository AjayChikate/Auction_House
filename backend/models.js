const mongoose = require('mongoose');


const connectDB = async (mongo) => {
await mongoose.connect(mongo, { dbName: 'socket_auctions' });
console.log('Mongo connected');
};


const UserSchema = new mongoose.Schema({
username: { type: String, unique: true, required: true, trim: true },
passwordHash: { type: String, required: true },
}, { timestamps: true });


const BidSchema = new mongoose.Schema({
amount: { type: Number, required: true, min: 0 },
bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  //bidder is storing OBJ_id not name
bidderName: { type: String, required: true },
at: { type: Date, default: Date.now }
}, { _id: false });


const ChatSchema = new mongoose.Schema({
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
username: { type: String, required: true },
text: { type: String, required: true },
at: { type: Date, default: Date.now }
}, { _id: false });


const AuctionRoomSchema = new mongoose.Schema({
name: { type: String, required: true, trim: true },
product_name: { type: String, trim: true },   // badme required: true, 
product_desc: { type: String},
creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
creatorName: { type: String, required: true },
endTime: { type: Date, required: true },
active: { type: Boolean, default: true },
baseprice:{type : Number,default:0},
highestBid: {
amount: { type: Number, default: 0},
bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
bidderName: { type: String, default: '' },
},
bids: [BidSchema],
chats: [ChatSchema],
}, { timestamps: true });


const User = mongoose.model('User', UserSchema);
const AuctionRoom = mongoose.model('AuctionRoom', AuctionRoomSchema);


module.exports={connectDB, User, AuctionRoom };