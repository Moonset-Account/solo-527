import { hashUserId } from "@/lib/privacy";

const PRODUCTS = [
  { sku: "SKU001", name: "无线蓝牙耳机 Pro", category: "数码配件" },
  { sku: "SKU002", name: "智能手表 S5", category: "智能穿戴" },
  { sku: "SKU003", name: "超薄笔记本支架", category: "电脑配件" },
  { sku: "SKU004", name: "机械键盘 RGB 版", category: "电脑配件" },
  { sku: "SKU005", name: "人体工学办公椅", category: "办公家具" },
  { sku: "SKU006", name: "便携充电宝 20000mAh", category: "数码配件" },
  { sku: "SKU007", name: "4K 高清摄像头", category: "数码配件" },
  { sku: "SKU008", name: "无线充电器 15W", category: "数码配件" },
  { sku: "SKU009", name: "降噪头戴式耳机", category: "数码配件" },
  { sku: "SKU010", name: "智能台灯护眼版", category: "智能家居" },
];

const STORES = [
  { id: "STORE001", name: "官方旗舰店" },
  { id: "STORE002", name: "京东自营店" },
  { id: "STORE003", name: "天猫专营店" },
  { id: "STORE004", name: "拼多多旗舰店" },
];

const WAREHOUSES = [
  { id: "WH001", name: "华东仓（上海）" },
  { id: "WH002", name: "华南仓（广州）" },
  { id: "WH003", name: "华北仓（北京）" },
  { id: "WH004", name: "西南仓（成都）" },
];

const LOGISTICS = [
  { id: "SF", name: "顺丰速运" },
  { id: "JD", name: "京东物流" },
  { id: "ZT", name: "中通快递" },
  { id: "YT", name: "圆通速递" },
];

const REASON_TREE = {
  "商品质量": ["做工瑕疵", "材质与描述不符", "功能故障", "包装破损"],
  "物流问题": ["配送延迟", "包裹损坏", "发错货", "漏发商品"],
  "用户原因": ["拍错/多拍", "不想要了", "尺寸不合适", "个人原因"],
  "描述不符": ["色差问题", "款式不符", "功能描述不实", "规格不符"],
  "客服问题": ["客服态度差", "响应不及时", "售后处理慢"],
};

const QUALITY_RESULTS = ["通过", "有瑕疵", "人为损坏", "无法检测"];

const AGENTS = ["KF001", "KF002", "KF003", "KF004", "KF005", "KF006", "KF007", "KF008"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export function generateMockRecords(count = 500, daysBack = 30) {
  const records = [];
  const now = new Date();
  const userCounts = new Map<string, number>();

  for (let i = 0; i < count; i++) {
    const product = randomChoice(PRODUCTS);
    const store = randomChoice(STORES);
    const warehouse = randomChoice(WAREHOUSES);
    const logistics = randomChoice(LOGISTICS);
    const reasonCategory = randomChoice(Object.keys(REASON_TREE));
    const reasonDetail = randomChoice(REASON_TREE[reasonCategory as keyof typeof REASON_TREE]);

    const daysAgo = randomInt(0, daysBack);
    const applyDate = new Date(now);
    applyDate.setDate(applyDate.getDate() - daysAgo);
    applyDate.setHours(randomInt(9, 20), randomInt(0, 59), 0, 0);

    const qualityHours = randomInt(4, 72);
    const qualityDate = new Date(applyDate);
    qualityDate.setHours(qualityDate.getHours() + qualityHours);

    const refundHours = randomInt(2, 120);
    const refundDate = new Date(qualityDate);
    refundDate.setHours(refundDate.getHours() + refundHours);

    const serviceMinutes = randomInt(5, 480);
    const rawUserId = `user_${randomInt(1, 200)}`;
    const userHash = hashUserId(rawUserId);

    userCounts.set(userHash, (userCounts.get(userHash) || 0) + 1);

    records.push({
      returnId: `RT${String(100000 + i).padStart(6, "0")}`,
      orderId: `ORD${String(randomInt(100000, 999999))}`,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      store: store.name,
      storeId: store.id,
      reason: reasonCategory,
      reasonDetail: reasonDetail,
      warehouse: warehouse.name,
      warehouseId: warehouse.id,
      logistics: logistics.name,
      logisticsId: logistics.id,
      applyTime: formatDate(applyDate),
      qualityTime: formatDate(qualityDate),
      refundTime: formatDate(refundDate),
      refundCycle: Number(
        ((refundDate.getTime() - applyDate.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)
      ),
      serviceHandleTime: serviceMinutes,
      agentId: randomChoice(AGENTS),
      customerRemark: Math.random() > 0.5 ? "客户要求尽快处理" : "",
      userHash: userHash,
      qualityResult: randomChoice(QUALITY_RESULTS),
    });
  }

  const repeatUsers = new Set<string>();
  for (const [hash, count] of Array.from(userCounts.entries())) {
    if (count >= 3) repeatUsers.add(hash);
  }

  return records.map((r) => ({
    ...r,
    isRepeatUser: repeatUsers.has(r.userHash),
  }));
}

export const MOCK_OPTIONS = {
  products: PRODUCTS.map((p) => ({ id: p.sku, name: p.name, category: p.category })),
  stores: STORES,
  reasons: Object.entries(REASON_TREE).flatMap(([cat, details]) =>
    details.map((d) => ({ id: `${cat}:${d}`, name: d, category: cat }))
  ),
  warehouses: WAREHOUSES,
  logistics: LOGISTICS,
};

export const DATA_DEFINITIONS = [
  { field: "退货率", definition: "退货单数量 / 订单数量 × 100%", source: "订单表 + 退货申请表" },
  { field: "退款周期", definition: "从退货申请提交到退款完成的天数", source: "退货申请 + 退款表" },
  { field: "客服处理时长", definition: "客服首次响应到结案的分钟数", source: "客服备注表" },
  { field: "重复退货用户", definition: "同一用户退货次数 ≥ 3次（用户ID已脱敏）", source: "退货申请表" },
  { field: "P90 退款周期", definition: "所有退款周期按升序排列后第90百分位值", source: "退款周期明细" },
];
