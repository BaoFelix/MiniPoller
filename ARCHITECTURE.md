# MiniPoller 系统架构文档

## 📌 项目概述

MiniPoller 是一个具有全局文本捕获、实时投票和图表可视化功能的快速投票应用程序。该系统采用了前后端分离的架构，结合 Electron 桌面应用框架，提供跨平台的用户体验。

---

## 🏛️ 整体系统架构

```mermaid
graph TB
    subgraph "Desktop Layer"
        EL[Electron Main Process<br/>electronMain.js]
        CW[Capture Worker<br/>captureWorker.js]
        OW[Overlay Window<br/>BrowserWindow]
    end
    
    subgraph "Backend Layer"
        SRV[Express Server<br/>server.js]
        API[API Controller<br/>apiController.js]
        RT[Routes<br/>apiRoutes.js]
        WS[WebSocket Server<br/>webSocketServer.js]
    end
    
    subgraph "Data Layer"
        SM[Session Manager<br/>sessionManager.js]
        PM[Poll Model<br/>poll.js]
    end
    
    subgraph "Frontend Layer"
        APP[Client App<br/>app.js]
        UI[UI Components<br/>uiComponents.js]
        PCF[Poll Creation Form<br/>pollCreationForm.js]
        VI[Voting Interface<br/>votingInterface.js]
        APIS[API Service<br/>apiService.js]
        SKM[Socket Manager<br/>socketManager.js]
    end
    
    EL -->|Worker Thread| CW
    EL -->|IPC| OW
    EL -->|Spawns| SRV
    
    SRV --> RT
    RT --> API
    API --> SM
    API --> WS
    SM --> PM
    WS --> SM
    
    APP --> UI
    UI --> PCF
    UI --> VI
    PCF --> APIS
    VI --> APIS
    VI --> SKM
    
    APIS -->|HTTP/REST| API
    SKM -->|WebSocket| WS
```

---

## 🔧 后端架构详解

### 后端模块结构

```mermaid
graph LR
    subgraph "Backend Structure"
        direction TB
        B1[server.js<br/>入口点]
        B2[controllers/]
        B3[models/]
        B4[routes/]
        B5[services/]
        B6[utils/]
        B7[workers/]
    end
    
    B1 --> B2
    B1 --> B3
    B1 --> B4
    B1 --> B5
    B1 --> B6
    B7 -.->|独立进程| B1
```

### 类图 - 后端核心类

```mermaid
classDiagram
    class Poll {
        +string pollId
        +boolean isActive
        +string taskDescription
        +Array~string~ options
        +string displayStyle
        +Map~string, number~ voteCounts
        +Map~string, string~ votes
        +constructor(pollData)
        +addVote(option, userId)
        +getResults()
        +endPoll()
        +getDetails()
    }
    
    class SessionManager {
        +Map~string, Poll~ polls
        +Map~string, string~ ownerTokens
        +createPoll(pollData) Poll
        +getPoll(pollId) Poll
        +pollExists(pollId) boolean
        +endPoll(pollId)
        +setOwnerToken(pollId, ownerToken)
        +verifyOwnerToken(pollId, ownerToken) boolean
    }
    
    class APIController {
        -SessionManager sessionManager
        -WebSocketServer webSocketServer
        +createPoll(req, res)
        +getPoll(req, res)
        +endPoll(req, res)
    }
    
    class WebSocketServer {
        -SocketIO io
        -SessionManager sessionManager
        +initialize(server)
        +onConnection(socket)
        +onVote(socket, data)
        +notifyPollEnd(pollId)
    }
    
    SessionManager --> Poll : manages
    APIController --> SessionManager : uses
    APIController --> WebSocketServer : uses
    WebSocketServer --> SessionManager : uses
```

---

## 🖥️ Electron 桌面架构

### Electron 进程模型

```mermaid
graph TB
    subgraph "Main Process"
        MP[electronMain.js]
        IPC[IPC Main]
    end
    
    subgraph "Worker Thread"
        CW[captureWorker.js]
        UIO[uIOhook-napi<br/>键盘/鼠标钩子]
        CB[PowerShell<br/>剪贴板读取]
    end
    
    subgraph "Renderer Process - Overlay"
        OW[Overlay BrowserWindow]
        OB[Create Poll Button]
    end
    
    subgraph "Renderer Process - Poll"
        PW[Poll BrowserWindow]
        WEB[Web Application]
    end
    
    subgraph "Child Process"
        NS[Node.js Server<br/>server.js]
    end
    
    MP -->|spawn| NS
    MP -->|Worker| CW
    CW --> UIO
    CW --> CB
    CW -->|postMessage| MP
    MP -->|createOverlay| OW
    OW -->|IPC: create-poll| MP
    MP -->|openPollWindow| PW
    PW --> WEB
    WEB -->|HTTP/WS| NS
```

