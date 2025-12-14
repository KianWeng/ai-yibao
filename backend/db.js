const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');
let db = null;

// 初始化数据库
function init() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('数据库连接失败:', err);
        reject(err);
      } else {
        console.log('数据库连接成功');
        createTables().then(resolve).catch(reject);
      }
    });
  });
}

// 创建表
function createTables() {
  return new Promise((resolve, reject) => {
    const run = (sql) => {
      return new Promise((res, rej) => {
        db.run(sql, (err) => {
          if (err) rej(err);
          else res();
        });
      });
    };
    
    const tables = [
      // DRG支付政策表
      `CREATE TABLE IF NOT EXISTS drg_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        drg_code TEXT NOT NULL,
        drg_name TEXT NOT NULL,
        diagnosis TEXT,
        payment_standard REAL,
        effective_date TEXT,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 康复机构表
      `CREATE TABLE IF NOT EXISTS rehabilitation_institutions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        level TEXT,
        bed_count INTEGER,
        specialty TEXT,
        status TEXT DEFAULT '营业中',
        rating REAL DEFAULT 0,
        price_level TEXT DEFAULT '中等',
        address TEXT,
        phone TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 转院申请表
      `CREATE TABLE IF NOT EXISTS transfer_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        apply_no TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        patient_name TEXT NOT NULL,
        patient_id_card TEXT,
        patient_phone TEXT,
        from_hospital TEXT,
        to_hospital TEXT,
        to_hospital_id INTEGER,
        disease TEXT,
        disease_description TEXT,
        reason TEXT,
        expected_cost REAL,
        status TEXT DEFAULT 'pending',
        admin_comment TEXT,
        apply_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 风险事件表
      `CREATE TABLE IF NOT EXISTS risk_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE NOT NULL,
        patient_name TEXT,
        hospital TEXT,
        risk_type TEXT,
        risk_level TEXT,
        handle_status TEXT DEFAULT '待处理',
        event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 预警表
      `CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        warning_id TEXT UNIQUE NOT NULL,
        hospital TEXT,
        type TEXT,
        amount REAL,
        status TEXT DEFAULT '待处理',
        warning_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        real_name TEXT,
        phone TEXT,
        id_card TEXT,
        role TEXT DEFAULT 'user',
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 医院信息表
      `CREATE TABLE IF NOT EXISTS hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        level TEXT,
        address TEXT,
        phone TEXT,
        specialty TEXT,
        description TEXT,
        average_cost REAL,
        rating REAL DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        bed_count INTEGER,
        status TEXT DEFAULT '营业中',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 医院评价表
      `CREATE TABLE IF NOT EXISTS hospital_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL,
        user_id INTEGER,
        rating INTEGER DEFAULT 5,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    ];
    
    Promise.all(tables.map(sql => run(sql)))
      .then(() => {
        console.log('数据表创建成功');
        return migrateTables();
      })
      .then(() => {
        return initData();
      })
      .then(() => {
        console.log('初始数据插入成功');
        resolve();
      })
      .catch(reject);
  });
}

// 数据库迁移：添加缺失的字段
function migrateTables() {
  return new Promise((resolve, reject) => {
    const run = (sql) => {
      return new Promise((res, rej) => {
        db.run(sql, (err) => {
          // 忽略"字段已存在"或"重复列"的错误
          if (err) {
            const errMsg = err.message.toLowerCase();
            if (errMsg.includes('duplicate column') || 
                errMsg.includes('already exists') ||
                errMsg.includes('重复列')) {
              // 字段已存在，忽略错误
              res();
            } else {
              rej(err);
            }
          } else {
            res();
          }
        });
      });
    };
    
    const all = (sql) => {
      return new Promise((res, rej) => {
        db.all(sql, [], (err, rows) => {
          if (err) rej(err);
          else res(rows);
        });
      });
    };
    
    // 检查并添加缺失的字段
    Promise.all([
      // 检查 transfer_applications 表的字段
      all("PRAGMA table_info(transfer_applications)").catch((e) => {
        console.warn('无法检查 transfer_applications 表结构:', e.message);
        return [];
      }),
      // 检查 users 表的字段
      all("PRAGMA table_info(users)").catch((e) => {
        console.warn('无法检查 users 表结构:', e.message);
        return [];
      }),
      // 检查 rehabilitation_institutions 表的字段
      all("PRAGMA table_info(rehabilitation_institutions)").catch((e) => {
        console.warn('无法检查 rehabilitation_institutions 表结构:', e.message);
        return [];
      })
    ])
      .then(([transferColumns, userColumns, rehabColumns]) => {
        const promises = [];
        
        // 检查 transfer_applications 表是否缺少字段
        const transferColumnNames = transferColumns.map(col => col.name);
        if (!transferColumnNames.includes('to_hospital_id')) {
          promises.push(run('ALTER TABLE transfer_applications ADD COLUMN to_hospital_id INTEGER'));
        }
        if (!transferColumnNames.includes('user_id')) {
          promises.push(run('ALTER TABLE transfer_applications ADD COLUMN user_id INTEGER'));
        }
        if (!transferColumnNames.includes('patient_id_card')) {
          promises.push(run('ALTER TABLE transfer_applications ADD COLUMN patient_id_card TEXT'));
        }
        if (!transferColumnNames.includes('patient_phone')) {
          promises.push(run('ALTER TABLE transfer_applications ADD COLUMN patient_phone TEXT'));
        }
        if (!transferColumnNames.includes('disease_description')) {
          promises.push(run('ALTER TABLE transfer_applications ADD COLUMN disease_description TEXT'));
        }
        if (!transferColumnNames.includes('reason')) {
          promises.push(run('ALTER TABLE transfer_applications ADD COLUMN reason TEXT'));
        }
        if (!transferColumnNames.includes('expected_cost')) {
          promises.push(run('ALTER TABLE transfer_applications ADD COLUMN expected_cost REAL'));
        }
        if (!transferColumnNames.includes('admin_comment')) {
          promises.push(run('ALTER TABLE transfer_applications ADD COLUMN admin_comment TEXT'));
        }
        
        // 检查 users 表是否缺少字段
        const userColumnNames = userColumns.map(col => col.name);
        if (!userColumnNames.includes('phone')) {
          promises.push(run('ALTER TABLE users ADD COLUMN phone TEXT'));
        }
        if (!userColumnNames.includes('id_card')) {
          promises.push(run('ALTER TABLE users ADD COLUMN id_card TEXT'));
        }
        
        // 检查 rehabilitation_institutions 表是否缺少字段
        const rehabColumnNames = rehabColumns.map(col => col.name);
        if (!rehabColumnNames.includes('rating')) {
          promises.push(run('ALTER TABLE rehabilitation_institutions ADD COLUMN rating REAL DEFAULT 0'));
        }
        if (!rehabColumnNames.includes('price_level')) {
          promises.push(run('ALTER TABLE rehabilitation_institutions ADD COLUMN price_level TEXT DEFAULT \'中等\''));
        }
        if (!rehabColumnNames.includes('address')) {
          promises.push(run('ALTER TABLE rehabilitation_institutions ADD COLUMN address TEXT'));
        }
        if (!rehabColumnNames.includes('phone')) {
          promises.push(run('ALTER TABLE rehabilitation_institutions ADD COLUMN phone TEXT'));
        }
        if (!rehabColumnNames.includes('description')) {
          promises.push(run('ALTER TABLE rehabilitation_institutions ADD COLUMN description TEXT'));
        }
        if (!rehabColumnNames.includes('updated_at')) {
          promises.push(run('ALTER TABLE rehabilitation_institutions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'));
        }
        
        if (promises.length > 0) {
          return Promise.all(promises)
            .then(() => {
              console.log(`数据库迁移完成，添加了 ${promises.length} 个字段`);
              resolve();
            })
            .catch((error) => {
              console.error('数据库迁移执行失败:', error);
              // 迁移失败不影响启动，继续执行
              resolve();
            });
        } else {
          console.log('数据库迁移：无需添加字段');
          resolve();
        }
      })
      .catch((error) => {
        console.error('数据库迁移检查失败:', error);
        // 迁移失败不影响启动，继续执行
        resolve();
      });
  });
}

// 初始化数据
function initData() {
  return new Promise((resolve, reject) => {
    const run = (sql) => {
      return new Promise((res, rej) => {
        db.run(sql, (err) => {
          if (err) rej(err);
          else res();
        });
      });
    };
    
    const all = (sql) => {
      return new Promise((res, rej) => {
        db.all(sql, [], (err, rows) => {
          if (err) rej(err);
          else res(rows);
        });
      });
    };
    
    // 检查所有表是否已有数据
    Promise.all([
      all('SELECT COUNT(*) as count FROM drg_policies'),
      all('SELECT COUNT(*) as count FROM rehabilitation_institutions'),
      all('SELECT COUNT(*) as count FROM transfer_applications'),
      all('SELECT COUNT(*) as count FROM risk_events'),
      all('SELECT COUNT(*) as count FROM warnings'),
      all('SELECT COUNT(*) as count FROM users'),
      all('SELECT COUNT(*) as count FROM hospitals')
    ])
      .then(([drgRows, rehabRows, transferRows, riskRows, warningRows, userRows, hospitalRows]) => {
        const hasDrg = drgRows[0].count > 0;
        const hasRehab = rehabRows[0].count > 0;
        const hasTransfer = transferRows[0].count > 0;
        const hasRisk = riskRows[0].count > 0;
        const hasWarning = warningRows[0].count > 0;
        const hasUsers = userRows[0].count > 0;
        const hasHospitals = hospitalRows[0].count > 0;
        
        // 如果所有表都有数据，直接返回
        if (hasDrg && hasRehab && hasTransfer && hasRisk && hasWarning && hasUsers && hasHospitals) {
          resolve();
          return;
        }
        
        // 插入初始数据（只在表为空时插入）
        const promises = [];
        
        if (!hasDrg) {
          promises.push(
            run(`INSERT INTO drg_policies (drg_code, drg_name, diagnosis, payment_standard, effective_date, status) VALUES
              ('MDC01', '颅脑损伤', '颅骨骨折、脑震荡', 32500, '2025-01-01', 1),
              ('MDC02', '神经系统疾病', '脑出血、脑梗死', 28800, '2025-01-01', 1),
              ('MDC03', '循环系统疾病', '心肌梗死、冠心病', 25600, '2025-01-01', 1),
              ('MDC04', '呼吸系统疾病', '肺炎、慢性阻塞性肺疾病', 18300, '2025-01-01', 1),
              ('MDC05', '消化系统疾病', '胃溃疡、阑尾炎', 15700, '2025-01-01', 1)`)
          );
        }
        
        if (!hasRehab) {
          promises.push(
            run(`INSERT INTO rehabilitation_institutions (name, level, bed_count, specialty, status, rating, price_level, address, phone, description) VALUES
              ('北京康复医院', '三级', 500, '神经康复、骨科康复', '营业中', 4.8, '较高', '北京市朝阳区康复路1号', '010-12345678', '专业从事神经康复和骨科康复，设备先进，医生经验丰富'),
              ('上海康复医学中心', '三级', 450, '心肺康复、老年康复', '营业中', 4.6, '中等', '上海市黄浦区康复路2号', '021-12345678', '专注于心肺康复和老年康复，服务周到'),
              ('广州康复护理院', '二级', 300, '骨科康复、康复护理', '营业中', 4.5, '较低', '广州市天河区康复路3号', '020-12345678', '骨科康复专业，价格实惠'),
              ('深圳康复治疗中心', '二级', 280, '神经康复、儿童康复', '营业中', 4.7, '中等', '深圳市南山区康复路4号', '0755-12345678', '儿童康复特色，环境优美'),
              ('成都康复医院', '三级', 400, '综合康复', '营业中', 4.4, '较低', '成都市锦江区康复路5号', '028-12345678', '综合康复服务，性价比高'),
              ('杭州康复中心', '二级', 350, '运动康复、理疗', '营业中', 4.3, '较低', '杭州市西湖区康复路6号', '0571-12345678', '运动康复专业，设施完善')`)
          );
        }
        
        if (!hasTransfer) {
          promises.push(
            run(`INSERT INTO transfer_applications (apply_no, patient_name, from_hospital, to_hospital, disease, status) VALUES
              ('TA20250101', '张三', '北京协和医院', '北京康复医院', '脑出血', 'pending'),
              ('TA20250102', '李四', '上海瑞金医院', '上海康复医学中心', '心肌梗死', 'pending'),
              ('TA20250103', '王五', '广州中山医院', '广州康复护理院', '脑梗死', 'pending')`)
          );
        }
        
        if (!hasRisk) {
          promises.push(
            run(`INSERT INTO risk_events (event_id, patient_name, hospital, risk_type, risk_level, handle_status) VALUES
              ('RE20250101', '赵六', '北京协和医院', '虚假住院', '高', '已处理'),
              ('RE20250102', '钱七', '上海瑞金医院', '过度医疗', '中', '待处理'),
              ('RE20250103', '孙八', '广州中山医院', '重复收费', '低', '待处理'),
              ('RE20250104', '周九', '深圳人民医院', '虚假报销', '高', '已处理')`)
          );
        }
        
        if (!hasWarning) {
          promises.push(
            run(`INSERT INTO warnings (warning_id, hospital, type, amount, status) VALUES
              ('WR20250101', '北京协和医院', '欺诈风险', 12500, '待处理'),
              ('WR20250102', '上海瑞金医院', '异常费用', 8300, '已处理'),
              ('WR20250103', '广州中山医院', '虚假住院', 25600, '待处理'),
              ('WR20250104', '深圳人民医院', '异常费用', 5800, '待处理'),
              ('WR20250105', '成都华西医院', '欺诈风险', 18200, '已处理')`)
          );
        }
        
        // 初始化医院数据
        if (!hasHospitals) {
          promises.push(
            run(`INSERT INTO hospitals (name, level, address, phone, specialty, description, average_cost, rating, rating_count, bed_count, status) VALUES
              ('北京协和医院', '三级', '北京市东城区东单北大街53号', '010-69156114', '神经科、心内科、骨科', '全国知名三甲医院，医疗水平先进', 50000, 4.8, 125, 2000, '营业中'),
              ('上海瑞金医院', '三级', '上海市黄浦区瑞金二路197号', '021-64370045', '心内科、神经科', '华东地区知名医院，心血管疾病诊疗领先', 45000, 4.7, 98, 1800, '营业中'),
              ('广州中山医院', '三级', '广州市越秀区中山二路107号', '020-87332200', '神经科、康复科', '华南地区知名医院，神经科实力强', 42000, 4.6, 87, 1500, '营业中'),
              ('深圳人民医院', '三级', '深圳市罗湖区东门北路1017号', '0755-25533018', '骨科、康复科', '深圳地区知名医院，骨科专业', 38000, 4.5, 76, 1200, '营业中'),
              ('成都华西医院', '三级', '成都市武侯区国学巷37号', '028-85422286', '综合医疗', '西南地区知名医院，综合实力强', 40000, 4.7, 112, 1600, '营业中'),
              ('杭州第一人民医院', '二级', '杭州市上城区浣纱路261号', '0571-87065701', '康复科、理疗科', '康复治疗专业，价格实惠', 25000, 4.3, 45, 600, '营业中'),
              ('南京鼓楼医院', '三级', '南京市鼓楼区中山路321号', '025-83106666', '神经科、心内科', '江苏省知名医院，医疗水平高', 43000, 4.6, 93, 1400, '营业中'),
              ('武汉同济医院', '三级', '武汉市硚口区解放大道1095号', '027-83662688', '综合医疗、康复科', '华中地区知名医院，康复科专业', 41000, 4.5, 81, 1300, '营业中')`)
          );
        }
        
        // 注意：默认用户会在auth路由初始化时创建（因为密码需要bcrypt加密）
        
        if (promises.length > 0) {
          Promise.all(promises)
            .then(() => resolve())
            .catch(reject);
        } else {
          resolve();
        }
      })
      .catch(reject);
  });
}

// 查询方法
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// 执行方法
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// 获取单条记录
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = {
  init,
  query,
  run,
  get
};

