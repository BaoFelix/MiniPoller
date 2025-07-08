# 🚀 MiniPoller GitHub 安装指南

## 📋 前置要求

在开始之前，请确保您的系统满足以下要求：

### 必需软件
- **Windows 10/11** (64位)
- **Node.js 14.0.0 或更高版本** 
  - 下载地址：https://nodejs.org/
  - 推荐安装 LTS 版本 (18.x 或 20.x)
- **Git** (可选，用于克隆仓库)
  - 下载地址：https://git-scm.com/

### 系统要求
- 内存：至少 4GB RAM
- 磁盘空间：至少 500MB 可用空间
- 网络：稳定的互联网连接

## 🎯 安装步骤

### 方法1：使用 Git 克隆（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/MiniPoller.git

# 2. 进入项目目录
cd MiniPoller

# 3. 进入后端目录
cd backend

# 4. 安装依赖
npm install

# 5. 启动应用
npm start
```

### 方法2：下载 ZIP 文件

1. **下载项目**
   - 访问 GitHub 仓库页面
   - 点击绿色的 "Code" 按钮
   - 选择 "Download ZIP"
   - 解压到本地目录

2. **安装依赖**
   ```bash
   # 打开命令提示符或 PowerShell
   cd path\to\MiniPoller\backend
   npm install
   ```

3. **启动应用**
   ```bash
   npm start
   ```

## 🔧 常见问题解决

### Node.js 相关问题

**Q: 如何检查 Node.js 是否正确安装？**
```bash
node --version
npm --version
```

**Q: npm install 速度很慢？**
```bash
# 使用淘宝镜像源
npm config set registry https://registry.npmmirror.com/
npm install
```

### 依赖安装问题

**Q: npm install 失败，提示权限错误？**
```bash
# Windows: 以管理员身份运行命令提示符
# 或者清理 npm 缓存
npm cache clean --force
npm install
```

**Q: 某些原生模块编译失败？**
```bash
# 安装 Python 和 Visual Studio Build Tools
# 或者跳过可选依赖
npm install --ignore-optional
```

### 启动问题

**Q: 端口 3000 被占用？**
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 杀死进程（替换 PID 为实际进程ID）
taskkill /PID <PID> /F
```

**Q: Electron 无法启动？**
```bash
# 重新安装 Electron
npm uninstall electron
npm install electron
```

## 📱 验证安装

安装完成后，您应该看到：

1. **命令行输出**：
   ```
   Server is running at http://192.168.x.x:3000/
   Electron app ready
   Mouse and keyboard hooks started successfully
   ```

2. **应用界面**：
   - Electron 桌面应用打开
   - 可以通过浏览器访问 http://localhost:3000
   - 全局文本捕获功能正常

## 🎉 使用说明

### 桌面端功能
- **Ctrl+C 捕获**：复制文本时自动弹出投票创建选项
- **鼠标拖拽选择**：选择文本时自动检测
- **无菜单栏设计**：极简界面

### Web 端功能
- 访问 http://localhost:3000
- 创建和参与投票
- 实时查看投票结果
- 导出投票图表

## 🔍 故障排除命令

```bash
# 完全重新安装
cd backend
rm -rf node_modules package-lock.json  # Linux/Mac
# 或 Windows:
rmdir /s node_modules
del package-lock.json
npm install

# 检查依赖状态
npm list

# 检查过时的包
npm outdated

# 更新所有依赖
npm update
```

---

🎊 **安装完成！享受使用 MiniPoller 进行快速投票！**
