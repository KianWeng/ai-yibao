const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取康复机构列表
router.get('/institutions', async (req, res) => {
  try {
    const { search = '' } = req.query;
    
    let sql = 'SELECT * FROM rehabilitation_institutions WHERE 1=1';
    const params = [];
    
    if (search) {
      sql += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const list = await db.query(sql, params);
    
    // 格式化数据
    const formattedList = list.map(item => ({
      id: item.id,
      name: item.name,
      level: item.level,
      bedCount: item.bed_count,
      specialty: item.specialty,
      status: item.status
    }));
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedList
      }
    });
  } catch (error) {
    console.error('获取康复机构列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 获取转院申请列表
router.get('/transfers', async (req, res) => {
  try {
    const { status = '' } = req.query;
    
    let sql = 'SELECT * FROM transfer_applications WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY apply_time DESC';
    
    const list = await db.query(sql, params);
    
    // 格式化数据
    const formattedList = list.map(item => ({
      id: item.id,
      applyNo: item.apply_no,
      patientName: item.patient_name,
      fromHospital: item.from_hospital,
      toHospital: item.to_hospital,
      disease: item.disease,
      applyTime: item.apply_time,
      status: item.status
    }));
    
    // 获取统计信息
    const today = new Date().toISOString().split('T')[0];
    const todayResult = await db.get(
      'SELECT COUNT(*) as count FROM transfer_applications WHERE DATE(apply_time) = ?',
      [today]
    );
    const weekResult = await db.get(
      'SELECT COUNT(*) as count FROM transfer_applications WHERE DATE(apply_time) >= DATE("now", "-7 days")'
    );
    const monthResult = await db.get(
      'SELECT COUNT(*) as count FROM transfer_applications WHERE DATE(apply_time) >= DATE("now", "-30 days")'
    );
    
    const stats = {
      today: todayResult ? todayResult.count : 0,
      week: weekResult ? weekResult.count : 0,
      month: monthResult ? monthResult.count : 0
    };
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedList,
        stats
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

// 获取转院申请统计
router.get('/transfer-stats', async (req, res) => {
  try {
    const stats = await db.query(
      'SELECT status, COUNT(*) as count FROM transfer_applications GROUP BY status'
    );
    
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝'
    };
    
    const data = stats.map(s => ({
      value: s.count * 10, // 转换为合适的数值
      name: statusMap[s.status] || s.status
    }));
    
    // 如果没有数据，返回默认数据
    if (data.length === 0) {
      res.json({
        code: 200,
        message: '获取成功',
        data: [
          { value: 65, name: '待审核' },
          { value: 25, name: '已通过' },
          { value: 10, name: '已拒绝' }
        ]
      });
    } else {
      res.json({
        code: 200,
        message: '获取成功',
        data
      });
    }
  } catch (error) {
    console.error('获取转院申请统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 批准转院申请
router.put('/transfers/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.run(
      'UPDATE transfer_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', id]
    );
    
    if (result.changes > 0) {
      res.json({
        code: 200,
        message: '操作成功',
        data: null
      });
    } else {
      res.status(404).json({
        code: 404,
        message: '记录不存在',
        data: null
      });
    }
  } catch (error) {
    console.error('批准转院申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 拒绝转院申请
router.put('/transfers/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.run(
      'UPDATE transfer_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['rejected', id]
    );
    
    if (result.changes > 0) {
      res.json({
        code: 200,
        message: '操作成功',
        data: null
      });
    } else {
      res.status(404).json({
        code: 404,
        message: '记录不存在',
        data: null
      });
    }
  } catch (error) {
    console.error('拒绝转院申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

module.exports = router;

