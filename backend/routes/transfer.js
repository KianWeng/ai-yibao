const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');

/**
 * GET /api/transfer/hospitals
 * 获取医院列表（支持搜索和筛选）
 */
router.get('/hospitals', async (req, res) => {
  try {
    const { search = '', specialty = '', level = '', sortBy = 'rating' } = req.query;
    
    let sql = 'SELECT * FROM hospitals WHERE status = ?';
    const params = ['营业中'];
    
    if (search) {
      sql += ' AND (name LIKE ? OR specialty LIKE ? OR description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    if (specialty) {
      sql += ' AND specialty LIKE ?';
      params.push(`%${specialty}%`);
    }
    
    if (level) {
      sql += ' AND level = ?';
      params.push(level);
    }
    
    // 排序
    if (sortBy === 'rating') {
      sql += ' ORDER BY rating DESC, rating_count DESC';
    } else if (sortBy === 'cost') {
      sql += ' ORDER BY average_cost ASC';
    } else if (sortBy === 'name') {
      sql += ' ORDER BY name ASC';
    }
    
    const hospitals = await db.query(sql, params);
    
    // 获取每个医院的评价
    const hospitalsWithReviews = await Promise.all(
      hospitals.map(async (hospital) => {
        const reviews = await db.query(
          'SELECT * FROM hospital_reviews WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 5',
          [hospital.id]
        );
        return {
          ...hospital,
          recentReviews: reviews
        };
      })
    );
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: hospitalsWithReviews,
        total: hospitalsWithReviews.length
      }
    });
  } catch (error) {
    console.error('获取医院列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * GET /api/transfer/hospitals/:id
 * 获取医院详情
 */
router.get('/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const hospital = await db.get('SELECT * FROM hospitals WHERE id = ?', [id]);
    
    if (!hospital) {
      return res.status(404).json({
        code: 404,
        message: '医院不存在',
        data: null
      });
    }
    
    // 获取所有评价
    const reviews = await db.query(
      'SELECT r.*, u.real_name, u.username FROM hospital_reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.hospital_id = ? ORDER BY r.created_at DESC',
      [id]
    );
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...hospital,
        reviews
      }
    });
  } catch (error) {
    console.error('获取医院详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * POST /api/transfer/hospitals/:id/reviews
 * 添加医院评价（需要登录）
 */
router.post('/hospitals/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        code: 400,
        message: '评分必须在1-5之间',
        data: null
      });
    }
    
    // 检查医院是否存在
    const hospital = await db.get('SELECT id FROM hospitals WHERE id = ?', [id]);
    if (!hospital) {
      return res.status(404).json({
        code: 404,
        message: '医院不存在',
        data: null
      });
    }
    
    // 添加评价
    await db.run(
      'INSERT INTO hospital_reviews (hospital_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [id, userId, rating, comment || '']
    );
    
    // 更新医院评分
    const reviews = await db.query(
      'SELECT rating FROM hospital_reviews WHERE hospital_id = ?',
      [id]
    );
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await db.run(
      'UPDATE hospitals SET rating = ?, rating_count = ? WHERE id = ?',
      [avgRating.toFixed(2), reviews.length, id]
    );
    
    res.json({
      code: 200,
      message: '评价成功',
      data: null
    });
  } catch (error) {
    console.error('添加评价失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * POST /api/transfer/applications
 * 提交转院申请（需要登录）
 */
router.post('/applications', authenticateToken, async (req, res) => {
  try {
    const {
      patientName,
      patientIdCard,
      patientPhone,
      fromHospital,
      toHospitalId,
      disease,
      diseaseDescription,
      reason,
      expectedCost
    } = req.body;
    
    if (!patientName || !toHospitalId) {
      return res.status(400).json({
        code: 400,
        message: '患者姓名和目标医院不能为空',
        data: null
      });
    }
    
    // 检查目标医院是否存在
    const hospital = await db.get('SELECT name FROM hospitals WHERE id = ?', [toHospitalId]);
    if (!hospital) {
      return res.status(404).json({
        code: 404,
        message: '目标医院不存在',
        data: null
      });
    }
    
    // 生成申请编号
    const applyNo = `TA${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // 创建转院申请
    const result = await db.run(
      `INSERT INTO transfer_applications 
       (apply_no, user_id, patient_name, patient_id_card, patient_phone, from_hospital, to_hospital, to_hospital_id, disease, disease_description, reason, expected_cost, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applyNo,
        req.user.id,
        patientName,
        patientIdCard || '',
        patientPhone || '',
        fromHospital || '',
        hospital.name,
        toHospitalId,
        disease || '',
        diseaseDescription || '',
        reason || '',
        expectedCost || 0,
        'pending'
      ]
    );
    
    res.json({
      code: 200,
      message: '转院申请提交成功',
      data: {
        id: result.lastID,
        applyNo
      }
    });
  } catch (error) {
    console.error('提交转院申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * GET /api/transfer/applications
 * 获取转院申请列表（需要登录）
 */
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const { status = '' } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // 检查表结构，如果 to_hospital_id 不存在，使用 to_hospital 字段
    let sql = 'SELECT t.*';
    try {
      // 尝试查询 to_hospital_id 字段是否存在
      await db.query('SELECT to_hospital_id FROM transfer_applications LIMIT 1');
      // 如果成功，说明字段存在，可以使用 JOIN
      sql += ', h.name as to_hospital_name, h.level as to_hospital_level FROM transfer_applications t LEFT JOIN hospitals h ON t.to_hospital_id = h.id WHERE 1=1';
    } catch (e) {
      // 字段不存在，不使用 JOIN
      sql += ' FROM transfer_applications t WHERE 1=1';
    }
    
    const params = [];
    
    // 普通用户只能查看自己的申请
    if (!isAdmin) {
      // 检查 user_id 字段是否存在
      try {
        await db.query('SELECT user_id FROM transfer_applications LIMIT 1');
        sql += ' AND t.user_id = ?';
        params.push(userId);
      } catch (e) {
        // user_id 字段不存在，跳过用户过滤（兼容旧数据）
        console.warn('user_id 字段不存在，跳过用户过滤');
      }
    }
    
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY t.apply_time DESC';
    
    const applications = await db.query(sql, params);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: applications,
        total: applications.length
      }
    });
  } catch (error) {
    console.error('获取转院申请列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * GET /api/transfer/applications/stats
 * 获取转院申请统计信息（仅管理员）
 */
router.get('/applications/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权限操作',
        data: null
      });
    }
    
    // 获取各种状态的申请数量
    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      today: 0,
      week: 0,
      month: 0
    };
    
    // 总数量
    const totalResult = await db.get('SELECT COUNT(*) as count FROM transfer_applications');
    stats.total = totalResult?.count || 0;
    
    // 各状态数量
    const pendingResult = await db.get("SELECT COUNT(*) as count FROM transfer_applications WHERE status = 'pending'");
    stats.pending = pendingResult?.count || 0;
    
    const approvedResult = await db.get("SELECT COUNT(*) as count FROM transfer_applications WHERE status = 'approved'");
    stats.approved = approvedResult?.count || 0;
    
    const rejectedResult = await db.get("SELECT COUNT(*) as count FROM transfer_applications WHERE status = 'rejected'");
    stats.rejected = rejectedResult?.count || 0;
    
    // 今日申请数量
    const todayResult = await db.get(
      "SELECT COUNT(*) as count FROM transfer_applications WHERE DATE(apply_time) = DATE('now')"
    );
    stats.today = todayResult?.count || 0;
    
    // 本周申请数量
    const weekResult = await db.get(
      "SELECT COUNT(*) as count FROM transfer_applications WHERE DATE(apply_time) >= DATE('now', '-7 days')"
    );
    stats.week = weekResult?.count || 0;
    
    // 本月申请数量
    const monthResult = await db.get(
      "SELECT COUNT(*) as count FROM transfer_applications WHERE DATE(apply_time) >= DATE('now', 'start of month')"
    );
    stats.month = monthResult?.count || 0;
    
    res.json({
      code: 200,
      message: '获取成功',
      data: stats
    });
  } catch (error) {
    console.error('获取申请统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * GET /api/transfer/applications/:id
 * 获取转院申请详情
 */
router.get('/applications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    let sql = 'SELECT t.*, h.name as to_hospital_name, h.level as to_hospital_level, h.address as to_hospital_address, h.phone as to_hospital_phone FROM transfer_applications t LEFT JOIN hospitals h ON t.to_hospital_id = h.id WHERE t.id = ?';
    const params = [id];
    
    // 普通用户只能查看自己的申请
    if (!isAdmin) {
      sql += ' AND t.user_id = ?';
      params.push(userId);
    }
    
    const application = await db.get(sql, params);
    
    if (!application) {
      return res.status(404).json({
        code: 404,
        message: '申请不存在或无权限查看',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: application
    });
  } catch (error) {
    console.error('获取转院申请详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * PUT /api/transfer/applications/:id/approve
 * 批准转院申请（仅管理员）
 */
router.put('/applications/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权限操作',
        data: null
      });
    }
    
    const { id } = req.params;
    const { adminComment } = req.body;
    
    // 先检查申请是否存在且状态为待审核
    const application = await db.get(
      'SELECT id, status FROM transfer_applications WHERE id = ?',
      [id]
    );
    
    if (!application) {
      return res.status(404).json({
        code: 404,
        message: '申请不存在',
        data: null
      });
    }
    
    if (application.status !== 'pending') {
      return res.status(400).json({
        code: 400,
        message: `该申请已处理，当前状态：${application.status === 'approved' ? '已批准' : '已拒绝'}`,
        data: null
      });
    }
    
    // 更新申请状态
    const result = await db.run(
      'UPDATE transfer_applications SET status = ?, admin_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
      ['approved', adminComment || '', id, 'pending']
    );
    
    if (result.changes === 0) {
      return res.status(400).json({
        code: 400,
        message: '申请状态已变更，无法批准',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '申请已批准',
      data: {
        id: id,
        status: 'approved'
      }
    });
  } catch (error) {
    console.error('批准申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

/**
 * PUT /api/transfer/applications/:id/reject
 * 拒绝转院申请（仅管理员）
 */
router.put('/applications/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权限操作',
        data: null
      });
    }
    
    const { id } = req.params;
    const { adminComment } = req.body;
    
    if (!adminComment || adminComment.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '拒绝原因不能为空',
        data: null
      });
    }
    
    // 先检查申请是否存在且状态为待审核
    const application = await db.get(
      'SELECT id, status FROM transfer_applications WHERE id = ?',
      [id]
    );
    
    if (!application) {
      return res.status(404).json({
        code: 404,
        message: '申请不存在',
        data: null
      });
    }
    
    if (application.status !== 'pending') {
      return res.status(400).json({
        code: 400,
        message: `该申请已处理，当前状态：${application.status === 'approved' ? '已批准' : '已拒绝'}`,
        data: null
      });
    }
    
    // 更新申请状态
    const result = await db.run(
      'UPDATE transfer_applications SET status = ?, admin_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
      ['rejected', adminComment.trim(), id, 'pending']
    );
    
    if (result.changes === 0) {
      return res.status(400).json({
        code: 400,
        message: '申请状态已变更，无法拒绝',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '申请已拒绝',
      data: {
        id: id,
        status: 'rejected'
      }
    });
  } catch (error) {
    console.error('拒绝申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

module.exports = router;

