# 陶瓷工作室窑炉排烧平台 - 项目结构总览

## 运行演示

```bash
# 运行核心业务逻辑演示（10个场景完整验证）
php demo_scheduling.php

# 运行API接口返回演示（12个核心接口）
php demo_api.php
```

---

## 目录结构

```
question-097/
├── app/
│   ├── Http/
│   │   ├── Controllers/           # 6个API控制器，40+端点
│   │   │   ├── AuthController.php
│   │   │   ├── KilnBatchController.php      # 窑次排程核心
│   │   │   ├── WorkController.php           # 作品管理+照片
│   │   │   ├── KilnController.php           # 窑炉+维护日
│   │   │   ├── FiringCurveController.php    # 烧成曲线模板
│   │   │   └── MaterialController.php       # 泥料釉料管理
│   │   └── Middleware/
│   │       ├── TeacherMiddleware.php        # 老师权限
│   │       └── StudentMiddleware.php        # 学员权限
│   ├── Models/                     # 12个Eloquent模型
│   │   ├── User.php
│   │   ├── Clay.php
│   │   ├── Glaze.php
│   │   ├── GlazeCompatibility.php
│   │   ├── Kiln.php
│   │   ├── KilnMaintenanceDay.php
│   │   ├── FiringCurveTemplate.php
│   │   ├── FiringCurvePoint.php
│   │   ├── KilnBatch.php
│   │   ├── KilnBatchWork.php
│   │   ├── Work.php
│   │   └── WorkPhoto.php
│   └── Services/                   # 3个核心业务服务
│       ├── ConflictCheckService.php         # 6维冲突校验
│       ├── KilnSchedulingService.php        # 排程算法核心
│       └── PhotoStorageService.php          # 照片存储
├── database/
│   ├── migrations/               # 9个数据库迁移
│   └── factories/                # 7个模型工厂
├── routes/
│   └── api.php                   # API路由定义
├── config/
│   ├── database.php              # PostgreSQL + Redis配置
│   ├── filesystems.php
│   ├── app.php
│   ├── auth.php
│   └── cache.php
├── tests/
│   ├── Unit/
│   │   ├── ConflictCheckServiceTest.php    # 11个测试用例
│   │   └── KilnSchedulingServiceTest.php   # 11个测试用例
│   └── TestCase.php
├── demo_scheduling.php          # 核心业务逻辑演示
├── demo_api.php                 # API接口返回演示
└── composer.json
```

---

## 功能需求对照表

