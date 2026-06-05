# 物业报修和巡检管理系统

## 项目概述

本系统是一个功能完善的物业报修和巡检管理平台，实现了业主在线报修、工单派发、巡检打卡、费用登记、回访评价等完整业务流程，支持多角色权限管理和关键节点消息通知。

## 技术栈

### 后端
- **框架**: Spring Boot 3.2.0
- **ORM**: MyBatis-Plus 3.5.5 + Spring Data JPA
- **数据库**: MySQL 8.0
- **数据库迁移**: Flyway 9.22.3
- **缓存队列**: Redis
- **安全认证**: Spring Security + JWT
- **邮件**: Spring Mail
- **工具库**: Hutool 5.8.23

### 前端
- **框架**: Vue 3.4 + Vite 5.0
- **UI组件**: Element Plus 2.4
- **状态管理**: Pinia 2.1
- **路由**: Vue Router 4.2
- **HTTP客户端**: Axios 1.6

## 核心功能

### 业务流程
```
业主提交报修 → 物业审核派单 → 维修人员处理 → 上传处理照片
       ↓                                                ↓
满意度评价 ← 业主验收关闭 ←  系统校验照片  ←  完成处理
```

### 功能模块
1. **在线报修**: 业主在线提交报修工单，支持紧急工单
2. **工单派发**: 物业主管/人员审核工单并指派维修人员
3. **巡检打卡**: 巡检人员扫码/打卡记录，异常自动生成工单
4. **费用登记**: 材料费、人工费等费用登记和在线缴费
5. **回访评价**: 业主对维修服务进行满意度评价
6. **消息通知**: 关键节点站内消息/邮件通知，紧急工单优先推送
7. **角色权限**: 按角色隐藏敏感字段，不同角色不同菜单入口

### 系统特色
- ✅ **工作流引擎**: 申请→审核→执行→复盘 完整闭环
- ✅ **紧急工单**: Redis队列优先推送，多渠道提醒
- ✅ **照片校验**: 关闭工单前系统自动校验必须上传处理照片
- ✅ **敏感字段**: 按角色动态隐藏敏感信息
- ✅ **历史追踪**: 工单完整状态流转记录
- ✅ **附件管理**: 支持工单/巡检多类型附件上传

## 快速开始

### 环境要求
- JDK 17+
- MySQL 8.0+
- Redis 6.0+
- Node.js 16+

### 数据库初始化
```sql
CREATE DATABASE property_management DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 后端启动
```bash
cd backend
# 修改application.yml中的数据库和Redis配置
mvn spring-boot:run
```

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

### 访问地址
- 前端: http://localhost:3000
- 后端API: http://localhost:8080/api

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 物业主管 | admin | 123456 | 全功能权限 |
| 物业人员 | property01 | 123456 | 工单审核、费用登记 |
| 维修人员 | maint01 | 123456 | 接单处理、上传照片 |
| 巡检人员 | inspector01 | 123456 | 巡检打卡、异常上报 |
| 业主 | owner01 | 123456 | 提交报修、验收评价 |

## API 概览

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/userinfo` - 获取当前用户信息

### 工单接口
- `POST /api/orders` - 创建工单
- `GET /api/orders` - 工单列表
- `GET /api/orders/{id}` - 工单详情
- `POST /api/orders/{id}/approve` - 审核工单
- `POST /api/orders/{id}/start` - 开始处理
- `POST /api/orders/{id}/complete` - 完成处理
- `POST /api/orders/{id}/close` - 关闭工单（校验照片）
- `GET /api/orders/{id}/history` - 工单历史记录
- `GET /api/orders/dashboard/stats` - 仪表盘统计

### 巡检接口
- `POST /api/inspection/checkin` - 巡检打卡
- `POST /api/inspection/records/{id}/handle` - 处理异常
- `GET /api/inspection/records` - 巡检记录列表
- `GET /api/inspection/points` - 巡检点列表

### 消息接口
- `GET /api/messages` - 我的消息
- `POST /api/messages/{id}/read` - 标记已读
- `GET /api/messages/unread/count` - 未读消息数

### 文件接口
- `POST /api/files/upload` - 文件上传
- `GET /api/files` - 附件列表
- `DELETE /api/files/{id}` - 删除附件

### 费用接口
- `POST /api/expenses` - 登记费用
- `POST /api/expenses/{id}/pay` - 缴费
- `GET /api/expenses` - 费用列表

### 满意度接口
- `POST /api/satisfaction` - 提交评价
- `GET /api/satisfaction` - 评价列表

## 测试样例

### 测试场景1: 完整工单流程
**目标**: 验证从报修到关闭的完整流程，包括照片校验

**步骤**:
1. 业主(owner01/123456)登录
2. 进入"提交报修"，填写:
   - 标题: "卫生间水龙头漏水"
   - 分类: 水电维修
   - 优先级: 普通
   - 房间: 1栋101室
   - 描述: "卫生间洗手盆水龙头漏水严重"
