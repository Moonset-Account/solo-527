# 生鲜团购截单与分拣平台

基于 Flask + React 的生鲜团购业务系统，支持居民下单、楼栋分拣、缺货替换、退款确认、取货核销等完整业务流程。

## 项目结构

```
question-090/
├── backend/                 # Flask 后端
│   ├── app.py              # 应用入口
│   ├── config.py           # 配置文件
│   ├── models.py           # 数据模型
│   ├── routes/             # API 路由
│   │   ├── auth.py         # 认证
│   │   ├── users.py        # 用户管理
│   │   ├── products.py     # 商品管理
│   │   ├── buildings.py    # 楼栋管理
│   │   ├── orders.py       # 订单管理
│   │   ├── shortages.py    # 缺货管理
│   │   ├── refunds.py      # 退款管理
│   │   ├── sorting.py      # 分拣管理
│   │   ├── pickup.py       # 取货核销
│   │   ├── filters.py      # 筛选保存
│   │   └── exports.py      # 导出功能
│   └── utils/              # 工具类
│       ├── decorators.py   # 权限装饰器
│       ├── error_handler.py # 异常处理
│       ├── helpers.py      # 辅助函数
│       └── response.py     # 响应封装
└── frontend/               # React 前端
    ├── src/
    │   ├── api/            # API 调用
    │   ├── components/     # 通用组件
    │   ├── layouts/        # 布局组件
    │   ├── pages/          # 页面组件
    │   │   ├── user/       # 居民端页面
    │   │   └── admin/      # 管理端页面
    │   ├── App.jsx         # 主应用
    │   └── main.jsx        # 入口
    └── vite.config.js      # Vite 配置
```

## 快速启动

### 1. 启动后端服务

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

后端服务将运行在 http://localhost:5000

### 2. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务将运行在 http://localhost:3000

## 系统入口

### 外部入口（居民）
- 访问 http://localhost:3000
- 功能：商品浏览、下单、订单查看、缺货确认、退款申请

### 内部入口（管理员/工作人员）
- 访问 http://localhost:3000/admin
- 功能：截单提醒、楼栋分拣、缺货替换、退款确认、取货核销、商品/楼栋/用户管理

## 测试账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | 13800138000 | admin123 |

## 验收路径检查

### 1. 新增路径
- ✅ 订单新增：居民下单 -> 订单创建 -> 库存扣减
- ✅ 缺货记录新增：分拣时发现缺货 -> 创建缺货记录
- ✅ 退款申请新增：用户申请退款 -> 退款记录创建
- ✅ 分拣袋新增：创建分拣袋 -> 添加订单商品

### 2. 审批路径
- ✅ 退款审批：管理员审核退款 -> 通过/拒绝
- ✅ 缺货确认：用户确认缺货替换方案
- ✅ 订单截单：管理员批量截单 -> 订单状态更新
- ✅ 取货核销：扫码/输入 -> 确认取货

### 3. 撤回路径
- ✅ 退款撤回：用户撤回待审核的退款申请
- ✅ 订单取消：截单前用户可取消订单
- ✅ 分拣袋商品移除：分拣中可移除已添加商品

### 4. 导出路径
- ✅ 订单导出：按条件筛选导出 Excel
- ✅ 分拣单导出：按楼栋导出分拣清单
- ✅ 退款导出：退款记录导出 Excel
- ✅ 缺货导出：缺货记录导出 Excel

## 权限控制

| 功能 | 普通用户 | 工作人员 | 管理员 |
|------|---------|---------|--------|
| 浏览商品、下单 | ✅ | ✅ | ✅ |
| 查看自己订单 | ✅ | ✅ | ✅ |
| 申请退款、缺货确认 | ✅ | ✅ | ✅ |
| 订单管理、截单 | ❌ | ✅ | ✅ |
| 分拣操作 | ❌ | ✅ | ✅ |
| 缺货处理 | ❌ | ✅ | ✅ |
| 退款审批 | ❌ | ✅ | ✅ |
| 取货核销 | ❌ | ✅ | ✅ |
| 商品/楼栋/用户管理 | ❌ | ❌ | ✅ |

## 核心索引

数据库已为以下字段创建索引：
- User.phone
- Order.order_no, Order.user_id, Order.building_id, Order.created_at
- OrderItem.order_id
- ShortageItem.order_id
- Refund.refund_no, Refund.order_id
- SortingBag.bag_no, SortingBag.building_id
- SortingBagItem.bag_id, SortingBagItem.order_id
- PickupRecord.order_id, PickupRecord.pickup_code
- SavedFilter.user_id, SavedFilter.page_name

## 异常处理

- 统一的 API 错误响应格式：`{ code, message, data }`
- 权限不足返回 403
- 资源不存在返回 404
- 参数错误返回 400
- 业务逻辑错误返回明确的中文提示
- 数据库异常捕获并返回友好提示