### Electron 事件流程

```mermaid
sequenceDiagram
    participant User
    participant CW as Capture Worker
    participant MP as Main Process
    participant OW as Overlay Window
    participant PW as Poll Window
    participant SRV as Server
    
    User->>CW: Ctrl+C / 鼠标拖拽选择
    CW->>CW: 检测文本选择
    CW->>MP: postMessage(text-selected)
    MP->>OW: createOverlayWindow(text, position)
    OW-->>User: 显示 "Create Poll" 按钮
    
    User->>OW: 点击按钮
    OW->>MP: IPC(create-poll, text)
    MP->>PW: openPollWindow(text)
    MP->>OW: 关闭 Overlay
    PW->>SRV: 加载投票页面
```

---

## 🌐 前端架构详解

### 前端模块结构

```mermaid
graph TB
    subgraph "Frontend Structure"
        HTML[index.html<br/>入口页面]
        LIBS[libs/<br/>第三方库]
        CSS[css/<br/>样式文件]
        JS[js/<br/>JavaScript模块]
    end
    
    subgraph "JavaScript Modules"
        APP[app.js<br/>主应用]
        API[apiService.js<br/>API服务]
        SKT[socketManager.js<br/>WebSocket管理]
        UI[uiComponents.js<br/>UI组件]
        PCF[pollCreationForm.js<br/>投票创建表单]
        VI[votingInterface.js<br/>投票界面]
        HLP[helpers.js<br/>工具函数]
    end
    
    HTML --> LIBS
    HTML --> CSS
    HTML --> JS
    JS --> APP
    JS --> API
    JS --> SKT
    JS --> UI
    JS --> PCF
    JS --> VI
    JS --> HLP
```

### 类图 - 前端核心类

```mermaid
classDiagram
    class ClientApp {
        -ApiService apiService
        -SocketManager socketManager
        -UIComponents uiComponents
        -string pollId
        -string ownerToken
        -string userId
        +initialize()
        +extractPollIdFromUrl()
    }
    
    class ApiService {
        -string baseUrl
        +createPoll(pollData) Promise
        +getPoll(pollId) Promise
        +endPoll(pollId, ownerToken) Promise
    }
    
    class SocketManager {
        -Socket socket
        +connect(pollId)
        +emit(event, data)
        +on(event, callback)
    }
    
    class UIComponents {
        -ApiService apiService
        -SocketManager socketManager
        -PollCreationForm pollCreationForm
        -VotingInterface votingInterface
        -Element appElement
        +showPollCreationForm()
        +showVotingInterface()
        +handlePollEnded()
        +clearAppElement()
    }
    
    class PollCreationForm {
        -ApiService apiService
        -Element formElement
        -Element optionsContainer
        +render(container)
        +addOptionInput()
        +updateOptionPlaceholders()
        +handleSubmit(event)
    }
    
    class VotingInterface {
        -ApiService apiService
        -SocketManager socketManager
        -Object pollData
        -Element container
        -Array voteButtons
        -string userId
        -Chart resultsChart
        -boolean isOwner
        +render(container)
        +renderPoll(pollId, ownerToken)
        +displayPoll()
        +initializeChart()
        +updateChartData(results)
        +castVote(option)
        +handleEndPoll()
    }
    
    ClientApp --> ApiService
    ClientApp --> SocketManager
    ClientApp --> UIComponents
    UIComponents --> PollCreationForm
    UIComponents --> VotingInterface
    PollCreationForm --> ApiService
    VotingInterface --> ApiService
    VotingInterface --> SocketManager
```

---

## 🔄 数据流与交互

### 投票创建流程

```mermaid
sequenceDiagram
    participant User
    participant PCF as PollCreationForm
    participant API as ApiService
    participant SRV as Server/APIController
    participant SM as SessionManager
    participant Poll as Poll Model
    
    User->>PCF: 填写问题和选项
    User->>PCF: 点击创建
    PCF->>API: createPoll(pollData)
    API->>SRV: POST /api/polls
    SRV->>SM: createPoll(pollData)
    SM->>Poll: new Poll(pollData)
    Poll-->>SM: poll instance
    SM-->>SRV: poll
    SRV->>SM: setOwnerToken(pollId, token)
    SRV-->>API: {pollId, pollUrl, pollData}
    API-->>PCF: response
    PCF->>User: 重定向到投票页面
```

