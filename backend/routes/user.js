const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/user/hospitals
 * 获取医院列表（带评价和价格信息）
 */
router.get('/hospitals', async (req, res) => {
  try {
    const { search = '', specialty = '', priceLevel = '', minRating = 0 } = req.query;
    
    let sql = 'SELECT * FROM rehabilitation_institutions WHERE status = ?';
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
    
    if (priceLevel) {
      sql += ' AND price_level = ?';
      params.push(priceLevel);
    }
    
    if (minRating) {
      sql += ' AND rating >= ?';
      params.push(parseFloat(minRating));
    }
    
    sql += ' ORDER BY rating DESC, name ASC';
    
    const hospitals = await db.query(sql, params);
    
    const formattedList = hospitals.map(item => ({
      id: item.id,
      name: item.name,
      level: item.level,
      bedCount: item.bed_count,
      specialty: item.specialty,
      status: item.status,
      rating: item.rating || 0,
      priceLevel: item.price_level || '中等',
      address: item.address,
      phone: item.phone,
      description: item.description
    }));
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedList
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
 * GET /api/user/hospitals/:id
 * 获取医院详情
 */
router.get('/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hospital = await db.get(
      'SELECT * FROM rehabilitation_institutions WHERE id = ? AND status = ?',
      [id, '营业中']
    );
    
    if (!hospital) {
      return res.status(404).json({
        code: 404,
        message: '医院不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: hospital.id,
        name: hospital.name,
        level: hospital.level,
        bedCount: hospital.bed_count,
        specialty: hospital.specialty,
        status: hospital.status,
        rating: hospital.rating || 0,
        priceLevel: hospital.price_level || '中等',
        address: hospital.address,
        phone: hospital.phone,
        description: hospital.description
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
 * POST /api/user/transfer-apply
 * 用户提交转院申请
 */
router.post('/transfer-apply', async (req, res) => {
  try {
    const {
      userId,
      patientName,
      patientIdCard,
      patientPhone,
      fromHospital,
      toHospitalId,
      toHospital,
      disease,
      diseaseDescription,
      reason,
      expectedCost
    } = req.body;
    
    // 验证必填字段
    if (!patientName || !fromHospital || !toHospital || !disease) {
      return res.status(400).json({
        code: 400,
        message: '请填写完整的申请信息',
        data: null
      });
    }
    
    // 生成申请单号
    const applyNo = `TA${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // 插入申请记录
    const result = await db.run(
      `INSERT INTO transfer_applications (
        apply_no, user_id, patient_name, patient_id_card, patient_phone,
        from_hospital, to_hospital, to_hospital_id, disease, disease_description,
        reason, expected_cost, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applyNo,
        userId || null,
        patientName,
        patientIdCard || null,
        patientPhone || null,
        fromHospital,
        toHospital,
        toHospitalId || null,
        disease,
        diseaseDescription || null,
        reason || null,
        expectedCost || null,
        'pending'
      ]
    );
    
    res.json({
      code: 200,
      message: '申请提交成功',
      data: {
        id: result.lastID,
        applyNo: applyNo
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
 * GET /api/user/my-applications
 * 获取当前用户的申请列表
 */
router.get('/my-applications', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: '用户ID不能为空',
        data: null
      });
    }
    
    const applications = await db.query(
      'SELECT * FROM transfer_applications WHERE user_id = ? ORDER BY apply_time DESC',
      [userId]
    );
    
    const formattedList = applications.map(item => ({
      id: item.id,
      applyNo: item.apply_no,
      patientName: item.patient_name,
      fromHospital: item.from_hospital,
      toHospital: item.to_hospital,
      disease: item.disease,
      status: item.status,
      applyTime: item.apply_time,
      adminComment: item.admin_comment
    }));
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedList
      }
    });
  } catch (error) {
    console.error('获取申请列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

module.exports = router;