3. 提交后记录工单ID
4. 切换物业主管(admin/123456)登录
5. 在工单列表找到新工单，点击"审核"
6. 选择"通过并派单"，指派给王师傅
7. 切换维修人员(maint01/123456)登录
8. 在工单列表找到派单，点击"开始处理"
9. 处理完成后点击"完成"，输入备注
10. 切换回业主账号，进入工单详情
11. 尝试直接点击"关闭工单" → 系统提示必须上传照片
12. 先点击"上传照片"，上传处理后的照片
13. 再次点击"关闭工单" → 成功关闭
14. 进入"满意度评价"，对服务进行评分

### 测试场景2: 紧急工单推送
**目标**: 验证紧急工单的优先处理机制

**步骤**:
1. 业主登录，提交报修
2. 优先级选择"紧急"
3. 提交后立即检查:
   - 物业主管/人员的消息中心收到紧急提醒（红色标记）
   - 消息带有URGENT优先级标签
   - 工单列表中紧急工单优先显示
4. 验证Redis队列中存在紧急工单记录

### 测试场景3: 角色权限和敏感字段
**目标**: 验证不同角色看到的信息不同

**步骤**:
1. 物业主管登录，查看工单详情 → 可以看到预估费用、驳回原因等所有字段
2. 切换业主登录，查看同一工单 → 预估费用字段被隐藏
3. 查看满意度评价列表 → 非本人评价的业主姓名显示为***
4. 维修人员登录 → 只能看到指派给自己的工单
5. 业主登录 → 菜单中只有"工单管理、提交报修、费用管理、消息中心"

### 测试场景4: 巡检异常处理
**目标**: 验证巡检打卡和异常生成工单

**步骤**:
1. 巡检人员(inspector01/123456)登录
2. 选择"1栋一层消防栓"巡检点
3. 状态选择"异常"，填写"消防栓玻璃有裂纹"
4. 提交打卡
5. 切换物业主管登录
6. 消息中心收到"巡检异常提醒"
7. 进入巡检记录，点击"处理"
8. 选择"生成工单" → 系统自动创建关联工单

### 测试场景5: 费用登记和缴费
**目标**: 验证费用管理流程

**步骤**:
1. 物业人员登录，进入费用管理
2. 点击"登记费用"，选择关联工单
3. 录入材料费和人工费
4. 业主登录，费用列表看到待缴费记录
5. 点击"缴费"，选择支付方式
6. 验证工单状态变更为"已缴费"

## 数据库表结构

| 表名 | 说明 |
|------|------|
| sys_user | 系统用户表 |
| owner | 业主信息表 |
| building | 楼栋表 |
| room | 房间表 |
| work_order | 报修工单表 |
| work_order_history | 工单状态历史表 |
| material | 维修材料表 |
| work_order_material | 工单材料明细表 |
| satisfaction | 满意度评价表 |
| inspection_point | 巡检点表 |
| inspection_record | 巡检记录表 |
| sys_message | 站内消息表 |
| attachment | 附件表 |
| expense_record | 费用登记表 |

## 项目结构

```
.
├── backend/                    # 后端项目
│   ├── src/main/java/com/property/
│   │   ├── common/            # 公共类
│   │   │   ├── enums/         # 枚举类
│   │   │   ├── Result.java    # 统一响应
│   │   │   └── UserContext.java # 用户上下文
│   │   ├── config/            # 配置类
│   │   ├── controller/        # REST控制器
│   │   ├── entity/            # 实体类
│   │   ├── exception/         # 异常处理
│   │   ├── mapper/            # MyBatis Mapper
│   │   ├── security/          # 安全相关
│   │   ├── service/           # 业务服务
│   │   └── utils/             # 工具类
│   └── src/main/resources/
│       ├── db/migration/      # Flyway迁移脚本
│       └── application.yml    # 应用配置
└── frontend/                   # 前端项目
    └── src/
        ├── api/               # API接口
        ├── assets/            # 静态资源
        ├── router/            # 路由配置
        ├── stores/            # Pinia状态
        ├── utils/             # 工具函数
        └── views/             # 页面组件
```

## 关键实现说明

### 1. 工单关闭照片校验
在 [WorkOrderService.java](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-018/backend/src/main/java/com/property/service/WorkOrderService.java#L207-L225) 中实现：
- 关闭工单前查询该工单下的图片附件数量
- 如果数量为0，返回错误提示，阻止关闭
- 只有上传图片后才能正常关闭

### 2. 角色敏感字段过滤
在 [WorkOrderService.java](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-018/backend/src/main/java/com/property/service/WorkOrderService.java#L296-L310) 中实现：
- 根据当前用户角色，动态隐藏敏感字段
- 业主看不到预估费用
- 非管理员看不到驳回原因
- 满意度评价中非本人的业主名称脱敏

### 3. 紧急工单优先推送
- 紧急工单写入Redis队列 `property:urgent:orders`
- 异步发送消息给所有物业管理员和主管
- 消息标记为URGENT优先级，前端红色高亮显示

### 4. 工作流状态机
工单状态流转：
```
PENDING(待审核) → APPROVED(已派单) → PROCESSING(处理中) 
    ↓                ↓                    ↓
REJECTED(驳回)    COMPLETED(待验收) ←───┘
                      ↓
                 CLOSED(已关闭)
```

每个状态变更都记录到 `work_order_history` 表，保留完整审计追踪。
