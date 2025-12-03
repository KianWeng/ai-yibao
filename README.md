# 智慧医康保险服务平台

一个完整的智慧医康保险服务平台，包含前端界面和后端API服务。

## 项目结构

```
ai-yibao/
├── index.html          # 前端主页面
├── backend/            # 后端服务
│   ├── server.js      # 服务器入口
│   ├── db.js          # 数据库操作
│   ├── routes/        # 路由文件
│   │   ├── dashboard.js
│   │   ├── drg.js
│   │   ├── rehabilitation.js
│   │   └── risk.js
│   ├── package.json   # 依赖配置
│   └── database.sqlite # SQLite数据库（自动生成）
└── README.md          # 项目说明
```

## 功能特性

### 前端功能
- 📊 **数据概览**：展示核心指标、费用趋势、风控预警等
- 📋 **DRG支付政策管理**：DRG政策列表、搜索、统计
- 🏥 **康复服务衔接**：康复机构管理、转院申请处理
- 🛡️ **风控与预测**：风险事件管理、风险分析、模型概览
- 📈 **数据可视化**：使用ECharts展示各类图表

### 后端功能
- RESTful API接口
- SQLite数据库存储
- 数据CRUD操作
- 统计分析接口

## 技术栈

### 前端
- Vue 3 (Composition API)
- Element Plus UI组件库
- ECharts 数据可视化
- Tailwind CSS 样式框架

### 后端
- Node.js
- Express.js
- SQLite3 数据库

## 快速开始

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 启动后端服务

```bash
npm start
# 或使用开发模式（自动重启）
npm run dev
```

后端服务将在 `http://localhost:3000` 启动

### 3. 打开前端页面

直接在浏览器中打开 `index.html` 文件，或使用本地服务器：

```bash
# 使用Python启动简单HTTP服务器
python3 -m http.server 8080

# 或使用Node.js的http-server
npx http-server -p 8080
```

然后在浏览器访问 `http://localhost:8080`

## API接口说明

### 数据概览
- `GET /api/dashboard/overview` - 获取数据概览
- `GET /api/dashboard/fee-trend?type=month` - 获取费用趋势
- `GET /api/dashboard/risk-distribution` - 获取风控预警分布

### DRG管理
- `GET /api/drg?page=1&pageSize=10&search=&status=` - 获取DRG列表
- `GET /api/drg/statistics` - 获取DRG统计
- `DELETE /api/drg/:id` - 删除DRG政策

### 康复服务
- `GET /api/rehabilitation/institutions?search=` - 获取康复机构列表
- `GET /api/rehabilitation/transfers?status=` - 获取转院申请列表
- `GET /api/rehabilitation/transfer-stats` - 获取转院申请统计
- `PUT /api/rehabilitation/transfers/:id/approve` - 批准转院申请
- `PUT /api/rehabilitation/transfers/:id/reject` - 拒绝转院申请

### 风控管理
- `GET /api/risk/events?search=&level=` - 获取风险事件列表
- `GET /api/risk/type-distribution` - 获取风险类型分布
- `GET /api/risk/level-distribution` - 获取风险等级分布

## 数据库结构

系统使用SQLite数据库，包含以下表：

- `drg_policies` - DRG支付政策
- `rehabilitation_institutions` - 康复机构
- `transfer_applications` - 转院申请
- `risk_events` - 风险事件
- `warnings` - 预警信息

数据库文件会在首次启动时自动创建并初始化数据。

## 开发说明

### 修改API地址

如果后端服务运行在不同端口，需要修改 `index.html` 中的 `API_BASE_URL`：

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### 添加新功能

1. 在 `backend/routes/` 中创建新的路由文件
2. 在 `backend/server.js` 中注册路由
3. 在前端 `index.html` 中添加对应的API调用

## 注意事项

1. 首次运行会自动创建数据库并插入初始数据
2. 前端使用CDN加载依赖，需要网络连接
3. 后端服务需要先启动，前端才能正常获取数据
4. 数据库文件 `database.sqlite` 会在 `backend` 目录下自动生成

## 许可证

ISC

