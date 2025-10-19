const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
// 如果在 Docker 中运行，环境变量已经由 docker-compose 传入
// 如果本地运行，从根目录加载 .env
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

// Import routes
const authRoutes = require('./routes/auth');
const wordRoutes = require('./routes/words');
const userRoutes = require('./routes/users');
const articleRoutes = require('./routes/articles');
const ocrRoutes = require('./routes/ocr');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 增加JSON请求体限制，支持大图片
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/words-learning', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/ocr', ocrRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Words Learning API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;

