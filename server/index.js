const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { verifyMessage } = require('viem');
require('dotenv').config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        isActive: true,
        isVerified: true,
      }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Auth Routes
app.post('/api/auth/nonce', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Generate a cryptographically secure nonce
    const nonce = crypto.randomBytes(32).toString('hex');

    // Update or create user with nonce
    const user = await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: { nonce },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        nonce,
      },
    });

    res.json({ nonce });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user and verify nonce exists
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user || !user.nonce) {
      return res.status(404).json({ error: 'User not found or nonce expired' });
    }

    // Verify the signature using SIWE
    try {
      const isValid = await verifyMessage({
        address: walletAddress,
        message,
        signature,
      });

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } catch (verificationError) {
      console.error('Signature verification failed:', verificationError);
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // Clear the nonce after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { nonce: null },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({ token, user: { id: user.id, walletAddress: user.walletAddress } });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        createdTokens: {
          select: {
            id: true,
            name: true,
            symbol: true,
            contractAddress: true,
            totalSupply: true,
            holderCount: true,
          },
        },
        tokenHoldings: {
          include: {
            token: {
              select: {
                name: true,
                symbol: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, bio, profileImage } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        displayName,
        bio,
        profileImage,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Token Routes
app.get('/api/tokens', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isPublic: true,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const tokens = await prisma.token.findMany({
      where,
      include: {
        creator: {
          select: {
            displayName: true,
            twitterUsername: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.token.count({ where });

    res.json({
      tokens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Tokens fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tokens', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      symbol,
      description,
      logoUrl,
      contractAddress,
      mintingRule,
      mintAmount,
      maxSupply,
    } = req.body;

    if (!name || !symbol || !contractAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = await prisma.token.create({
      data: {
        name,
        symbol: symbol.toUpperCase(),
        description,
        logoUrl,
        contractAddress: contractAddress.toLowerCase(),
        mintingRule: mintingRule || 'manual',
        mintAmount: BigInt(mintAmount || 1),
        maxSupply: maxSupply ? BigInt(maxSupply) : null,
        creatorId: req.user.id,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'token_created',
        description: `Token ${name} (${symbol}) was created`,
        userId: req.user.id,
        tokenId: token.id,
      },
    });

    res.status(201).json(token);
  } catch (error) {
    console.error('Token creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transaction Routes
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, tokenId } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(tokenId && { tokenId }),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        token: {
          select: {
            name: true,
            symbol: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.transaction.count({ where });

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notifications Routes
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id,
        userId: req.user.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json(notification);
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics Routes
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's created tokens count
    const tokensCreated = await prisma.token.count({
      where: { creatorId: userId },
    });

    // Get total token supply across all user's tokens
    const userTokens = await prisma.token.findMany({
      where: { creatorId: userId },
      select: { totalSupply: true },
    });

    const totalSupply = userTokens.reduce((sum, token) => sum + Number(token.totalSupply), 0);

    // Get total transactions
    const totalTransactions = await prisma.transaction.count({
      where: { userId },
    });

    // Get recent activities
    const recentActivities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        token: {
          select: { name: true, symbol: true },
        },
      },
    });

    res.json({
      tokensCreated,
      totalSupply,
      totalTransactions,
      recentActivities,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});