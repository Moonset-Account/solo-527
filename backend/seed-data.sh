#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== 开始初始化测试数据 ==="

# 创建客户
echo "1. 创建客户..."
CUST1=$(curl -s -X POST $BASE_URL/customers -H "Content-Type: application/json" \
  -d '{"name":"张先生","phone":"13800138001","address":"北京市朝阳区朝阳路1号院","source":"朋友推荐","handler":"销售小王"}' | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   客户1 ID: $CUST1"

CUST2=$(curl -s -X POST $BASE_URL/customers -H "Content-Type: application/json" \
  -d '{"name":"李女士","phone":"13900139002","address":"北京市海淀区中关村大街2号","source":"线上广告","handler":"销售小李"}' | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   客户2 ID: $CUST2"

CUST3=$(curl -s -X POST $BASE_URL/customers -H "Content-Type: application/json" \
  -d '{"name":"王总","phone":"13700137003","address":"北京市西城区金融街3号","source":"老客户转介绍","handler":"销售小王"}' | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   客户3 ID: $CUST3"

# 创建项目
echo ""
echo "2. 创建项目..."
PROJ1=$(curl -s -X POST $BASE_URL/projects -H "Content-Type: application/json" \
  -d "{\"projectNo\":\"XZ2024001\",\"name\":\"朝阳路小区三居室装修\",\"status\":\"CONSTRUCTING\",\"totalPrice\":158000,\"startDate\":\"2024-03-01\",\"endDate\":\"2024-07-30\",\"customerId\":$CUST1,\"salesPerson\":\"销售小王\",\"projectManager\":\"张工\",\"handler\":\"销售小王\"}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   项目1 ID: $PROJ1"

PROJ2=$(curl -s -X POST $BASE_URL/projects -H "Content-Type: application/json" \
  -d "{\"projectNo\":\"XZ2024002\",\"name\":\"中关村两居室精装\",\"status\":\"DESIGNING\",\"totalPrice\":128000,\"startDate\":\"2024-04-15\",\"endDate\":\"2024-08-15\",\"customerId\":$CUST2,\"salesPerson\":\"销售小李\",\"projectManager\":\"李工\",\"handler\":\"销售小李\"}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   项目2 ID: $PROJ2"

PROJ3=$(curl -s -X POST $BASE_URL/projects -H "Content-Type: application/json" \
  -d "{\"projectNo\":\"XZ2024003\",\"name\":\"金融街大平层豪华装修\",\"status\":\"PENDING\",\"totalPrice\":580000,\"startDate\":\"2024-05-01\",\"endDate\":\"2024-12-31\",\"customerId\":$CUST3,\"salesPerson\":\"销售小王\",\"projectManager\":\"王工\",\"handler\":\"销售小王\"}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   项目3 ID: $PROJ3"

# 创建设计方案
echo ""
echo "3. 创建装修方案..."
curl -s -X POST $BASE_URL/design-plans -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"name\":\"现代简约风设计方案\",\"description\":\"三居室现代简约风格设计，注重实用性与舒适度\",\"estimatedPrice\":158000,\"status\":\"APPROVED\",\"handler\":\"设计师陈工\"}" > /dev/null
echo "   方案1创建完成"

curl -s -X POST $BASE_URL/design-plans -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"name\":\"北欧风设计方案(V2)\",\"description\":\"北欧风格优化版本，增加收纳空间\",\"estimatedPrice\":165000,\"status\":\"SUBMITTED\",\"handler\":\"设计师陈工\"}" > /dev/null
echo "   方案2创建完成"

curl -s -X POST $BASE_URL/design-plans -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ2,\"name\":\"日式原木风设计方案\",\"description\":\"两居室日式风格，温馨舒适\",\"estimatedPrice\":125000,\"status\":\"DRAFT\",\"handler\":\"设计师刘工\"}" > /dev/null
echo "   方案3创建完成"

# 创建合同
echo ""
echo "4. 创建合同..."
curl -s -X POST $BASE_URL/contracts -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"contractNo\":\"HT20240301001\",\"amount\":158000,\"signDate\":\"2024-03-01\",\"partyA\":\"张先生\",\"partyB\":\"装典装饰\",\"status\":\"SIGNED\",\"handler\":\"销售小王\"}" > /dev/null
echo "   合同1创建完成"

curl -s -X POST $BASE_URL/contracts -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ2,\"contractNo\":\"HT20240415002\",\"amount\":128000,\"signDate\":\"2024-04-15\",\"partyA\":\"李女士\",\"partyB\":\"装典装饰\",\"status\":\"DRAFT\",\"handler\":\"销售小李\"}" > /dev/null
echo "   合同2创建完成"

# 创建量房信息
echo ""
echo "5. 创建量房信息..."
curl -s -X POST $BASE_URL/house-surveys -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"surveyDate\":\"2024-02-25\",\"surveyor\":\"量房师老赵\",\"area\":120.5,\"layout\":\"三室两厅两卫\",\"floor\":15,\"orientation\":\"南北通透\",\"description\":\"主卧朝南，客厅采光好\",\"handler\":\"量房师老赵\"}" > /dev/null
echo "   量房1创建完成"

curl -s -X POST $BASE_URL/house-surveys -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ2,\"surveyDate\":\"2024-04-10\",\"surveyor\":\"量房师老赵\",\"area\":85.0,\"layout\":\"两室一厅一卫\",\"floor\":8,\"orientation\":\"东南\",\"description\":\"户型方正，得房率高\",\"handler\":\"量房师老赵\"}" > /dev/null
echo "   量房2创建完成"

# 创建施工阶段
echo ""
echo "6. 创建施工阶段..."
STAGE1=$(curl -s -X POST $BASE_URL/construction-stages -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"name\":\"拆除与新建\",\"order\":1,\"startDate\":\"2024-03-01\",\"endDate\":\"2024-03-15\",\"actualStartDate\":\"2024-03-01\",\"actualEndDate\":\"2024-03-18\",\"status\":\"COMPLETED\",\"description\":\"墙体拆除、新建墙体\",\"handler\":\"张工\"}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   阶段1 ID: $STAGE1"

STAGE2=$(curl -s -X POST $BASE_URL/construction-stages -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"name\":\"水电改造\",\"order\":2,\"startDate\":\"2024-03-16\",\"endDate\":\"2024-04-05\",\"actualStartDate\":\"2024-03-19\",\"status\":\"COMPLETED\",\"description\":\"水电线路改造、防水处理\",\"handler\":\"张工\"}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   阶段2 ID: $STAGE2"

STAGE3=$(curl -s -X POST $BASE_URL/construction-stages -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"name\":\"瓦工铺贴\",\"order\":3,\"startDate\":\"2024-04-06\",\"endDate\":\"2024-04-25\",\"actualStartDate\":\"2024-04-06\",\"status\":\"IN_PROGRESS\",\"description\":\"瓷砖铺贴、地面找平\",\"handler\":\"张工\"}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   阶段3 ID: $STAGE3"

curl -s -X POST $BASE_URL/construction-stages -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"name\":\"木工制作\",\"order\":4,\"startDate\":\"2024-04-26\",\"endDate\":\"2024-05-20\",\"status\":\"PENDING\",\"description\":\"吊顶、柜体制作\",\"handler\":\"张工\"}" > /dev/null
echo "   阶段4创建完成"

curl -s -X POST $BASE_URL/construction-stages -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"name\":\"油漆涂刷\",\"order\":5,\"startDate\":\"2024-05-21\",\"endDate\":\"2024-06-10\",\"status\":\"PENDING\",\"description\":\"墙面腻子、乳胶漆\",\"handler\":\"张工\"}" > /dev/null
echo "   阶段5创建完成"

curl -s -X POST $BASE_URL/construction-stages -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"name\":\"安装与收尾\",\"order\":6,\"startDate\":\"2024-06-11\",\"endDate\":\"2024-07-30\",\"status\":\"PENDING\",\"description\":\"橱柜、地板、洁具安装\",\"handler\":\"张工\"}" > /dev/null
echo "   阶段6创建完成"

# 创建节点照片
echo ""
echo "7. 创建节点照片..."
curl -s -X POST $BASE_URL/stage-photos -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"stageId\":$STAGE1,\"title\":\"拆除完成全景\",\"description\":\"墙体拆除完成现场\",\"photoUrl\":\"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800\",\"uploader\":\"张工\"}" > /dev/null
echo "   照片1创建完成"

curl -s -X POST $BASE_URL/stage-photos -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"stageId\":$STAGE1,\"title\":\"新建墙体\",\"description\":\"新建轻质隔墙\",\"photoUrl\":\"https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800\",\"uploader\":\"张工\"}" > /dev/null
echo "   照片2创建完成"

curl -s -X POST $BASE_URL/stage-photos -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"stageId\":$STAGE2,\"title\":\"水电布线\",\"description\":\"强弱电分离布线\",\"photoUrl\":\"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800\",\"uploader\":\"张工\"}" > /dev/null
echo "   照片3创建完成"

curl -s -X POST $BASE_URL/stage-photos -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"stageId\":$STAGE2,\"title\":\"防水处理\",\"description\":\"卫生间防水闭水试验\",\"photoUrl\":\"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800\",\"uploader\":\"张工\"}" > /dev/null
echo "   照片4创建完成"

# 创建客户反馈
echo ""
echo "8. 创建客户反馈..."
curl -s -X POST $BASE_URL/customer-feedbacks -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"content\":\"施工进度有点慢，希望能加快一些\",\"type\":\"COMPLAINT\",\"feedbackTime\":\"2024-04-10T10:30:00\",\"handler\":\"客服小陈\",\"reply\":\"已协调增加工人，确保按计划推进\",\"replyTime\":\"2024-04-10T14:20:00\",\"status\":\"PROCESSED\"}" > /dev/null
echo "   反馈1创建完成"

curl -s -X POST $BASE_URL/customer-feedbacks -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"content\":\"水电改造做得很规范，师傅很专业\",\"type\":\"PRAISE\",\"feedbackTime\":\"2024-04-20T09:15:00\",\"handler\":\"客服小陈\",\"status\":\"PROCESSED\"}" > /dev/null
echo "   反馈2创建完成"

curl -s -X POST $BASE_URL/customer-feedbacks -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ2,\"content\":\"希望能增加一些储物空间的设计\",\"type\":\"SUGGESTION\",\"feedbackTime\":\"2024-04-18T16:00:00\",\"handler\":\"客服小李\",\"status\":\"PENDING\"}" > /dev/null
echo "   反馈3创建完成"

# 创建延期提醒
echo ""
echo "9. 创建延期提醒..."
curl -s -X POST $BASE_URL/delay-reminders -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"stageId\":$STAGE1,\"reason\":\"春节假期影响\",\"days\":3,\"remindTime\":\"2024-03-16T09:00:00\",\"handler\":\"张工\",\"status\":\"RESOLVED\"}" > /dev/null
echo "   提醒1创建完成"

# 创建巡检任务
echo ""
echo "10. 创建巡检任务..."
curl -s -X POST $BASE_URL/inspection-tasks -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"stageId\":$STAGE1,\"title\":\"拆除工程验收\",\"planDate\":\"2024-03-15\",\"inspector\":\"质检王工\",\"actualDate\":\"2024-03-15\",\"result\":\"PASS\",\"status\":\"COMPLETED\",\"handler\":\"质检王工\"}" > /dev/null
echo "   巡检1创建完成"

curl -s -X POST $BASE_URL/inspection-tasks -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"stageId\":$STAGE2,\"title\":\"水电改造验收\",\"planDate\":\"2024-04-05\",\"inspector\":\"质检王工\",\"actualDate\":\"2024-04-06\",\"result\":\"FAIL\",\"issues\":\"卫生间防水高度不够，需要补做\",\"rectificationDeadline\":\"2024-04-10\",\"status\":\"COMPLETED\",\"handler\":\"质检王工\"}" > /dev/null
echo "   巡检2创建完成(不合格)"

curl -s -X POST $BASE_URL/inspection-tasks -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"stageId\":$STAGE3,\"title\":\"瓦工中期巡检\",\"planDate\":\"2024-04-20\",\"inspector\":\"质检王工\",\"status\":\"PENDING\",\"handler\":\"质检王工\"}" > /dev/null
echo "   巡检3创建完成"

# 创建售后报修
echo ""
echo "11. 创建售后报修..."
curl -s -X POST $BASE_URL/after-sales -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"title\":\"卫生间水龙头漏水\",\"description\":\"主卫水龙头接口处渗水\",\"reportTime\":\"2024-05-10T08:30:00\",\"reporter\":\"张先生\",\"type\":\"REPAIR\",\"handler\":\"售后老刘\",\"solution\":\"已更换密封圈，问题解决\",\"cost\":0,\"status\":\"COMPLETED\"}" > /dev/null
echo "   售后1创建完成"

curl -s -X POST $BASE_URL/after-sales -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ2,\"title\":\"咨询装修流程\",\"description\":\"想了解一下装修的具体流程和时间安排\",\"reportTime\":\"2024-04-16T14:00:00\",\"reporter\":\"李女士\",\"type\":\"CONSULT\",\"handler\":\"销售小李\",\"status\":\"PROCESSING\"}" > /dev/null
echo "   售后2创建完成"

# 创建材料成本
echo ""
echo "12. 创建材料成本..."
curl -s -X POST $BASE_URL/material-costs -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"materialName\":\"PPR水管\",\"specification\":\"25mm\",\"quantity\":100,\"unit\":\"米\",\"unitPrice\":15.5,\"totalPrice\":1550,\"supplier\":\"伟星管业\",\"purchaseDate\":\"2024-03-10\",\"handler\":\"材料员小张\"}" > /dev/null
echo "   材料1创建完成"

curl -s -X POST $BASE_URL/material-costs -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"materialName\":\"电线\",\"specification\":\"2.5平方\",\"quantity\":200,\"unit\":\"米\",\"unitPrice\":3.8,\"totalPrice\":760,\"supplier\":\"昆仑电线\",\"purchaseDate\":\"2024-03-10\",\"handler\":\"材料员小张\"}" > /dev/null
echo "   材料2创建完成"

curl -s -X POST $BASE_URL/material-costs -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"materialName\":\"瓷砖\",\"specification\":\"800x800mm\",\"quantity\":150,\"unit\":\"片\",\"unitPrice\":128,\"totalPrice\":19200,\"supplier\":\"东鹏瓷砖\",\"purchaseDate\":\"2024-04-01\",\"handler\":\"材料员小张\"}" > /dev/null
echo "   材料3创建完成"

curl -s -X POST $BASE_URL/material-costs -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"materialName\":\"防水涂料\",\"specification\":\"JS聚合物\",\"quantity\":20,\"unit\":\"桶\",\"unitPrice\":280,\"totalPrice\":5600,\"supplier\":\"东方雨虹\",\"purchaseDate\":\"2024-03-25\",\"handler\":\"材料员小张\"}" > /dev/null
echo "   材料4创建完成"

curl -s -X POST $BASE_URL/material-costs -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ1,\"materialName\":\"石膏板\",\"specification\":\"1220x2440mm\",\"quantity\":50,\"unit\":\"张\",\"unitPrice\":45,\"totalPrice\":2250,\"supplier\":\"龙牌建材\",\"purchaseDate\":\"2024-04-25\",\"handler\":\"材料员小张\"}" > /dev/null
echo "   材料5创建完成"

curl -s -X POST $BASE_URL/material-costs -H "Content-Type: application/json" \
  -d "{\"projectId\":$PROJ2,\"materialName\":\"木地板\",\"specification\":\"12mm强化复合\",\"quantity\":85,\"unit\":\"平米\",\"unitPrice\":158,\"totalPrice\":13430,\"supplier\":\"圣象地板\",\"purchaseDate\":\"2024-05-10\",\"handler\":\"材料员小张\"}" > /dev/null
echo "   材料6创建完成"

echo ""
echo "=== 测试数据初始化完成 ==="
echo "客户: 3个"
echo "项目: 3个"
echo "方案: 3个"
echo "合同: 2个"
echo "量房: 2个"
echo "施工阶段: 6个"
echo "节点照片: 4张"
echo "客户反馈: 3条"
echo "延期提醒: 1条"
echo "巡检任务: 3个"
echo "售后报修: 2条"
echo "材料成本: 6条"
