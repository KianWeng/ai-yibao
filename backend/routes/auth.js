const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// JWT密钥（生产环境应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 初始化默认用户
async function initDefaultUser() {
  try {
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0].count === 0) {
      // 创建默认管理员账户：admin / admin123
      const adminPassword = await bcrypt.hash('admin123', 10);
      await db.run(
        'INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
        ['admin', adminPassword, '系统管理员', 'admin', 1]
      );
      console.log('默认管理员账户已创建: admin / admin123');
      
      // 创建默认普通用户账户：user / user123
      const userPassword = await bcrypt.hash('user123', 10);
      await db.run(
        'INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
        ['user', userPassword, '普通用户', 'user', 1]
      );
      console.log('默认普通用户账户已创建: user / user123');
    } else {
      // 检查是否有普通用户，如果没有则创建
      const userExists = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['user']);
      if (!userExists || userExists.count === 0) {
        const userPassword = await bcrypt.hash('user123', 10);
        await db.run(
          'INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
          ['user', userPassword, '普通用户', 'user', 1]
        );
        console.log('默认普通用户账户已创建: user / user123');
      }
    }
  } catch (error) {
    console.error('初始化默认用户失败:', error);
  }
}

// 启动时初始化默认用户
initDefaultUser();

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空',
        data: null
      });
    }

    // 查询用户
    const user = await db.get(
      'SELECT * FROM users WHERE username = ? AND status = 1',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, realName, phone, idCard } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空',
        data: null
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度不能少于6位',
        data: null
      });
    }

    // 检查用户名是否已存在
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在',
        data: null
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 检查表结构，决定使用哪些字段
    let insertSql, insertParams;
    try {
      // 尝试查询 phone 字段是否存在
      await db.query('SELECT phone FROM users LIMIT 1');
      // 字段存在，使用完整字段列表
      insertSql = 'INSERT INTO users (username, password, real_name, phone, id_card, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
      insertParams = [username, hashedPassword, realName || '', phone || '', idCard || '', 'user', 1];
    } catch (e) {
      // 字段不存在，使用基础字段列表
      console.warn('phone 字段不存在，使用基础字段注册');
      insertSql = 'INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)';
      insertParams = [username, hashedPassword, realName || '', 'user', 1];
    }

    // 创建用户（默认角色为普通用户）
    const result = await db.run(insertSql, insertParams);

    res.json({
      code: 200,
      message: '注册成功',
      data: {
        userId: result.lastID
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', async (req, res) => {
  // JWT是无状态的，登出主要在前端删除token
  res.json({
    code: 200,
    message: '登出成功',
    data: null
  });
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查询用户信息（尝试获取所有字段，如果字段不存在则忽略）
    let user;
    try {
      user = await db.get(
        'SELECT id, username, real_name, role, status, phone, id_card FROM users WHERE id = ? AND status = 1',
        [decoded.id]
      );
    } catch (e) {
      // 如果字段不存在，使用基础查询
      user = await db.get(
        'SELECT id, username, real_name, role, status FROM users WHERE id = ? AND status = 1',
        [decoded.id]
      );
    }

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        phone: user.phone || '',
        idCard: user.id_card || ''
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'Token无效或已过期',
        data: null
      });
    }
    
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * 中间件：验证JWT token
 */
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未授权，请先登录',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: 'Token无效或已过期',
      data: null
    });
  }
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;

