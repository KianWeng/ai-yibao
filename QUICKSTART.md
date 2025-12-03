# 快速开始指南

## 一、环境要求

- Node.js (v14 或更高版本)
- npm (通常随Node.js一起安装)

## 二、安装步骤

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 启动后端服务

```bash
npm start
```

后端服务将在 `http://localhost:3000` 启动

### 3. 打开前端页面

有两种方式：

**方式一：直接打开**
- 在浏览器中直接打开 `index.html` 文件

**方式二：使用本地服务器（推荐）**
```bash
# 使用Python
python3 -m http.server 8080

# 或使用Node.js
npx http-server -p 8080
```

然后在浏览器访问 `http://localhost:8080`

## 三、使用启动脚本（Linux/Mac）

```bash
chmod +x start.sh
./start.sh
```

## 四、功能测试

1. **数据概览**
   - 查看核心指标卡片
   - 查看费用趋势图表
   - 查看风控预警列表

2. **DRG支付政策**
   - 搜索DRG政策
   - 查看DRG统计图表
   - 删除DRG政策（测试）

3. **康复服务衔接**
   - 查看康复机构列表
   - 查看转院申请
   - 批准/拒绝转院申请

4. **风控与预测**
   - 查看风险事件列表
   - 查看风险类型和等级分布
   - 查看风控模型概览

## 五、常见问题

### 1. 后端启动失败
- 检查端口3000是否被占用
- 检查Node.js版本是否符合要求
- 查看控制台错误信息

### 2. 前端无法获取数据
- 确认后端服务已启动
- 检查浏览器控制台是否有CORS错误
- 确认API地址配置正确

### 3. 数据库初始化失败
- 检查backend目录是否有写入权限
- 删除 `database.sqlite` 文件后重新启动

## 六、开发模式

使用nodemon实现自动重启：

```bash
cd backend
npm run dev
```

## 七、API测试

可以使用以下工具测试API：

```bash
# 健康检查
curl http://localhost:3000/health

# 获取数据概览
curl http://localhost:3000/api/dashboard/overview

# 获取DRG列表
curl http://localhost:3000/api/drg?page=1&pageSize=10
```

## 八、项目结构说明

```
ai-yibao/
├── index.html              # 前端单页面应用
├── backend/                # 后端服务
│   ├── server.js          # 服务器入口
│   ├── db.js              # 数据库操作
│   ├── routes/            # API路由
│   └── package.json       # 依赖配置
├── start.sh               # 启动脚本
├── README.md              # 项目文档
└── QUICKSTART.md          # 快速开始指南
```

## 九、下一步

- 根据实际需求修改数据库结构
- 添加用户认证功能
- 实现更多业务功能
- 优化前端界面和交互
- 添加单元测试