| 需求 | 实现文件 | 核心方法/接口 |
|------|----------|--------------|
| **窑次排程算法** | [KilnSchedulingService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/KilnSchedulingService.php) | `createKilnBatch()`, `addWorkToBatch()`, `recommendOptimalZone()` |
| **曲线模板表** | [FiringCurveTemplate.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Models/FiringCurveTemplate.php) + [迁移](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/database/migrations/2024_01_01_000005_create_firing_curve_templates_table.php) | 含多段升温曲线点 |
| **作品照片存储** | [PhotoStorageService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/PhotoStorageService.php) + [WorkController.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Http/Controllers/WorkController.php#L160-L177) | `storePhoto()`, 自动生成300x300缩略图 |
| **冲突校验接口** | [ConflictCheckService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/ConflictCheckService.php) + [KilnBatchController.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Http/Controllers/KilnBatchController.php#L148-L162) | `checkAllConflicts()`, 6维度校验 |
| **出窑批量更新** | [KilnSchedulingService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/KilnSchedulingService.php#L199-L256) + [KilnBatchController.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Http/Controllers/KilnBatchController.php#L126-L146) | `batchUnload()` |
| **撤销排烧后名额释放** | [KilnSchedulingService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/KilnSchedulingService.php#L117-L158) | `removeWorkFromBatch()`, `cancelKilnBatch()` |
| **窑炉维护日不能排烧** | [Kiln.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Models/Kiln.php#L47-L68) + [KilnSchedulingService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/KilnSchedulingService.php#L44-L65) | `isAvailableOn()`, 支持单次+周循环 |
| **修改曲线后重校验** | [ConflictCheckService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/ConflictCheckService.php#L219-L256) + [KilnSchedulingService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/KilnSchedulingService.php#L160-L197) | `checkBatchForCurveChange()`, 返回受影响作品列表 |
| **学员只看自己作品** | [Work.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Models/Work.php#L107-L118) + [WorkController.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Http/Controllers/WorkController.php#L33-L57) | `isVisibleTo()`, 查询自动过滤 |
| **不能查看别人失败记录** | [Work.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Models/Work.php#L120-L127) + [WorkController.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Http/Controllers/WorkController.php#L53-L57) | `canViewFailureDetails()`, 自动隐藏敏感字段 |
| **温区冲突检查** | [ConflictCheckService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/ConflictCheckService.php#L86-L140) | `checkTemperatureZone()` |
| **学员作品数量限制** | [ConflictCheckService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/ConflictCheckService.php#L68-L84) | `checkStudentWorkLimit()` |
| **釉料兼容性检查** | [ConflictCheckService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/ConflictCheckService.php#L142-L183) | `checkGlazeCompatibility()` |
| **窑内空间检查** | [ConflictCheckService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/ConflictCheckService.php#L185-L217) | `checkKilnSpace()` |
| **破损原因+赔付状态** | [Work.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Models/Work.php#L27-L39) + 迁移 | 字段 + 批量出窑接口 |
| **是否进入作品展** | [Work.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Models/Work.php) `for_exhibition` 字段 | 出窑时可设置 |
| **PostgreSQL** | [database.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/config/database.php) | 主数据库连接 |
| **Redis** | [database.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/config/database.php#L58-L85) + [KilnSchedulingService.php](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-097/app/Services/KilnSchedulingService.php#L292-L312) | 窑次信息缓存（1小时） |

---

## 冲突校验6维度

| 维度 | 检查内容 |
|------|----------|
| 1. 容量检查 | 窑次总容量是否已满 |
| 2. 学员名额 | 单学员单窑次作品数量是否超限 |
| 3. 温区兼容 | 泥料/釉料温度范围是否兼容曲线最高温 |
| 4. 釉料兼容 | 窑内已有釉料与新作品釉料是否冲突 |
| 5. 空间占用 | 作品体积是否超出窑内剩余空间 |
| 6. 作品状态 | 是否为待入窑状态且未被其他窑次占用 |

---

## 核心 API 端点

### 窑次排程
```
POST   /api/kiln-batches                    # 创建窑次
GET    /api/kiln-batches                    # 窑次列表
GET    /api/kiln-batches/{batch}            # 窑次详情
PUT    /api/kiln-batches/{batch}            # 编辑窑次
POST   /api/kiln-batches/{batch}/add-work   # 拖拽作品入窑
DELETE /api/kiln-batches/{batch}/works/{work}  # 移除作品（释放名额）
POST   /api/kiln-batches/{batch}/update-curve  # 修改曲线（触发重校验）
POST   /api/kiln-batches/{batch}/unload     # 出窑批量更新
POST   /api/kiln-batches/{batch}/cancel     # 撤销整窑（释放全部名额）
POST   /api/kiln-batches/{batch}/check-conflict  # 冲突预校验
GET    /api/kiln-batches/{batch}/recommend-zone/{work}  # 温区推荐
```

### 作品管理
```
GET    /api/works                          # 作品列表（学员自动过滤）
GET    /api/works/{work}                   # 作品详情（权限控制）
POST   /api/works                          # 创建作品
PUT    /api/works/{work}                   # 更新作品
POST   /api/works/{work}/photos            # 上传照片
DELETE /api/works/{work}/photos/{photo}    # 删除照片
```

### 窑炉与曲线
```
GET    /api/kilns                          # 窑炉列表
GET    /api/kilns/{kiln}/available-slots   # 可排期查询
POST   /api/kilns/{kiln}/maintenance       # 添加维护日
GET    /api/firing-curves                  # 曲线模板列表
POST   /api/firing-curves                  # 创建曲线模板
```

---

## 测试覆盖

| 测试类 | 测试用例数 | 覆盖场景 |
|--------|-----------|----------|
| ConflictCheckServiceTest | 11 | 容量、名额、温区、釉料、空间、状态、曲线变更 |
| KilnSchedulingServiceTest | 11 | 创建、维护日、入窑/出窑、撤销、曲线变更、名额释放 |

---

## 安装运行

```bash
# 1. 安装依赖
composer install

# 2. 配置 .env 中的 PostgreSQL 和 Redis 连接

# 3. 执行数据库迁移
php artisan migrate

# 4. 运行测试
php artisan test

# 5. 启动开发服务器
php artisan serve
```

---

## 演示脚本

```bash
# 运行核心业务逻辑演示（无需安装依赖）
php demo_scheduling.php

# 运行API接口返回演示（无需安装依赖）
php demo_api.php
```
