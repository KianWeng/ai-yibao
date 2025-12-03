const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
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
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

