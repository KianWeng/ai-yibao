const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: ['http://zephyr-w.online:9000', 'http://localhost:9000', 'http://127.0.0.1:9000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 初始化数据库
db.init();

// 路由
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/drg', require('./routes/drg'));
app.use('/api/rehabilitation', require('./routes/rehabilitation'));
app.use('/api/risk', require('./routes/risk'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});

