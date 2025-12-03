const express = require('express');
const router = express.Router();
const db = require('../db');

// 数据概览
router.get('/overview', async (req, res) => {
  try {
    // 获取预警列表
    const warnings = await db.query(
      'SELECT * FROM warnings ORDER BY warning_time DESC LIMIT 10'
    );
    
    // 格式化预警数据
    const formattedWarnings = warnings.map(w => ({
      id: w.warning_id,
      hospital: w.hospital,
      type: w.type,
      amount: `¥${w.amount.toLocaleString()}`,
      time: w.warning_time,
      status: w.status
    }));
    
    // 指标数据（可以从数据库计算，这里使用模拟数据）
    const metrics = {
      paymentEfficiency: { value: 30, change: 5 },
      rehabilitationEfficiency: { value: 25, change: 0 },
      payoutRate: { value: 11, change: -8 },
      settlementTime: { value: 0.7, change: 0 }
    };
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        metrics,
        warnings: formattedWarnings
      }
    });
  } catch (error) {
    console.error('获取数据概览失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 费用趋势
router.get('/fee-trend', async (req, res) => {
  try {
    const { type = 'month' } = req.query;
    
    // 根据类型生成数据
    let months, total, medical, personal;
    
    if (type === 'month') {
      months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月'];
      total = [1200, 1350, 1500, 1420, 1600, 1750, 1820, 1900, 2050];
      medical = [850, 950, 1050, 980, 1120, 1230, 1280, 1350, 1450];
      personal = [350, 400, 450, 440, 480, 520, 540, 550, 600];
    } else if (type === 'quarter') {
      months = ['Q1', 'Q2', 'Q3', 'Q4'];
      total = [4050, 4770, 5570, 6000];
      medical = [2850, 3330, 3860, 4150];
      personal = [1200, 1440, 1710, 1850];
    } else {
      months = ['2021', '2022', '2023', '2024', '2025'];
      total = [15000, 18000, 21000, 24000, 27000];
      medical = [10500, 12600, 14700, 16800, 18900];
      personal = [4500, 5400, 6300, 7200, 8100];
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: { months, total, medical, personal }
    });
  } catch (error) {
    console.error('获取费用趋势失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 风控预警分布
router.get('/risk-distribution', async (req, res) => {
  try {
    const warnings = await db.query(
      'SELECT type, COUNT(*) as count FROM warnings GROUP BY type'
    );
    
    const distribution = warnings.map(w => ({
      value: w.count * 10, // 转换为合适的数值
      name: w.type
    }));
    
    // 如果没有数据，返回默认数据
    if (distribution.length === 0) {
      res.json({
        code: 200,
        message: '获取成功',
        data: [
          { value: 35, name: '虚假住院' },
          { value: 45, name: '异常费用' },
          { value: 15, name: '过度医疗' },
          { value: 5, name: '其他欺诈' }
        ]
      });
    } else {
      res.json({
        code: 200,
        message: '获取成功',
        data: distribution
      });
    }
  } catch (error) {
    console.error('获取风控预警分布失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

module.exports = router;

