const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取DRG列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = 'SELECT * FROM drg_policies WHERE 1=1';
    const params = [];
    
    if (search) {
      sql += ' AND (drg_code LIKE ? OR drg_name LIKE ? OR diagnosis LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    if (status !== '') {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.get(countSql, params);
    const total = countResult.total;
    
    // 获取列表
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    
    const list = await db.query(sql, params);
    
    // 格式化数据
    const formattedList = list.map(item => ({
      id: item.id,
      drgCode: item.drg_code,
      drgName: item.drg_name,
      diagnosis: item.diagnosis,
      paymentStandard: `¥${item.payment_standard.toLocaleString()}`,
      effectiveDate: item.effective_date,
      status: item.status.toString()
    }));
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedList,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取DRG列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 获取DRG统计
router.get('/statistics', async (req, res) => {
  try {
    const stats = await db.query(
      'SELECT drg_code, COUNT(*) as count FROM drg_policies GROUP BY drg_code ORDER BY drg_code'
    );
    
    const codes = stats.map(s => s.drg_code);
    const counts = stats.map(s => s.count * 200); // 转换为合适的数值
    
    // 如果没有数据，返回默认数据
    if (codes.length === 0) {
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          codes: ['MDC01', 'MDC02', 'MDC03', 'MDC04', 'MDC05', 'MDC06', 'MDC07', 'MDC08'],
          counts: [1200, 1500, 1800, 2100, 1600, 1300, 900, 700]
        }
      });
    } else {
      res.json({
        code: 200,
        message: '获取成功',
        data: { codes, counts }
      });
    }
  } catch (error) {
    console.error('获取DRG统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 新增DRG政策
router.post('/', async (req, res) => {
  try {
    const { drgCode, drgName, diagnosis, paymentStandard, effectiveDate, status } = req.body;
    
    // 验证必填字段
    if (!drgCode || !drgName) {
      return res.status(400).json({
        code: 400,
        message: 'DRG编码和名称不能为空',
        data: null
      });
    }
    
    // 检查DRG编码是否已存在
    const existing = await db.get('SELECT id FROM drg_policies WHERE drg_code = ?', [drgCode]);
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: 'DRG编码已存在',
        data: null
      });
    }
    
    const result = await db.run(
      'INSERT INTO drg_policies (drg_code, drg_name, diagnosis, payment_standard, effective_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        drgCode,
        drgName,
        diagnosis || '',
        paymentStandard || 0,
        effectiveDate || new Date().toISOString().split('T')[0],
        status !== undefined ? status : 1
      ]
    );
    
    res.json({
      code: 200,
      message: '新增成功',
      data: {
        id: result.lastID
      }
    });
  } catch (error) {
    console.error('新增DRG政策失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 获取单个DRG政策详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.get('SELECT * FROM drg_policies WHERE id = ?', [id]);
    
    if (!item) {
      return res.status(404).json({
        code: 404,
        message: '记录不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: item.id,
        drgCode: item.drg_code,
        drgName: item.drg_name,
        diagnosis: item.diagnosis,
        paymentStandard: item.payment_standard,
        effectiveDate: item.effective_date,
        status: item.status.toString()
      }
    });
  } catch (error) {
    console.error('获取DRG政策详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 更新DRG政策
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { drgCode, drgName, diagnosis, paymentStandard, effectiveDate, status } = req.body;
    
    // 验证必填字段
    if (!drgCode || !drgName) {
      return res.status(400).json({
        code: 400,
        message: 'DRG编码和名称不能为空',
        data: null
      });
    }
    
    // 检查记录是否存在并获取当前数据
    const existing = await db.get('SELECT * FROM drg_policies WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        code: 404,
        message: '记录不存在',
        data: null
      });
    }
    
    // 只有当DRG编码发生变化时，才检查是否被其他记录使用
    if (existing.drg_code !== drgCode) {
      const codeConflict = await db.get('SELECT id FROM drg_policies WHERE drg_code = ? AND id != ?', [drgCode, parseInt(id)]);
      if (codeConflict) {
        return res.status(400).json({
          code: 400,
          message: 'DRG编码已被其他记录使用',
          data: null
        });
      }
    }
    
    const result = await db.run(
      'UPDATE drg_policies SET drg_code = ?, drg_name = ?, diagnosis = ?, payment_standard = ?, effective_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        drgCode,
        drgName,
        diagnosis || '',
        paymentStandard || 0,
        effectiveDate || new Date().toISOString().split('T')[0],
        status !== undefined ? status : 1,
        id
      ]
    );
    
    if (result.changes > 0) {
      res.json({
        code: 200,
        message: '更新成功',
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
    console.error('更新DRG政策失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 删除DRG政策
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.run('DELETE FROM drg_policies WHERE id = ?', [id]);
    
    if (result.changes > 0) {
      res.json({
        code: 200,
        message: '删除成功',
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
    console.error('删除DRG政策失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

module.exports = router;