### 实时投票流程

```mermaid
sequenceDiagram
    participant User1 as 用户1 (投票者)
    participant User2 as 用户2 (观察者)
    participant VI as VotingInterface
    participant SKT as SocketManager
    participant WS as WebSocketServer
    participant SM as SessionManager
    participant Poll as Poll Model
    
    User1->>VI: 选择选项并投票
    VI->>SKT: emit('vote', {pollId, option, userId})
    SKT->>WS: vote event
    WS->>SM: getPoll(pollId)
    SM-->>WS: poll
    WS->>Poll: addVote(option, userId)
    Poll-->>WS: success
    WS->>Poll: getResults()
    Poll-->>WS: results
    WS->>SKT: broadcast('voteUpdate', results)
    SKT-->>VI: voteUpdate event
    VI->>VI: updateChartData(results)
    VI-->>User1: 更新图表显示
    
    Note over User2,VI: 同时更新其他连接的用户
    WS->>User2: voteUpdate event
    User2-->>User2: 图表实时更新
```

### WebSocket 连接管理

```mermaid
stateDiagram-v2
    [*] --> Connecting: connect(pollId)
    Connecting --> Connected: connection success
    Connecting --> Error: connection failed
    
    Connected --> Voting: user casts vote
    Voting --> Connected: vote processed
    
    Connected --> Disconnected: disconnect
    Connected --> PollEnded: pollEnded event
    
    Error --> [*]: handle error
    Disconnected --> [*]
    PollEnded --> [*]: show final results
```

---

## 🏗️ 设计模式分析

### 1. MVC 模式 (Model-View-Controller)

```mermaid
graph TB
    subgraph "Model"
        M1[Poll]
        M2[SessionManager]
    end
    
    subgraph "View"
        V1[Frontend HTML/CSS]
        V2[VotingInterface]
        V3[PollCreationForm]
    end
    
    subgraph "Controller"
        C1[APIController]
        C2[ClientApp]
    end
    
    V1 -->|用户输入| C2
    C2 -->|API调用| C1
    C1 -->|数据操作| M1
    C1 -->|数据操作| M2
    M1 -->|数据变更| C1
    C1 -->|响应| C2
    C2 -->|更新| V1
```

### 2. Observer/Pub-Sub 模式 (WebSocket 实时更新)

```mermaid
graph TB
    subgraph "Publisher"
        WS[WebSocketServer]
    end
    
    subgraph "Subscribers"
        C1[Client 1<br/>SocketManager]
        C2[Client 2<br/>SocketManager]
        C3[Client N<br/>SocketManager]
    end
    
    WS -->|voteUpdate| C1
    WS -->|voteUpdate| C2
    WS -->|voteUpdate| C3
    
    C1 -->|vote| WS
    C2 -->|vote| WS
    C3 -->|vote| WS
```

### 3. Facade 模式 (API Service)

```mermaid
graph TB
    subgraph "Client"
        APP[ClientApp]
    end
    
    subgraph "Facade"
        API[ApiService]
    end
    
    subgraph "Subsystem"
        HTTP[HTTP Client]
        JSON[JSON处理]
        ERR[错误处理]
    end
    
    APP -->|简化接口| API
    API --> HTTP
    API --> JSON
    API --> ERR
```

### 4. Factory 模式 (Poll 创建)

```mermaid
graph TB
    subgraph "Factory"
        SM[SessionManager]
    end
    
    subgraph "Product"
        P1[Poll Instance 1]
        P2[Poll Instance 2]
        P3[Poll Instance N]
    end
    
    SM -->|createPoll| P1
    SM -->|createPoll| P2
    SM -->|createPoll| P3
```

### 5. Singleton 模式 (Session Manager)

```mermaid
graph TB
    subgraph "Singleton Instance"
        SM[SessionManager<br/>单例实例]
    end
    
    subgraph "Clients"
        API[APIController]
        WS[WebSocketServer]
    end
    
    API -->|使用同一实例| SM
    WS -->|使用同一实例| SM
```

---

## 📁 目录结构

