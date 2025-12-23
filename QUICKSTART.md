# 快速开始指南

本指南将帮助您快速启动和运行智慧医康保险服务平台。

## 一、环境要求

- **Node.js**：v14 或更高版本（推荐 v16+）
- **npm**：通常随Node.js一起安装
- **浏览器**：Chrome、Firefox、Edge等现代浏览器
- **网络连接**：前端依赖通过CDN加载，需要网络连接

## 二、安装步骤

### 方式一：使用启动脚本（推荐，Linux/Mac）

```bash
# 给脚本添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

启动脚本会自动：
- 检查Node.js和npm环境
- 安装后端依赖（如果未安装）
- 启动后端服务

### 方式二：手动安装

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
- 在浏览器中直接打开 `index.html`（管理员界面）
- 或打开 `user.html`（普通用户界面）

**方式二：使用本地服务器（推荐）**
```bash
# 使用Python
python3 -m http.server 8080

# 或使用Node.js
npx http-server -p 8080
```

然后在浏览器访问 `http://localhost:8080`

## 三、首次登录

### 默认账户

系统已预置两个默认账户，首次启动后可直接使用：

#### 管理员账户
- **用户名**：`admin`
- **密码**：`admin123`
- **功能**：可访问所有管理功能

#### 普通用户账户
- **用户名**：`user`
- **密码**：`user123`
- **功能**：可访问转院申请相关功能

### 登录步骤

1. 打开 `login.html` 或访问登录页面
2. 输入用户名和密码
3. 点击"登录"按钮
4. 系统会根据用户角色自动跳转到对应界面

### 注册新用户

1. 打开 `register.html` 或访问注册页面
2. 填写用户信息（用户名、密码、真实姓名等）
3. 点击"注册"按钮
4. 注册成功后自动跳转到登录页面

## 四、功能测试

### 管理员功能测试

#### 1. 数据概览
- ✅ 查看核心指标卡片（支付效率、康复衔接效率、赔付率、结算时间）
- ✅ 查看费用趋势图表（支持月度/季度/年度切换）
- ✅ 查看风控预警分布饼图
- ✅ 查看最近风控预警列表
- ✅ 刷新预警数据

#### 2. DRG支付政策管理
- ✅ 搜索DRG政策（按编码、名称、诊断）
- ✅ 筛选DRG政策（按状态）
- ✅ 查看DRG分组统计柱状图
- ✅ 新增DRG政策
- ✅ 编辑DRG政策
- ✅ 删除DRG政策（带确认提示）
- ✅ 分页浏览

#### 3. 康复服务衔接管理
- ✅ 查看康复机构列表
- ✅ 查看康复机构详情
- ✅ 新增/编辑康复机构
- ✅ 查看转院申请列表
- ✅ 查看转院申请统计（今日/本周/本月）
- ✅ 查看转院申请状态分布饼图
- ✅ 批准/拒绝转院申请
- ✅ 查看转院申请详情

#### 4. 风控与预测管理
- ✅ 查看风控模型概览（召回率、误报率、拦截成功率）
- ✅ 查看风险类型分布饼图
- ✅ 查看风险等级分布柱状图
- ✅ 查看风险事件列表
- ✅ 搜索和筛选风险事件

#### 5. AI智能助手
- ✅ 点击右下角AI助手按钮
- ✅ 询问医保欺诈检测相关问题
- ✅ 获取风险分析报告
- ✅ 查看处理建议

### 普通用户功能测试

#### 1. 医院列表浏览
- ✅ 查看所有医院列表
- ✅ 搜索医院（按名称、专科）
- ✅ 筛选医院（按专科、等级）
- ✅ 排序医院（按评分、价格、名称）
- ✅ 查看医院详情

#### 2. 转院申请
- ✅ 在医院详情页点击"申请转院"
- ✅ 填写转院申请表单
- ✅ 提交转院申请
- ✅ 在"我的申请"中查看申请状态
- ✅ 查看申请详情和审批结果

#### 3. 医院评价
- ✅ 在医院详情页添加评价
- ✅ 进行1-5星评分
- ✅ 填写评价内容

