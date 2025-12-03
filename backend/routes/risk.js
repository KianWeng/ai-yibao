const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取风险事件列表
router.get('/events', async (req, res) => {
  try {
    const { search = '', level = '' } = req.query;
    
    let sql = 'SELECT * FROM risk_events WHERE 1=1';
    const params = [];
    
    if (search) {
      sql += ' AND (patient_name LIKE ? OR hospital LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }
    
    if (level) {
      sql += ' AND risk_level = ?';
      params.push(level === 'high' ? '高' : level === 'medium' ? '中' : '低');
    }
    
    sql += ' ORDER BY event_time DESC';
    
    const list = await db.query(sql, params);
    
    // 格式化数据
    const formattedList = list.map(item => ({
      id: item.id,
      eventId: item.event_id,
      patientName: item.patient_name,
      hospital: item.hospital,
      riskType: item.risk_type,
      riskLevel: item.risk_level,
      eventTime: item.event_time,
      handleStatus: item.handle_status
    }));
    
    // 获取风控概览
    const overview = {
      recall: 92,
      falsePositive: 12,
      success: 88
    };
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedList,
        overview
      }
    });
  } catch (error) {
    console.error('获取风险事件列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 获取风险类型分布
router.get('/type-distribution', async (req, res) => {
  try {
    const stats = await db.query(
      'SELECT risk_type, COUNT(*) as count FROM risk_events GROUP BY risk_type'
    );
    
    const data = stats.map(s => ({
      value: s.count * 10, // 转换为合适的数值
      name: s.risk_type
    }));
    
    // 如果没有数据，返回默认数据
    if (data.length === 0) {
      res.json({
        code: 200,
        message: '获取成功',
        data: [
          { value: 40, name: '虚假住院' },
          { value: 30, name: '过度医疗' },
          { value: 20, name: '重复收费' },
          { value: 10, name: '其他' }
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
    console.error('获取风险类型分布失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 获取风险等级分布
router.get('/level-distribution', async (req, res) => {
  try {
    const stats = await db.query(
      'SELECT risk_level, COUNT(*) as count FROM risk_events GROUP BY risk_level ORDER BY CASE risk_level WHEN "高" THEN 1 WHEN "中" THEN 2 ELSE 3 END'
    );
    
    const levels = stats.map(s => s.risk_level);
    const counts = stats.map(s => s.count * 10); // 转换为合适的数值
    
    // 如果没有数据，返回默认数据
    if (levels.length === 0) {
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          levels: ['高风险', '中风险', '低风险'],
          counts: [120, 350, 580]
        }
      });
    } else {
      res.json({
        code: 200,
        message: '获取成功',
        data: { levels, counts }
      });
    }
  } catch (error) {
    console.error('获取风险等级分布失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

module.exports = router;

