## 1. 架构设计

本项目采用纯前端架构，TypeScript + Canvas渲染，无后端依赖。esbuild打包为IIFE格式。

```mermaid
flowchart TD
    "index.html" --> "main.ts"
    "main.ts" --> "engine.ts"
    "main.ts" --> "input.ts"
    "main.ts" --> "camera.ts"
    "main.ts" --> "circuit.ts"
    "main.ts" --> "simulator.ts"
    "main.ts" --> "tutorial.ts"
    "main.ts" --> "levels.ts"
    "main.ts" --> "analytics.ts"
    "main.ts" --> "ui.ts"
    "main.ts" --> "save.ts"
    "circuit.ts" --> "components.ts"
    "circuit.ts" --> "wire.ts"
    "components.ts" --> "config.ts"
    "wire.ts" --> "config.ts"
    "engine.ts" --> "perf.ts"
    "input.ts" --> "config.ts"
    "camera.ts" --> "config.ts"
    "simulator.ts" --> "circuit.ts"
    "simulator.ts" --> "config.ts"
    "tutorial.ts" --> "config.ts"
    "levels.ts" --> "config.ts"
    "analytics.ts" --> "config.ts"
```

## 2. 技术说明

- 前端：TypeScript + Canvas 2D API（无框架）
- 打包工具：esbuild（已配置）
- 开发服务器：http-server
- 无后端、无数据库，所有数据存储在 localStorage
- 无外部UI框架，所有界面由Canvas渲染 + HTML覆盖层实现

## 3. 模块定义

| 模块文件 | 职责 |
|----------|------|
| main.ts | 入口，初始化所有模块，主循环，交互状态机 |
| engine.ts | 游戏循环，固定时间步，帧率统计（已有） |
| input.ts | 鼠标/触摸/键盘输入管理，动作绑定（已有） |
| camera.ts | 视图变换，缩放/平移，网格绘制（已有） |
| circuit.ts | 电路图数据结构，节点构建，命中测试（已有） |
| components.ts | 元件模型与渲染（已有） |
| wire.ts | 导线模型与渲染（已有） |
| config.ts | 所有配置常量、关卡配置、设置（已有） |
| perf.ts | 性能统计（已有） |
| simulator.ts | 教学近似仿真：电压/电流计算，电容充放电 |
| tutorial.ts | 教程系统：步骤管理，高亮，条件检测 |
| levels.ts | 关卡管理：加载/切换/目标检测/结算 |
| analytics.ts | 行为追踪：失败步骤、重试次数、教程跳过 |
| save.ts | 存档序列化/反序列化，localStorage，分享URL |
| ui.ts | UI覆盖层管理：属性面板，设置页，提示气泡 |

## 4. 核心数据流

```mermaid
flowchart LR
    "Input" --> "InteractionState"
    "InteractionState" --> "CircuitGraph"
    "CircuitGraph" --> "Simulator"
    "Simulator" --> "ComponentState"
    "ComponentState" --> "Canvas Render"
    "InteractionState" --> "Tutorial"
    "Tutorial" --> "UI Overlay"
    "Levels" --> "Tutorial"
    "Levels" --> "SuccessCheck"
    "Simulator" --> "SuccessCheck"
    "SuccessCheck" --> "Settlement"
    "Analytics" --> "Save"
```

## 5. 仿真算法

教学近似仿真，不做SPICE级精确计算：

1. **构建节点**：通过导线连接关系合并引脚为电路节点
2. **识别回路**：从电池正极BFS搜索到负极的完整路径
3. **欧姆定律**：串联电路 I = V / R_total，各元件 V_drop = I * R
4. **并联分流**：I_total = V / R_eq，1/R_eq = Σ(1/R_i)
5. **灯泡亮度**：brightness = min(1, V_across / V_rated)
6. **电容充放电**：τ = RC，V(t) = V_max * (1 - e^(-t/τ))，dt步进
7. **开关**：断开时路径不通，闭合时视为零电阻导线
8. **短路检测**：R_total ≈ 0 时标记短路，限制电流

## 6. 交互状态机

```mermaid
stateDiagram-v2
    "Idle" --> "DraggingComponent" : 拖拽元件
    "Idle" --> "WiringStart" : 点击引脚
    "Idle" --> "Panning" : 中键/空格拖拽
    "DraggingComponent" --> "Idle" : 释放
    "WiringStart" --> "WiringDrag" : 移动鼠标
    "WiringDrag" --> "Idle" : 点击另一引脚/取消
    "Panning" --> "Idle" : 释放
    "Idle" --> "EditingValue" : 双击元件
    "EditingValue" --> "Idle" : 确认/取消
```

## 7. 存档格式

```typescript
interface SaveData {
  version: string;
  timestamp: number;
  level: string;
  components: ComponentData[];
  wires: WireData[];
  analytics: AnalyticsData;
  settings: Settings;
}
```

- 存储：localStorage，key = `circuit_sandbox_save`
- 分享：将存档JSON编码为base64 URL参数
- 自动保存：每30秒自动保存一次

## 8. 行为追踪数据

```typescript
interface AnalyticsData {
  levelId: string;
  startTime: number;
  endTime: number;
  retries: number;
  hintsUsed: number;
  tutorialSkipped: boolean;
  failureSteps: { step: string; count: number }[];
  componentPlaceCount: Record<string, number>;
  wireCount: number;
  switchToggleCount: number;
}
```
