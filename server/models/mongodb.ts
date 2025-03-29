import mongoose from 'mongoose';

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    // Get the MongoDB URI from the environment variable
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MongoDB URI is not defined in environment variables');
      return;
    }
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Exit process with failure
    process.exit(1);
  }
};

// Define schemas for MongoDB
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['startup', 'investor'],
    required: true
  },
  walletAddress: {
    type: String,
    default: null
  },
  upiId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const StartupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pitch: {
    type: String,
    required: true
  },
  stage: {
    type: String,
    enum: ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c'],
    required: true
  },
  fundingGoal: {
    type: Number,
    required: true
  },
  fundsRaised: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DocumentSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  sizeInMb: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const UpdateSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  visibility: {
    type: String,
    enum: ['all-investors', 'major-investors'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TransactionSchema = new mongoose.Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['metamask', 'upi'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    required: true
  },
  transactionReference: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const User = mongoose.model('User', UserSchema);
const Startup = mongoose.model('Startup', StartupSchema);
const Document = mongoose.model('Document', DocumentSchema);
const Update = mongoose.model('Update', UpdateSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

export {
  connectDB,
  User,
  Startup,
  Document,
  Update,
  Transaction
};