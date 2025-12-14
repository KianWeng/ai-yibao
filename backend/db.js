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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 转院申请表
      `CREATE TABLE IF NOT EXISTS transfer_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        apply_no TEXT UNIQUE NOT NULL,
        patient_name TEXT NOT NULL,
        from_hospital TEXT,
        to_hospital TEXT,
        disease TEXT,
        status TEXT DEFAULT 'pending',
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
        role TEXT DEFAULT 'admin',
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    Promise.all(tables.map(sql => run(sql)))
      .then(() => {
        console.log('数据表创建成功');
        return initData();
      })
      .then(() => {
        console.log('初始数据插入成功');
        resolve();
      })
      .catch(reject);
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
      all('SELECT COUNT(*) as count FROM users')
    ])
      .then(([drgRows, rehabRows, transferRows, riskRows, warningRows, userRows]) => {
        const hasDrg = drgRows[0].count > 0;
        const hasRehab = rehabRows[0].count > 0;
        const hasTransfer = transferRows[0].count > 0;
        const hasRisk = riskRows[0].count > 0;
        const hasWarning = warningRows[0].count > 0;
        const hasUsers = userRows[0].count > 0;
        
        // 如果所有表都有数据，直接返回
        if (hasDrg && hasRehab && hasTransfer && hasRisk && hasWarning && hasUsers) {
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
            run(`INSERT INTO rehabilitation_institutions (name, level, bed_count, specialty, status) VALUES
              ('北京康复医院', '三级', 500, '神经康复、骨科康复', '营业中'),
              ('上海康复医学中心', '三级', 450, '心肺康复、老年康复', '营业中'),
              ('广州康复护理院', '二级', 300, '骨科康复、康复护理', '营业中'),
              ('深圳康复治疗中心', '二级', 280, '神经康复、儿童康复', '停业整顿')`)
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

