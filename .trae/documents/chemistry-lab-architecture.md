## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        "React路由" --> "页面组件"
        "页面组件" --> "Canvas渲染引擎"
        "页面组件" --> "UI组件库"
        "Canvas渲染引擎" --> "器材渲染器"
        "Canvas渲染引擎" --> "试剂渲染器"
        "Canvas渲染引擎" --> "反应动画器"
        "Canvas渲染引擎" --> "粒子系统"
    end
    
    subgraph "数据层"
        "Zustand状态管理" --> "游戏状态Store"
        "Zustand状态管理" --> "关卡数据Store"
        "Zustand状态管理" --> "设置Store"
        "Zustand状态管理" --> "调试Store"
    end
    
    subgraph "模块层"
        "实验步骤模块" --> "步骤验证器"
        "器材模块" --> "器材定义"
        "试剂模块" --> "试剂定义"
        "反应引擎" --> "反应规则"
        "错误提示模块" --> "错误条件匹配"
        "知识卡片模块" --> "卡片数据"
    end
    
    subgraph "配置层"
        "关卡配置JSON" --> "关卡解析器"
        "关卡编辑器" --> "关卡配置JSON"
    end
```

## 2. 技术说明
- **前端框架**：React@18 + TypeScript + Vite
- **样式方案**：Tailwind CSS@3
- **状态管理**：Zustand
- **路由**：react-router-dom
- **游戏渲染**：HTML5 Canvas 2D API
- **图标**：lucide-react
- **初始化工具**：vite-init (react-ts 模板)
- **后端**：无（纯前端项目，关卡数据以JSON配置文件形式内嵌）
- **数据库**：无（使用 localStorage 持久化进度）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| `/` | 开始菜单页面 |
| `/tutorial` | 教程页面 |
| `/levels` | 关卡选择页面 |
| `/game/:levelId` | 游戏主场景页面 |
| `/result/:levelId` | 结算页面 |
| `/failed/:levelId` | 失败页面 |
| `/editor` | 关卡编辑器页面 |
| `/debug` | 调试日志页面 |

## 4. 数据模型

### 4.1 核心数据模型定义

```mermaid
erDiagram
    Level ||--o{ Step : contains
    Level ||--o{ Equipment : requires
    Level ||--o{ Reagent : uses
    Level ||--o{ ErrorCondition : defines
    Level ||--o{ KnowledgeCard : teaches
    Step ||--o{ StepAction : has
    Step }o--|| Equipment : targets
    Step }o--|| Reagent : uses
    Reaction }o--|| Reagent : "reagent_a"
    Reaction }o--|| Reagent : "reagent_b"
    Reaction }o--o{ ReactionResult : produces
