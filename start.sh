#!/bin/bash

echo "==================================="
echo "智慧医康保险服务平台启动脚本"
echo "==================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未检测到npm，请先安装npm"
    exit 1
fi

# 进入后端目录
cd backend

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
fi

# 启动后端服务
echo "正在启动后端服务..."
npm start &

# 等待后端启动
sleep 2

# 返回项目根目录
cd ..

echo ""
echo "==================================="
echo "启动完成！"
echo "==================================="
echo "后端服务: http://localhost:3000"
echo "前端页面: 请在浏览器中打开 index.html"
echo ""
echo "提示: 如果使用本地服务器，可以运行:"
echo "  python3 -m http.server 8080"
echo "  然后访问 http://localhost:8080"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
wait