#### 4. AI智能助手
- ✅ 询问转院相关问题
- ✅ 获取医院推荐建议
- ✅ 咨询转院流程

## 五、AI助手配置（可选）

AI助手已配置为使用**硅基流动（SiliconFlow）API**和**DeepSeek-V3.2模型**。如果不配置，系统会使用模拟响应模式。

### 配置步骤

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

然后重启后端服务。

**方式二：修改配置文件**

编辑 `backend/routes/ai-assistant.js`：

```javascript
const AI_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const AI_API_KEY = 'your-siliconflow-api-key';
const AI_MODEL = 'deepseek-chat-v3.2';
```

#### 3. 支持的模型

系统默认使用 `deepseek-chat-v3.2` 模型，您也可以通过环境变量或修改代码使用其他模型：

- `deepseek-chat-v3.2` - DeepSeek V3.2（推荐）
- `deepseek-chat` - DeepSeek Chat
- `deepseek-ai/DeepSeek-V3.2-Exp` - DeepSeek V3.2 实验版
- 其他硅基流动支持的模型

### 测试AI服务

```bash
# 检查AI服务健康状态
curl http://localhost:3000/api/ai-assistant/health
```

### AI助手功能说明

- **管理员模式**：医保欺诈检测、风险分析、数据评估
- **普通用户模式**：转院建议、医院推荐、流程咨询

### 超时和重试机制

系统已实现以下优化：

- **超时时间**：60秒（从30秒增加到60秒）
- **自动重试**：最多重试2次，自动处理网络错误和超时
- **降级处理**：API调用失败时自动切换到模拟响应模式
- **错误提示**：详细的错误日志，便于排查问题

> 💡 **重要提示**：
> - 如果不配置AI API密钥，系统会使用模拟响应模式，适合开发和测试
> - 硅基流动API使用标准的OpenAI兼容格式，支持流式和非流式调用
> - 请妥善保管API密钥，不要提交到代码仓库
> - 如果遇到超时问题，系统会自动重试，失败后会使用模拟响应

## 六、常见问题

### 1. 后端启动失败

**问题**：`Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**：
- 检查端口3000是否被占用：`lsof -i :3000` 或 `netstat -ano | findstr :3000`
- 关闭占用端口的进程，或修改 `backend/server.js` 中的端口号

**问题**：`Error: Cannot find module 'xxx'`

**解决方案**：
- 确保已安装依赖：`cd backend && npm install`
- 检查Node.js版本是否符合要求（v14+）

### 2. 前端无法获取数据

**问题**：浏览器控制台显示CORS错误

**解决方案**：
- 确认后端服务已启动
- 检查 `backend/server.js` 中的CORS配置
- 确认前端API地址配置正确

**问题**：`401 Unauthorized` 错误

**解决方案**：
- 确认已登录系统
- 检查localStorage中是否有token
- 重新登录获取新token

### 3. 数据库初始化失败

**问题**：`Error: EACCES: permission denied`

**解决方案**：
- 检查 `backend` 目录是否有写入权限
- Linux/Mac：`chmod 755 backend`
- 删除 `database.sqlite` 文件后重新启动

**问题**：数据库表结构错误

**解决方案**：
- 删除 `backend/database.sqlite` 文件
- 重新启动后端服务，系统会自动创建表结构

### 4. 登录失败

**问题**：用户名或密码错误

**解决方案**：
- 确认使用正确的默认账户：
  - 管理员：`admin` / `admin123`
  - 普通用户：`user` / `user123`
- 检查数据库是否已初始化
- 查看后端控制台是否有错误信息

### 5. AI助手无响应或超时

**问题**：AI助手返回错误或超时（`timeout of 30000ms exceeded`）

**解决方案**：
- **已优化**：系统已将超时时间增加到60秒，并添加了自动重试机制
- 检查AI API配置是否正确
- 确认API密钥有效
- 检查网络连接（硅基流动API需要稳定的网络）
- 检查模型名称是否正确（推荐使用 `deepseek-chat-v3.2`）
- 如果API持续失败，系统会自动切换到模拟响应模式
- 查看后端控制台日志，了解详细错误信息

**常见超时原因**：
- 网络连接不稳定
- API服务器响应慢
- 模型名称不正确（如 `deepseek-ai/DeepSeek-V3.2-Exp` 可能不可用）
- 请求内容过长

**建议**：
- 使用推荐的模型名称：`deepseek-chat-v3.2`
- 确保网络连接稳定
- 如果持续超时，可以暂时使用模拟响应模式进行开发测试

### 6. 前端页面空白

**问题**：页面加载后显示空白

**解决方案**：
- 检查浏览器控制台是否有JavaScript错误
- 确认CDN资源可以正常加载（需要网络连接）
- 尝试清除浏览器缓存
- 检查浏览器是否支持ES6+语法

## 七、开发模式

### 后端开发模式

使用nodemon实现自动重启：

```bash
cd backend
npm run dev
```

当修改后端代码时，服务会自动重启。

### 前端开发

前端使用CDN加载依赖，修改代码后刷新浏览器即可看到效果。

### 调试技巧

1. **后端调试**
   - 查看控制台输出
   - 使用 `console.log()` 输出调试信息
   - 检查数据库文件内容

2. **前端调试**
   - 使用浏览器开发者工具（F12）
   - 查看Console标签页的错误信息
   - 查看Network标签页的API请求
   - 使用Vue DevTools（如果安装了）

## 八、API测试

### 使用curl测试

```bash
# 健康检查
curl http://localhost:3000/health

