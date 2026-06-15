-- 青禾选题协作台数据库脚本
-- 创建时间: 2026-06-15

CREATE DATABASE IF NOT EXISTS qinghe_topic DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE qinghe_topic;

-- 1. 用户表
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号',
    nickname VARCHAR(50) NOT NULL COMMENT '昵称',
    password VARCHAR(100) NOT NULL DEFAULT '123456' COMMENT '密码',
    role TINYINT NOT NULL COMMENT '角色:1-创作者 2-审核员 3-运营 4-负责人',
    avatar VARCHAR(255) COMMENT '头像',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1-启用 0-禁用',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除:0-未删除 1-已删除',
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 2. 选题表
DROP TABLE IF EXISTS topic;
CREATE TABLE topic (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '选题ID',
    title VARCHAR(200) NOT NULL COMMENT '选题标题',
    description TEXT COMMENT '选题描述',
    tags VARCHAR(500) COMMENT '选题标签(逗号分隔)',
    target_audience VARCHAR(500) COMMENT '目标受众',
    content_direction TEXT COMMENT '内容方向说明',
    creator_id BIGINT NOT NULL COMMENT '创建人ID',
    creator_name VARCHAR(50) NOT NULL COMMENT '创建人姓名',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1-待办 2-处理中 3-已完成 4-异常',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除:0-未删除 1-已删除',
    INDEX idx_creator (creator_id),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='选题表';

-- 3. 脚本表
DROP TABLE IF EXISTS script;
CREATE TABLE script (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '脚本ID',
    topic_id BIGINT NOT NULL COMMENT '关联选题ID',
    topic_title VARCHAR(200) NOT NULL COMMENT '选题标题(冗余)',
    title VARCHAR(200) NOT NULL COMMENT '脚本标题',
    content MEDIUMTEXT COMMENT '脚本正文内容',
    shooting_requirement TEXT COMMENT '拍摄要求',
    material_tags VARCHAR(1000) COMMENT '素材标签(逗号分隔)',
    duration VARCHAR(50) COMMENT '预计时长',
    creator_id BIGINT NOT NULL COMMENT '创建人ID',
    creator_name VARCHAR(50) NOT NULL COMMENT '创建人姓名',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1-待办 2-处理中 3-已完成 4-异常',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除:0-未删除 1-已删除',
    INDEX idx_topic (topic_id),
    INDEX idx_creator (creator_id),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本表';

-- 4. 审核记录表(用于变更追溯)
DROP TABLE IF EXISTS review_record;
CREATE TABLE review_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    business_id BIGINT NOT NULL COMMENT '业务ID(选题ID/脚本ID)',
    review_type TINYINT NOT NULL COMMENT '审核类型:1-选题 2-脚本 3-素材标签',
    review_type_name VARCHAR(50) NOT NULL COMMENT '审核类型名称',
    version INT NOT NULL DEFAULT 1 COMMENT '版本号',
    before_content MEDIUMTEXT COMMENT '变更前内容(JSON快照)',
    after_content MEDIUMTEXT COMMENT '变更后内容(JSON快照)',
    diff_content MEDIUMTEXT COMMENT '差异内容说明',
    review_opinion TEXT COMMENT '审稿意见',
    review_result TINYINT COMMENT '审核结果:1-通过 2-驳回 3-需修改',
    reviewer_id BIGINT COMMENT '审核人ID',
    reviewer_name VARCHAR(50) COMMENT '审核人姓名',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除:0-未删除 1-已删除',
    INDEX idx_business (business_id, review_type),
    INDEX idx_reviewer (reviewer_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核记录/变更历史表';

-- 5. 异常记录表
DROP TABLE IF EXISTS abnormal_record;
CREATE TABLE abnormal_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '异常ID',
    title VARCHAR(200) NOT NULL COMMENT '异常标题',
    business_id BIGINT COMMENT '关联业务ID',
    business_type VARCHAR(50) COMMENT '业务类型:topic/script/video',
    business_name VARCHAR(200) COMMENT '业务名称(冗余)',
    abnormal_type TINYINT NOT NULL COMMENT '异常类型:1-版权 2-肖像权 3-商标 4-音乐 99-其他',
    abnormal_type_name VARCHAR(50) NOT NULL COMMENT '异常类型名称',
    description TEXT NOT NULL COMMENT '异常描述',
    evidence VARCHAR(1000) COMMENT '证据/截图链接(逗号分隔)',
    reporter_id BIGINT NOT NULL COMMENT '上报人ID',
    reporter_name VARCHAR(50) NOT NULL COMMENT '上报人姓名',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1-待办 2-处理中 3-已完成 4-异常',
    conclusion TEXT COMMENT '处理结论',
    handler_id BIGINT COMMENT '处理人ID(新媒体运营)',
    handler_name VARCHAR(50) COMMENT '处理人姓名',
    handle_time DATETIME COMMENT '处理时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除:0-未删除 1-已删除',
    INDEX idx_abnormal_type (abnormal_type),
    INDEX idx_status (status),
    INDEX idx_handler (handler_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常记录表';

-- 6. 视频数据表(复盘用)
DROP TABLE IF EXISTS video_data;
CREATE TABLE video_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '数据ID',
    script_id BIGINT NOT NULL COMMENT '关联脚本ID',
    topic_id BIGINT NOT NULL COMMENT '关联选题ID',
    video_title VARCHAR(200) NOT NULL COMMENT '视频标题',
    platform VARCHAR(50) NOT NULL COMMENT '发布平台:抖音/快手/视频号/B站等',
    video_url VARCHAR(500) COMMENT '视频链接',
    publish_date DATE NOT NULL COMMENT '发布日期',
    views BIGINT NOT NULL DEFAULT 0 COMMENT '播放量',
    likes BIGINT NOT NULL DEFAULT 0 COMMENT '点赞数',
    comments BIGINT NOT NULL DEFAULT 0 COMMENT '评论数',
    shares BIGINT NOT NULL DEFAULT 0 COMMENT '分享数',
    favorites BIGINT NOT NULL DEFAULT 0 COMMENT '收藏数',
    clicks BIGINT NOT NULL DEFAULT 0 COMMENT '点击数(跳转链接)',
    conversions BIGINT NOT NULL DEFAULT 0 COMMENT '转化数',
    conversion_rate DECIMAL(10,4) NOT NULL DEFAULT 0 COMMENT '转化率%',
    amount DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT '转化金额(元)',
    creator_id BIGINT NOT NULL COMMENT '创作者ID',
    creator_name VARCHAR(50) NOT NULL COMMENT '创作者姓名',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除:0-未删除 1-已删除',
    INDEX idx_topic (topic_id),
    INDEX idx_script (script_id),
    INDEX idx_platform (platform),
    INDEX idx_publish_date (publish_date),
    INDEX idx_creator (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频数据统计表';

-- ========== 初始化测试数据 ==========

-- 用户数据
INSERT INTO sys_user (username, nickname, role, phone, email) VALUES
('creator01', '张小明', 1, '13800138001', 'zhangxm@qinghe.com'),
('creator02', '李小红', 1, '13800138002', 'lixh@qinghe.com'),
('creator03', '王小刚', 1, '13800138003', 'wangxg@qinghe.com'),
('reviewer01', '陈审核', 2, '13800138004', 'chensh@qinghe.com'),
('operator01', '赵运营', 3, '13800138005', 'zhaoyy@qinghe.com'),
('admin01', '孙负责人', 4, '13800138006', 'sunfzr@qinghe.com');

-- 选题数据
INSERT INTO topic (title, description, tags, target_audience, content_direction, creator_id, creator_name, status) VALUES
('夏季新品防晒衣种草', '针对夏季防晒需求，推广品牌新款防晒衣，突出轻薄透气、UPF50+等卖点', '防晒衣,夏季,穿搭,种草', '18-35岁女性,都市白领,户外爱好者', '以真实测评+穿搭展示为主，对比普通防晒衣的差异', 1, '张小明', 3),
('618大促爆款清单', '618促销期间，整理品牌爆款产品清单，结合优惠力度推荐', '618,大促,爆款,清单', '全年龄段,价格敏感型用户', '清单式盘点，突出价格优势和限量感', 1, '张小明', 3),
('职场新人穿搭指南', '针对刚入职场的新人，提供一周穿搭不重样方案', '职场,穿搭,新人,通勤', '22-28岁,职场新人,大学生', '剧情化+搭配技巧，每套装束附产品链接', 2, '李小红', 2),
('亲子装出游穿搭', '五一/暑假出游场景，展示品牌亲子装系列', '亲子,出游,家庭,穿搭', '25-40岁宝妈,家庭用户', '家庭场景vlog形式，温馨感+产品实用性', 2, '李小红', 1),
('男士运动系列测评', '测评品牌男士运动服饰，适合健身房、跑步等场景', '运动,男装,测评,健身', '20-40岁男性,健身爱好者', '硬核测评+运动场景实拍，强调面料科技', 3, '王小刚', 1);

-- 脚本数据
INSERT INTO script (topic_id, topic_title, title, content, shooting_requirement, material_tags, duration, creator_id, creator_name, status) VALUES
(1, '夏季新品防晒衣种草', '防晒衣测评：这件居然比遮阳伞还顶用？',
'【开场】烈日下走路的画面，博主额头冒汗
【对比】普通防晒衣vs品牌防晒衣：透气性测试（蒸汽实验）
【细节】展示UPF50+标签、面料纹理、帽檐设计
【穿搭】3套不同场景穿搭展示：通勤/户外/约会
【结尾】上身效果+跳转链接引导',
'需要户外高温场景、蒸汽壶道具、放大镜看面料细节',
'防晒衣测评,蒸汽实验,穿搭展示,产品特写',
'60s-90s', 1, '张小明', 3),
(1, '夏季新品防晒衣种草', '防晒衣避坑指南：3个指标教你选对',
'【知识点】UPF值是什么？多少才合格？
【避坑】市面上常见的3种不合格防晒衣
【推荐】品牌防晒衣符合所有标准，上身展示
【实测】洗10次后防晒效果对比',
'需要实验室检测画面、洗衣机场景',
'避坑指南,科普,洗后测试,对比实验',
'90s-120s', 1, '张小明', 3),
(2, '618大促爆款清单', '618必买清单Top5，错过等一年！',
'【开场】618氛围场景，满屏优惠标签
【Top5-3】逐一展示3-5名产品，突出原价vs活动价
【Top2-1】重点介绍前2名爆款，库存紧张提示
【彩蛋】评论区专属额外优惠券',
'需要喜庆的618特效，价格标签动画',
'618清单,爆款推荐,价格对比,倒计时效果',
'60s', 1, '张小明', 2),
(3, '职场新人穿搭指南', '入职第一天怎么穿？5天不重样方案',
'【场景】周一到周五每天一套穿搭
【Day1】正式面试风：西装套裙
【Day2-4】休闲通勤风：衬衫+半裙/裤子
【Day5】周五轻松风：针织衫+牛仔裤
【总结】衣橱百搭单品推荐',
'需要办公室场景，时钟特效显示周一到周五',
'职场穿搭,一周穿搭,通勤风,搭配技巧',
'120s', 2, '李小红', 1);

-- 审核记录(模拟变更追溯)
INSERT INTO review_record (business_id, review_type, review_type_name, version, before_content, after_content, diff_content, review_opinion, review_result, reviewer_id, reviewer_name) VALUES
(1, 1, '选题审核', 1, NULL, '{"title":"夏季新品防晒衣种草","tags":"防晒衣,夏季,种草"}', '初始提交', '选题方向OK，建议增加更多人群细分', 1, 4, '陈审核'),
(1, 1, '选题审核', 2, '{"targetAudience":"18-35岁女性"}', '{"targetAudience":"18-35岁女性,都市白领,户外爱好者"}', '目标受众增加了"都市白领,户外爱好者"', '受众更精准了，通过', 1, 4, '陈审核'),
(1, 2, '脚本审核', 1, NULL, '{"title":"防晒衣测评...","duration":"60s-90s"}', '初始提交脚本', '脚本结构清晰，建议增加洗后测试环节', 3, 4, '陈审核'),
(1, 2, '脚本审核', 2, '{"content":"...5个章节"}', '{"content":"...6个章节，新增洗后对比"}', '内容增加了洗10次后防晒效果对比环节', '修改到位，脚本通过', 1, 4, '陈审核'),
(3, 3, '素材标签审核', 1, '{"materialTags":"防晒衣测评"}', '{"materialTags":"防晒衣测评,蒸汽实验,穿搭展示,产品特写"}', '素材标签从1个增加到4个，更全面了', '标签完整，覆盖所有素材场景', 1, 4, '陈审核');

-- 异常记录(模拟素材授权风险)
INSERT INTO abnormal_record (title, business_id, business_type, business_name, abnormal_type, abnormal_type_name, description, evidence, reporter_id, reporter_name, status, conclusion, handler_id, handler_name, handle_time) VALUES
('脚本背景音乐版权风险', 1, 'script', '防晒衣测评：这件居然比遮阳伞还顶用？', 4, '背景音乐授权', '脚本BGM使用了某流行歌曲片段，未获得商用授权，存在侵权风险', '/uploads/evidence/bgm1.png,/uploads/evidence/bgm2.png', 4, '陈审核', 3, '已更换为平台免费商用BGM《Sunny Day》，保留替换记录，联系版权方确认无风险', 5, '赵运营', '2026-06-10 15:30:00'),
('视频素材疑似未经授权的明星肖像', 2, 'script', '防晒衣避坑指南：3个指标教你选对', 2, '肖像权风险', '脚本中引用的对比素材包含某明星街拍照片，未获得肖像授权', '/uploads/evidence/portrait1.jpg', 4, '陈审核', 2, NULL, 5, '赵运营', NULL),
('产品Logo使用超出授权范围', 3, 'script', '618必买清单Top5，错过等一年！', 3, '商标侵权风险', '脚本中展示了竞品品牌Logo用于对比，可能违反商标法相关规定', '/uploads/evidence/logo1.png', 4, '陈审核', 1, NULL, NULL, NULL, NULL);

-- 视频数据(模拟复盘数据)
INSERT INTO video_data (script_id, topic_id, video_title, platform, video_url, publish_date, views, likes, comments, shares, favorites, clicks, conversions, conversion_rate, amount, creator_id, creator_name) VALUES
(1, 1, '防晒衣测评：这件居然比遮阳伞还顶用？', '抖音', 'https://v.douyin.com/xxxxx1', '2026-06-01', 528600, 35200, 2890, 8900, 12600, 18500, 1260, 6.81, 252000.00, 1, '张小明'),
(1, 1, '防晒衣测评：这件居然比遮阳伞还顶用？', '视频号', 'https://xxxxx1', '2026-06-02', 186500, 15800, 1260, 4200, 6800, 7200, 520, 7.22, 104000.00, 1, '张小明'),
(1, 1, '防晒衣测评：这件居然比遮阳伞还顶用？', '快手', 'https://xxxxx1', '2026-06-02', 245800, 18200, 980, 5600, 7200, 9800, 680, 6.94, 136000.00, 1, '张小明'),
(2, 1, '防晒衣避坑指南：3个指标教你选对', '抖音', 'https://v.douyin.com/xxxxx2', '2026-06-05', 685200, 42300, 3680, 10200, 18900, 25600, 1850, 7.23, 370000.00, 1, '张小明'),
(2, 1, '防晒衣避坑指南：3个指标教你选对', 'B站', 'https://www.bilibili.com/video/xxxxx2', '2026-06-06', 125600, 12800, 1560, 2800, 5600, 6200, 480, 7.74, 96000.00, 1, '张小明'),
(3, 2, '618必买清单Top5，错过等一年！', '抖音', 'https://v.douyin.com/xxxxx3', '2026-06-10', 892300, 58600, 4560, 15600, 28900, 42800, 3560, 8.32, 712000.00, 1, '张小明'),
(3, 2, '618必买清单Top5，错过等一年！', '视频号', 'https://xxxxx3', '2026-06-10', 328500, 25800, 1890, 6800, 12800, 18500, 1620, 8.76, 324000.00, 1, '张小明'),
(4, 3, '入职第一天怎么穿？5天不重样方案', '小红书', 'https://xxxxx4', '2026-06-12', 156800, 18900, 2100, 3600, 15600, 8900, 560, 6.29, 112000.00, 2, '李小红'),
(4, 3, '入职第一天怎么穿？5天不重样方案', '抖音', 'https://v.douyin.com/xxxxx4', '2026-06-13', 289600, 21800, 1560, 5200, 8900, 12600, 820, 6.51, 164000.00, 2, '李小红');
