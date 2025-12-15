# 智慧医康保险服务平台

一个完整的前后端分离的智慧医康保险服务平台，实现了医康保险相关的核心业务功能，包括数据概览、DRG支付政策管理、康复服务衔接、风控与预测、AI智能助手等模块。

## ✨ 项目特点

- 🎯 **前后端分离架构**：前端使用Vue 3，后端使用Node.js + Express
- 📱 **单页面应用（SPA）**：无需刷新页面，流畅的用户体验
- 🔐 **用户认证系统**：JWT Token认证，支持管理员和普通用户两种角色
- 🤖 **AI智能助手**：集成大模型API，提供智能问答和分析功能
- 📊 **数据可视化**：使用ECharts展示丰富的图表
- 🎨 **现代化UI**：Element Plus + Tailwind CSS，美观易用
- 💾 **轻量级数据库**：SQLite数据库，无需单独服务

## 📁 项目结构

```
ai-yibao/
├── index.html              # 前端主页面（管理员）
├── login.html              # 登录页面
├── register.html           # 注册页面
├── user.html               # 用户页面（普通用户）
├── start.sh                # 启动脚本
├── README.md               # 项目说明
├── QUICKSTART.md           # 快速开始指南
├── PROJECT_SUMMARY.md      # 项目总结
├── 技术架构文档.md         # 技术架构文档
└── backend/                # 后端服务
    ├── server.js           # 服务器入口
    ├── db.js               # 数据库操作
    ├── package.json        # 依赖配置
    ├── database.sqlite     # SQLite数据库（自动生成）
    └── routes/             # 路由文件
        ├── auth.js         # 用户认证
        ├── dashboard.js    # 数据概览
        ├── drg.js         # DRG管理
        ├── rehabilitation.js # 康复服务
        ├── risk.js        # 风控管理
        ├── transfer.js    # 转院申请
        ├── user.js        # 用户管理
        └── ai-assistant.js # AI助手
```

## 🚀 功能特性

### 管理员功能
- 📊 **数据概览**：核心指标展示、费用趋势图表、风控预警分布
- 📋 **DRG支付政策管理**：DRG政策列表、搜索、筛选、新增/编辑/删除、统计图表
- 🏥 **康复服务衔接**：康复机构管理、转院申请审批、申请统计
- 🛡️ **风控与预测**：风险事件管理、风险分析、模型概览、图表展示
- 🤖 **AI智能助手**：医保欺诈检测、风险分析、智能问答

### 普通用户功能
- 🏥 **医院列表浏览**：查看医院信息、搜索、筛选、排序
- 📝 **转院申请**：提交转院申请、查看申请状态
- ⭐ **医院评价**：对医院进行评价和评分
- 🤖 **AI智能助手**：转院建议、医院推荐、流程咨询

### 通用功能
- 🔐 **用户注册/登录**：安全的用户认证系统
- 📱 **响应式设计**：适配不同屏幕尺寸
- 🎨 **现代化UI**：美观的界面设计
- 📈 **数据可视化**：丰富的图表展示

## 🛠️ 技术栈

### 前端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.3.4 | 渐进式JavaScript框架，使用Composition API |
| Element Plus | 2.3.9 | 基于Vue 3的企业级UI组件库 |
| ECharts | 5.4.3 | 强大的数据可视化库 |
| Tailwind CSS | - | 实用优先的CSS框架 |
| Font Awesome | 4.7.0 | 丰富的图标库 |

### 后端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | - | JavaScript运行时环境 |
| Express | 4.18.2 | 快速、极简的Web框架 |
| SQLite3 | 5.1.6 | 轻量级嵌入式数据库 |
| jsonwebtoken | 9.0.3 | JWT令牌生成和验证 |
| bcryptjs | 2.4.3 | 密码哈希加密 |
| axios | 1.13.2 | Promise based HTTP客户端 |

### 架构特点
- **前后端分离**：RESTful API通信
- **无状态认证**：JWT Token机制
- **模块化设计**：路由模块化，易于维护
- **自动初始化**：数据库自动创建表结构和初始数据

## 🚀 快速开始

### 方式一：使用启动脚本（推荐）

```bash
# 给脚本添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方式二：手动启动

#### 1. 安装后端依赖

```bash
cd backend
npm install
```

#### 2. 启动后端服务

```bash
npm start
# 或使用开发模式（自动重启）
npm run dev
```

后端服务将在 `http://localhost:3000` 启动

#### 3. 打开前端页面

**方式一：直接打开**
- 在浏览器中直接打开 `index.html`（管理员界面）或 `user.html`（普通用户界面）

**方式二：使用本地服务器（推荐）**
```bash
# 使用Python
python3 -m http.server 8080

# 或使用Node.js
npx http-server -p 8080
```

然后在浏览器访问 `http://localhost:8080`

### 4. 登录系统

系统已预置两个默认账户：

- **管理员账户**
  - 用户名：`admin`
  - 密码：`admin123`

- **普通用户账户**
  - 用户名：`user`
  - 密码：`user123`

> 💡 详细使用说明请参考 [QUICKSTART.md](./QUICKSTART.md)

## 📡 API接口说明

### 用户认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 数据概览
- `GET /api/dashboard/overview` - 获取数据概览
- `GET /api/dashboard/fee-trend?type=month` - 获取费用趋势（type: month/quarter/year）
- `GET /api/dashboard/risk-distribution` - 获取风控预警分布