# 用户登录（获取token）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取数据概览（需要token）
curl http://localhost:3000/api/dashboard/overview \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取DRG列表
curl http://localhost:3000/api/drg?page=1&pageSize=10

# 获取AI助手健康状态
curl http://localhost:3000/api/ai-assistant/health
```

### 使用Postman测试

1. 导入API集合（如果有）
2. 设置环境变量（base_url, token等）
3. 测试各个API接口

## 九、项目结构说明

```
ai-yibao/
├── index.html              # 前端主页面（管理员）
├── login.html              # 登录页面
├── register.html           # 注册页面
├── user.html               # 用户页面（普通用户）
├── start.sh                # 启动脚本
├── README.md               # 项目说明
├── QUICKSTART.md           # 快速开始指南（本文档）
├── PROJECT_SUMMARY.md      # 项目总结
├── 技术架构文档.md         # 技术架构文档
└── backend/                # 后端服务
    ├── server.js           # 服务器入口
    ├── db.js               # 数据库操作
    ├── package.json        # 依赖配置
    ├── database.sqlite     # 数据库文件（自动生成）
    └── routes/             # API路由
        ├── auth.js         # 用户认证
        ├── dashboard.js    # 数据概览
        ├── drg.js         # DRG管理
        ├── rehabilitation.js # 康复服务
        ├── risk.js        # 风控管理
        ├── transfer.js    # 转院申请
        ├── user.js        # 用户管理
        └── ai-assistant.js # AI助手
```

## 十、下一步

### 功能扩展
- [ ] 添加数据导出功能（Excel/PDF）
- [ ] 实现消息通知系统
- [ ] 添加操作日志记录
- [ ] 实现数据备份和恢复
- [ ] 添加更多统计报表

### 技术优化
- [ ] 数据库索引优化
- [ ] API响应缓存
- [ ] 前端代码分割和懒加载
- [ ] 添加单元测试和集成测试
- [ ] 性能监控和日志系统

### 部署准备
- [ ] 配置生产环境
- [ ] 数据库迁移到PostgreSQL/MySQL（如需要）
- [ ] 配置反向代理（Nginx）
- [ ] 设置进程管理（PM2）
- [ ] 配置SSL证书

## 十一、获取帮助

如果遇到问题，可以：

1. 查看本文档的"常见问题"部分
2. 查看 [README.md](./README.md) 获取更多信息
3. 查看 [技术架构文档](./技术架构文档.md) 了解技术细节
4. 检查浏览器控制台和后端控制台的错误信息
5. 提交Issue到项目仓库

---

**祝您使用愉快！** 🎉