```
MiniPoller/
├── backend/
│   ├── controllers/
│   │   └── apiController.js      # API 控制器
│   ├── models/
│   │   ├── poll.js               # 投票模型
│   │   └── sessionManager.js     # 会话管理器
│   ├── routes/
│   │   └── apiRoutes.js          # API 路由
│   ├── services/
│   │   └── webSocketServer.js    # WebSocket 服务
│   ├── utils/
│   │   └── utilities.js          # 工具函数
│   ├── workers/
│   │   ├── captureWorker.js      # 文本捕获 Worker
│   │   ├── overlayManager.js     # Overlay 管理器
│   │   └── overlayWindow.js      # Overlay 窗口
│   ├── tests/
│   │   └── poll.test.js          # 单元测试
│   ├── electronMain.js           # Electron 主进程
│   ├── server.js                 # Express 服务器
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css             # 样式文件
│   ├── js/
│   │   ├── app.js                # 主应用
│   │   ├── apiService.js         # API 服务
│   │   ├── socketManager.js      # WebSocket 管理
│   │   ├── uiComponents.js       # UI 组件
│   │   ├── pollCreationForm.js   # 投票创建表单
│   │   ├── votingInterface.js    # 投票界面
│   │   └── helpers.js            # 工具函数
│   ├── libs/
│   │   ├── chart.js              # Chart.js 库
│   │   └── socket.io.min.js      # Socket.IO 客户端
│   └── index.html                # 入口页面
├── README.md
├── IMPROVEMENTS_SUMMARY.md
└── ARCHITECTURE.md               # 本文档
```

---

## 🔌 技术栈总结

### 后端技术

| 技术 | 用途 | 版本 |
|------|------|------|
| **Node.js** | 运行时环境 | ≥14.0.0 |
| **Express** | Web 框架 | ^4.21.1 |
| **Socket.IO** | 实时通信 | ^4.8.0 |
| **Electron** | 桌面应用框架 | ^22.3.27 |
| **uiohook-napi** | 全局键盘/鼠标钩子 | ^1.5.4 |
| **UUID** | 唯一标识符生成 | ^10.0.0 |
| **dotenv** | 环境变量管理 | ^16.4.5 |
| **Helmet** | HTTP 安全头 | ^8.0.0 |
| **CORS** | 跨域资源共享 | ^2.8.5 |

### 前端技术

| 技术 | 用途 |
|------|------|
| **HTML5** | 页面结构 |
| **CSS3** | 样式和动画 |
| **JavaScript (ES6+)** | 前端逻辑 |
| **Chart.js** | 数据可视化 |
| **Socket.IO Client** | WebSocket 通信 |

### 开发工具

| 工具 | 用途 |
|------|------|
| **Jest** | 单元测试 |
| **npm** | 包管理器 |

---

## 🎯 系统设计特点

### 优势

1. **实时性**: 使用 WebSocket 实现投票结果的实时更新
2. **跨平台**: Electron 支持 Windows/macOS/Linux
3. **全局捕获**: 支持系统级文本选择捕获（Windows）
4. **模块化**: 清晰的代码分层和模块划分
5. **易扩展**: 基于事件驱动的架构便于扩展功能

### 潜在改进点

1. **持久化存储**: 当前使用内存存储，可考虑添加数据库
2. **身份认证**: 可添加用户认证系统
3. **投票类型**: 可扩展支持多选、排序等投票类型
4. **分布式**: 可考虑支持多节点部署
5. **监控**: 可添加日志和监控系统

---

## 📊 API 接口文档

### REST API

| 方法 | 端点 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/api/polls` | 创建投票 | `{taskDescription, options, displayStyle}` | `{pollId, pollUrl, pollData}` |
| GET | `/api/polls/:pollId` | 获取投票详情 | - | `{pollId, taskDescription, options, displayStyle, isActive}` |
| POST | `/api/polls/:pollId/end` | 结束投票 | `{ownerToken}` | `{message}` |

### WebSocket Events

| 事件 | 方向 | 数据 | 描述 |
|------|------|------|------|
| `connection` | Client → Server | `query: {pollId}` | 连接到投票房间 |
| `vote` | Client → Server | `{pollId, option, userId}` | 提交投票 |
| `voteUpdate` | Server → Client | `{pollId, voteCounts, votes, isActive}` | 投票结果更新 |
| `pollEnded` | Server → Client | - | 投票结束通知 |
| `error` | Server → Client | `{message, code, pollId}` | 错误信息 |

---

*文档版本: 1.0*
*最后更新: 2025-11-28*
