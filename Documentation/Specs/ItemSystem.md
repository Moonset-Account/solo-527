# 物品检查与笔记系统设计

> 文件：[ItemSystem.md](file:///Volumes/TraeProjects/trae-solo-generated-projects/question-294/Documentation/Specs/ItemSystem.md)

---

## 1. 线索物品分类系统 (Clue Types)

### 1.1 线索物品枚举

| 类型Tag                 | 例子 |
|------------------------|-----|
| `Clue.Document`        | 信件、遗嘱、租约、日记页、账单、票据、报告、菜单、书籍|
| `Clue.Photo`           | 拍立得、团体照、明信片、相册、底片、身份证照|
| `Clue.KeyItem`         | 钥匙、密码本、保险箱钥匙、门禁卡、遥控器|
| `Clue.Object`          | 打火机、戒指、钢笔、玩具、药瓶、手表、珠宝|
| `Clue.AudioVisual`     | 录音带、磁带、U盘、MP3、手机、笔记本电脑|
| `Clue.Environmental`   | 墙上刻字、家具记号、污渍、日期刻痕、暗格标记|
| `Clue.Note`            | 便签条、名片、发绳结、照片背面手写|

---

## 2. 3D物品检查模式 (Examine Mode)

### 2.1 BP_ExamineViewer Actor

放置于隐藏场景，SceneCapture2D相机拍摄并将RenderTarget传入WBP_ExamineOverlay的Image控件：

```
Components:
  ├─ DefaultSceneRoot
  ├─ SpotLight_Key (45° 右上, 强度3000)
  ├─ SpotLight_Fill (左后, 强度800, 冷色补光)
  ├─ SkyLight (Cubemap: Apartment_Reflections)
  ├─ SceneCapture2D (2048x2048, OrthoWidth=400)
  │     └─ RenderTarget: RT_ExamineViewer
  └─ ArrowComponent (物品挂载点 "ItemAttach")
```

**蓝图变量**：
```
CurrentItemMesh : StaticMesh
CurrentItemAnim : AnimSequence
ItemRotation : Rotator
ZoomAmount : Float (1.0 = 默认)
MinZoom, MaxZoom : Float
```

**蓝图逻辑**：
```
Event ReceiveItem(Clue: FClueRecord):
  → 销毁旧ItemMesh
  → 根据ClueId创建新StaticMesh / PaperSprite
  → 从 DataAsset DA_ClueItems[ClueId] 获取Mesh
  → 播放Intro动画(物品旋转进入视野)

UpdateZoom(WheelDelta):
  ZoomAmount = Clamp(ZoomAmount + WheelDelta * 0.1, MinZoom, MaxZoom)
  → SceneCapture2D.OrthoWidth = Lerp(800, 150, ZoomAmount)

RotateItem(DragAxis: Vector2D):
  ItemRotation.Yaw += DragAxis.X * 2.0
  ItemRotation.Pitch += DragAxis.Y * 2.0
  ItemRotation.Pitch = Clamp(-80, 80)
  → StaticMesh.SetWorldRotation(ItemRotation)

CheckHotspot(ClickLocation: Vector2D):
  → 从RenderTarget反向投射到物品UV
  → 遍历 DA_ClueHotspots[ClueId]
  → 如果命中:
       显示弹出信息 "发现了血迹..."
       解锁额外线索条目
       触发Mistake检查 (点错可能失误)
```

### 2.2 检查模式成就触发
```
首次旋转物品360° → 成就"细致入微"
首次发现隐藏Hotspot → 成就"锐利目光"
检查物品超过60秒且无失误 → 成就"耐心侦探"
```

---

## 3. 笔记本系统 (Notebook)

### 3.1 四标签页设计

**Tab 1: 线索卡 (Clues)**
- **数据源**：`SaveData.PlayerProgress.CollectedClues` (TArray<FClueRecord>)
- **布局**：GridView，每行3张卡片
- **筛选器**：
  - 按类型Tag筛选 (Document/Photo/KeyItem...)
  - 按房间筛选 (101/102/大厅/走廊)
  - 按关联租客筛选
  - 按是否重要 (bIsKeyItem)
- **卡片设计** WBP_ClueCard：
  ```
  SizeBox (280x200)
    ├─ Border_BG (根据类型着色)
    ├─ Image_Thumb (DA_ClueItems[ClueId].Icon)
    ├─ Text_Title (ClueRecord.Title, 1行截断)
    ├─ Text_Tags (Badge: 房间/租客)
    └─ Checkbox_New (新线索时闪烁红点)
  ```
- **选中线索**：右侧展开完整描述 + 关联线索Web可视化

**Tab 2: 笔记 (Notes)**
- **功能1: 自动发现笔记**：
  - 玩家找到日记页时自动添加
  - 内容：`SaveData.PlayerProgress.NotebookEntries[Index].Content`
  - 富文本支持：插入线索卡片引用 `[CLUE:XXXX]`
- **功能2: 玩家手写笔记** (BETA版精简)：
  - 多LineEdit输入框
  - 输入时自动关联最近查看的3条线索
  - 最多50条，每条最多500字
- **排序**：按发现时间 / 按章节 / 按租客时间线

**Tab 3: 地图 (Apartment Map)**
- **底图**：Floor plan，B1/1F/2F分层切换
- **房间标记**：
  - 已发现：彩色填充 + 房间名标签
  - 未发现：灰色 + "???"
  - 已发生事件：动态粒子 (脚印/光点)
- **线索标记**：
  - Toggle "显示线索位置" 打开
  - 每个线索所在位置显示对应Type图标
  - 悬停弹出线索卡片预览
- **进度指示**：
  - 每个房间右上角圆形进度 (已收集线索/总线索)
  - 整体线索收集进度条

**Tab 4: 租客档案 (Dossier)**
- **数据源**：DataAsset DA_Tenants
- **每个租客Tab**：
  ```
  HorizontalBox
    ├─ SizeBox_Photo (180x240) → 占位照片(模糊→解锁清晰)
    └─ VerticalBox_Info
         ├─ Text_Name: 陈XX (租客姓名)
         ├─ Text_Room: 101室
         ├─ Text_OccupyDate: 入住 1994.03.15
         ├─ Text_Status: 失踪/在住/搬出 (状态标签颜色)
         └─ VerticalBox_Timeline
              ├─ Timeline节点 (每发现1条关联线索增加)
              └─ Node: 日期 + 线索摘要 + 链接到线索详情
  ```
- **关联分析**：点击租客→筛选仅显示与其关联的线索

### 3.2 线索关联系统 (Clue Linking)

手动关联 (玩家操作)：
```
长按线索卡片 → 拖到另一张卡片上
  → 如果符合预设关联: 解锁新节点 + 分数 + 自动笔记
  → 如果不符合: 一次Mistake失误 + 提示"似乎没有关联"
  → 预设关联定义在 DT_ClueRelations (DataTable)
     [ClueA, ClueB] → 关联说明文本 + 关联奖励分数
```

自动关联 (系统判定)：
```
发现Clue B时:
  → 遍历CollectedClues中每个Clue A
  → 检查 DT_ClueRelations
  → 如存在预定义关联:
       弹出通知 "发现了线索关联！"
       SaveData.LinkedRelations.Add(RelationId)
       自动在笔记中添加条目
```

---

## 4. 可检查家具 (非线索)

### 4.1 家具检查结果表

| 家具 | 检查结果 (非线索，环境叙事) |
|------|------------------------|
| 空抽屉 | "抽屉里只剩下一些灰尘，看来之前有人清理过。" |
| 衣柜 | "挂着几件旧衣服，袖口有磨损痕迹。衣服上有淡淡的烟味。" |
| 书架 | "大部分是旧书，有几本侦探小说。第3层有本书被取走了。" |
| 冰箱 | "几盒过期的罐头，角落有一张便利店购物清单。" |
| 床下 | "可以看到一些灰尘团，地板有轻微的刮痕，像被重物拖过。" |
| 窗台 | "窗台上有一块烟灰，窗外可以看到对面楼的窗户。" |
| 照片墙 | "有些照片歪了。最大那张合影里，有个人的脸被划掉了。" |
| 厨房灶台 | "灶头上有厚厚的油渍，旁边有被摔碎的碗碟粘在地上。" |

### 4.2 环境叙事触发条件
```
玩家连续检查3件"空"家具:
  → AmbientSystem.Tension = Lerp(Tension, Tension + 0.1, 0.5)
  → 20%概率播放远处Creak音效
  → HUD 提示 "似乎在找什么？试试更仔细地看..."
```