### DRG管理
- `GET /api/drg?page=1&pageSize=10&search=&status=` - 获取DRG列表（分页、搜索、筛选）
- `GET /api/drg/:id` - 获取DRG详情
- `GET /api/drg/statistics` - 获取DRG统计
- `POST /api/drg` - 新增DRG政策
- `PUT /api/drg/:id` - 更新DRG政策
- `DELETE /api/drg/:id` - 删除DRG政策

### 康复服务
- `GET /api/rehabilitation/institutions?search=` - 获取康复机构列表
- `GET /api/rehabilitation/institutions/:id` - 获取康复机构详情
- `POST /api/rehabilitation/institutions` - 新增康复机构
- `PUT /api/rehabilitation/institutions/:id` - 更新康复机构
- `GET /api/rehabilitation/transfers?status=` - 获取转院申请列表
- `GET /api/rehabilitation/transfer-stats` - 获取转院申请统计
- `PUT /api/rehabilitation/transfers/:id/approve` - 批准转院申请
- `PUT /api/rehabilitation/transfers/:id/reject` - 拒绝转院申请

### 风控管理
- `GET /api/risk/events?search=&level=` - 获取风险事件列表
- `GET /api/risk/type-distribution` - 获取风险类型分布
- `GET /api/risk/level-distribution` - 获取风险等级分布

### 转院申请
- `GET /api/transfer/applications?status=` - 获取转院申请列表
- `GET /api/transfer/applications/:id` - 获取转院申请详情
- `POST /api/transfer/applications` - 提交转院申请
- `GET /api/transfer/applications/stats` - 获取转院申请统计

### AI助手
- `POST /api/ai-assistant/chat` - 与AI助手对话
- `POST /api/ai-assistant/analyze` - 分析风险数据
- `GET /api/ai-assistant/health` - 检查AI服务健康状态

### 健康检查
- `GET /health` - 服务健康检查

## 💾 数据库结构

系统使用SQLite数据库，包含以下8个核心数据表：

| 表名 | 说明 |
|------|------|
| `users` | 用户表（管理员和普通用户） |
| `drg_policies` | DRG支付政策表 |
| `rehabilitation_institutions` | 康复机构表 |
| `transfer_applications` | 转院申请表 |
| `risk_events` | 风险事件表 |
| `warnings` | 预警信息表 |
| `hospitals` | 医院信息表 |
| `hospital_reviews` | 医院评价表 |

> 💡 数据库文件会在首次启动时自动创建表结构并初始化示例数据

## ⚙️ 配置说明

### AI助手配置（可选）

AI助手已配置为使用**硅基流动（SiliconFlow）API**和**DeepSeek-V3.2模型**。配置方式：

#### 1. 获取硅基流动API密钥

1. 访问 [硅基流动官网](https://siliconflow.cn/zh-cn/)
2. 注册账号并登录控制台
3. 在"API管理"页面创建新的API密钥
4. 复制API密钥

#### 2. 配置API密钥

**方式一：环境变量配置（推荐）**

```bash
export AI_API_URL="https://api.siliconflow.cn/v1/chat/completions"
export AI_API_KEY="your-siliconflow-api-key"
export AI_MODEL="deepseek-chat-v3.2"
```

**方式二：修改配置文件**

编辑 `backend/routes/ai-assistant.js`，修改以下变量：
```javascript
const AI_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const AI_API_KEY = 'your-siliconflow-api-key';
const AI_MODEL = 'deepseek-chat-v3.2';
```

#### 3. 支持的模型

系统默认使用 `deepseek-chat-v3.2` 模型，您也可以通过环境变量或修改代码使用其他模型：

- `deepseek-chat-v3.2` - DeepSeek V3.2（默认）
- `deepseek-chat` - DeepSeek Chat
- 其他硅基流动支持的模型

> 💡 **重要提示**：
> - 如果不配置AI API密钥，系统会使用模拟响应模式，适合开发和测试
> - 硅基流动API使用标准的OpenAI兼容格式，支持流式和非流式调用
> - 请妥善保管API密钥，不要提交到代码仓库

### 修改API地址

如果后端服务运行在不同端口或域名，需要修改前端文件中的 `API_BASE_URL`：

- `index.html`（管理员界面）
- `user.html`（普通用户界面）
- `login.html`（登录页面）

```javascript
const API_BASE_URL = 'http://your-domain:3000/api';
```

### JWT密钥配置

生产环境建议修改JWT密钥，编辑 `backend/routes/auth.js`：

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

## 📝 开发说明

### 添加新功能

1. **后端开发**
   - 在 `backend/routes/` 中创建新的路由文件
   - 在 `backend/server.js` 中注册路由
   - 在 `backend/db.js` 中添加数据库表结构（如需要）

2. **前端开发**
   - 在对应的HTML文件中添加Vue组件
   - 添加API调用函数
   - 更新UI界面

### 数据库迁移

系统支持数据库字段迁移，在 `backend/db.js` 的 `migrateTables()` 函数中添加迁移逻辑。

## ⚠️ 注意事项

1. **首次运行**：会自动创建数据库并插入初始数据
2. **网络连接**：前端使用CDN加载依赖，需要网络连接
3. **服务启动顺序**：后端服务需要先启动，前端才能正常获取数据
4. **数据库文件**：`database.sqlite` 会在 `backend` 目录下自动生成
5. **端口占用**：确保3000端口未被占用
6. **文件权限**：确保 `backend` 目录有写入权限（用于创建数据库文件）

## 📚 相关文档

- [快速开始指南](./QUICKSTART.md) - 详细的安装和使用说明
- [技术架构文档](./技术架构文档.md) - 完整的技术架构说明
- [项目总结](./PROJECT_SUMMARY.md) - 项目功能总结

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

ISC

