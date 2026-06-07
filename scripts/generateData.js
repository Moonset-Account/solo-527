import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const anchors = [
  { id: 'a001', name: '小美' },
  { id: 'a002', name: '阿杰' },
  { id: 'a003', name: '薇薇' },
  { id: 'a004', name: '大壮' },
  { id: 'a005', name: '晓晓' }
];

const products = [
  { id: 'p001', name: '保湿精华液', type: 'spot', price: 128, category: '美妆' },
  { id: 'p002', name: '限定口红礼盒', type: 'preorder', price: 299, category: '美妆' },
  { id: 'p003', name: '运动T恤', type: 'spot', price: 89, category: '服饰' },
  { id: 'p004', name: '设计师联名卫衣', type: 'preorder', price: 359, category: '服饰' },
  { id: 'p005', name: '零食大礼包', type: 'spot', price: 68, category: '食品' },
  { id: 'p006', name: '进口坚果礼盒', type: 'preorder', price: 168, category: '食品' },
  { id: 'p007', name: '无线蓝牙耳机', type: 'spot', price: 199, category: '数码' },
  { id: 'p008', name: '智能手环Pro', type: 'preorder', price: 499, category: '数码' },
  { id: 'p009', name: '家用扫地机器人', type: 'spot', price: 899, category: '家电' },
  { id: 'p010', name: '空气净化器', type: 'preorder', price: 1299, category: '家电' }
];

const activities = [
  { id: 'act001', name: '618大促' },
  { id: 'act002', name: '品牌日' },
  { id: 'act003', name: '新品首发' },
  { id: 'act004', name: '日常直播' }
];

const sources = ['推荐页', '关注页', '搜索', '分享', '其他'];
const timeSlots = ['00-02', '02-04', '04-06', '06-08', '08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];
const refundReasons = ['quality', 'description', 'size', 'price', 'delivery', 'damage', 'regret', 'other'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSessionData() {
  const sessions = [];
  let sessionId = 1;
  
  for (let day = 1; day <= 7; day++) {
    const date = `2024-06-${String(day).padStart(2, '0')}';
    for (const slot of timeSlots) {
      const baseViewers = slot >= '18-20' || slot >= '20-22' ? 5000 : slot >= '12-14' ? 3000 : 1000;
      const viewerCount = randomInt(baseViewers * 0.8, baseViewers * 1.2);
      
      for (let i = 0; i < viewerCount; i++) {
        const anchor = randomChoice(anchors);
        const product = randomChoice(products);
        const activity = randomChoice(activities);
        const source = randomChoice(sources);
        
        const hasInteraction = Math.random() < 0.35;
        const hasCartAdd = Math.random() < 0.15;
        const hasOrder = Math.random() < 0.08;
        const watchDuration = randomInt(10, 1800);
        
        let orderAmount = 0;
        let hasRefund = false;
        let refundAmount = 0;
        let refundReason = null;
        let isFulfilled = null;
        
        if (hasOrder) {
          const quantity = randomInt(1, 3);
          orderAmount = product.price * quantity;
          
          if (Math.random() < 0.12) {
            hasRefund = true;
            refundAmount = orderAmount * (Math.random() * 0.5 + 0.5);
            refundReason = randomChoice(refundReasons);
          }
          
          if (product.type === 'spot') {
            isFulfilled = Math.random() < 0.95;
          } else {
            isFulfilled = Math.random() < 0.85;
          }
        }
        
        sessions.push({
          session_id: `s${String(sessionId).padStart(8, '0')}`,
          user_id: `u${String(randomInt(1, 50000)).padStart(8, '0')}`,
          date,
          time_slot: slot,
          anchor_id: anchor.id,
          anchor_name: anchor.name,
          product_id: product.id,
          product_name: product.name,
          product_type: product.type,
          product_category: product.category,
          product_price: product.price,
          activity_id: activity.id,
          activity_name: activity.name,
          source_channel: source,
          watch_duration_seconds: watchDuration,
          has_interaction: hasInteraction ? 1 : 0,
          has_cart_add: hasCartAdd ? 1 : 0,
          has_order: hasOrder ? 1 : 0,
          order_amount: orderAmount,
          order_id: hasOrder ? `o${String(sessionId).padStart(8, '0')}' : null,
          has_refund: hasRefund ? 1 : 0,
          refund_amount: refundAmount,
          refund_reason: refundReason,
          is_fulfilled: isFulfilled
        });
        sessionId++;
      }
    }
  }
  return sessions;
}

function generatePresentationSlots() {
  const slots = [];
  let slotId = 1;
  
  for (let day = 1; day <= 7; day++) {
    const date = `2024-06-${String(day).padStart(2, '0')}';
    for (const anchor of anchors) {
      const presentationCount = randomInt(8, 15);
      for (let i = 0; i < presentationCount; i++) {
        const product = randomChoice(products);
        const source = randomChoice(sources);
        const startMinute = randomInt(0, 12 * 60);
        const duration = randomInt(180, 600);
        const viewersPeak = randomInt(500, 5000);
        const interactions = randomInt(50, 500);
        const cartAdds = randomInt(10, 200);
        const orders = randomInt(5, 100);
        const gmv = orders * product.price * randomInt(1, 3);
        
        slots.push({
          slot_id: `ps${String(slotId).padStart(8, '0')}`,
          date,
          anchor_id: anchor.id,
          anchor_name: anchor.name,
          product_id: product.id,
          product_name: product.name,
          product_type: product.type,
          source_channel: source,
          start_minute: startMinute,
          duration_seconds: duration,
          viewers_peak: viewersPeak,
          interaction_count: interactions,
          cart_add_count: cartAdds,
          order_count: orders,
          gmv: gmv
        });
        slotId++;
      }
    }
  }
  return slots;
}

console.log('生成直播间会话数据...');
const sessions = generateSessionData();
fs.writeFileSync(path.join(dataDir, 'raw_sessions.json'), JSON.stringify(sessions, null, 2));
console.log(`生成 ${sessions.length} 条会话记录`);

console.log('生成商品讲解时段数据...');
const presentationSlots = generatePresentationSlots();
fs.writeFileSync(path.join(dataDir, 'raw_presentation_slots.json'), JSON.stringify(presentationSlots, null, 2));
console.log(`生成 ${presentationSlots.length} 条讲解时段记录`);

console.log('数据生成完成！');
