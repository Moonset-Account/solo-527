import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.example') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';

const projects = [
  { name: '中央商务区超高层综合体项目', code: 'PRJ-CBD-2025-001', dept: '项目部A' },
  { name: '滨江新城住宅小区一期', code: 'PRJ-BJ-2025-002', dept: '项目部B' },
  { name: '科技园智能办公楼', code: 'PRJ-KJY-2025-003', dept: '项目部A' },
  { name: '地铁5号线站点配套工程', code: 'PRJ-DT5-2025-004', dept: '基建部' },
  { name: '市立医院东院区扩建', code: 'PRJ-YLY-2025-005', dept: '项目部C' },
];

const materials = [
  { name: '螺纹钢筋', category: 'steel', specs: ['HRB400 Φ12mm', 'HRB400 Φ16mm', 'HRB400 Φ20mm', 'HRB400 Φ25mm'], units: ['吨'], prices: [4200, 4500, 4800] },
  { name: '普通硅酸盐水泥', category: 'cement', specs: ['P.O 42.5', 'P.O 52.5'], units: ['吨'], prices: [380, 450, 520] },
  { name: '商品混凝土', category: 'concrete', specs: ['C30', 'C35', 'C40', 'C50'], units: ['立方米'], prices: [380, 420, 480, 580] },
  { name: '方木', category: 'wood', specs: ['50×100×4000mm', '40×80×3000mm'], units: ['立方米'], prices: [1650, 1800] },
  { name: '铜芯电力电缆', category: 'electrical', specs: ['YJV-4×25+1×16', 'YJV-4×50+1×25'], units: ['米'], prices: [125, 220] },
  { name: 'PPR给水管', category: 'plumbing', specs: ['DN25 S5', 'DN32 S5'], units: ['米'], prices: [12, 18] },
  { name: '岩棉保温板', category: 'insulation', specs: ['100kg/m³ 50mm', '120kg/m³ 80mm'], units: ['平方米'], prices: [45, 78] },
];

const supplierNames = [
  { name: '华东钢铁集团有限公司', shortName: '华东钢铁', categories: ['钢材', '金属材料'] },
  { name: '南方水泥股份有限公司', shortName: '南方水泥', categories: ['水泥', '混凝土'] },
  { name: '建华建材科技集团', shortName: '建华建材', categories: ['混凝土', '预制构件'] },
  { name: '林木宝木材加工', shortName: '林木宝', categories: ['木材', '板材'] },
  { name: '远东电缆有限公司', shortName: '远东电缆', categories: ['电气材料'] },
  { name: '联塑管道科技', shortName: '联塑管道', categories: ['给排水', '五金配件'] },
  { name: '华美节能科技集团', shortName: '华美节能', categories: ['保温材料', '装饰材料'] },
  { name: '宝钢建筑材料综合供应', shortName: '宝钢建材', categories: ['钢材', '五金配件', '机械设备'] },
];

const managers = [
  { id: 'pm-001', name: '张建国', dept: '项目部A' },
  { id: 'pm-002', name: '李明辉', dept: '项目部B' },
  { id: 'pm-003', name: '王志强', dept: '基建部' },
  { id: 'pm-004', name: '陈海涛', dept: '项目部C' },
];

function randomDate(startDays: number, endDays: number): Date {
  const now = Date.now();
  return new Date(now + (Math.random() * (endDays - startDays) + startDays) * 24 * 60 * 60 * 1000);
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
  }
  console.log('🗑️  Cleared existing data');

  const now = new Date();
  const purchaseRequestIds: string[] = [];
  const supplierIds: string[] = [];
  const prCodes: string[] = [];
  const quoteCodes: string[] = [];

  console.log('👥 Inserting suppliers...');
  for (let i = 0; i < supplierNames.length; i++) {
    const s = supplierNames[i];
    const qualFiles = [];
    const qualCount = randomInt(2, 4);
    for (let j = 0; j < qualCount; j++) {
      const issueDate = new Date(now.getTime() - randomInt(0, 365) * 24 * 3600 * 1000);
      const expiryDate = new Date(issueDate.getTime() + (365 + randomInt(0, 730)) * 24 * 3600 * 1000);
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      qualFiles.push({
        id: nanoid(12),
        name: j === 0 ? '营业执照' : j === 1 ? '资质证书' : j === 2 ? '安全生产许可证' : 'ISO质量认证',
        type: j === 0 ? '三证合一' : j === 1 ? '资质证书' : '许可证',
        issueDate,
        expiryDate,
        status: daysLeft < 0 ? 'expired' : daysLeft < 60 ? 'expiring' : 'valid',
        attachmentId: nanoid(10)
      });
    }
    const hasExpired = qualFiles.some(q => q.status === 'expired');
    const hasExpiring = qualFiles.some(q => q.status === 'expiring');

    const id = nanoid(16);
    supplierIds.push(id);

    await db.collection('suppliers').insertOne({
      id,
      code: `SUP-${String(i + 1).padStart(4, '0')}-${nanoid(4).toUpperCase()}`,
      name: s.name,
      shortName: s.shortName,
      category: s.categories,
      businessLicense: `91310${randomInt(100000, 999999)}${randomInt(100000, 999999)}X`,
      contactPerson: {
        name: ['王经理', '李总', '张总监', '陈主管', '刘主任'][randomInt(0, 4)],
        title: ['销售经理', '商务总监', '客户经理', '区域主管'][randomInt(0, 3)],
        phone: `1${randomInt(3, 9)}${randomInt(100000000, 999999999)}`,
        email: `contact${i + 1}@supplier${i + 1}.com`,
      },
      address: `上海市${['浦东新区', '闵行区', '宝山区', '嘉定区', '青浦区'][randomInt(0, 4)]}XX路${randomInt(100, 9999)}号`,
      bankAccount: '',
      qualifications: qualFiles,
      qualificationStatus: hasExpired ? 'expired' : hasExpiring ? 'warning' : 'qualified',
      rating: randomInt(3, 5),
      tags: ['战略合作', '优质供应商', '本地供应商', '上市公司'].slice(0, randomInt(1, 3)),
      registeredAt: randomDate(-365, -30),
      createdAt: randomDate(-365, -30),
      updatedAt: now,
    });
  }

  console.log('📋 Inserting purchase requests...');
  for (let i = 0; i < 12; i++) {
    const proj = projects[i % projects.length];
    const manager = managers[i % managers.length];
    const prId = nanoid(16);
    purchaseRequestIds.push(prId);

    const itemCount = randomInt(3, 7);
    const items: any[] = [];
    const usedMaterials = new Set<number>();
    for (let j = 0; j < itemCount; j++) {
      let mIdx: number;
      do {
        mIdx = randomInt(0, materials.length - 1);
      } while (usedMaterials.has(mIdx) && usedMaterials.size < materials.length);
      usedMaterials.add(mIdx);

      const m = materials[mIdx];
      const spec = randomItem(m.specs);
      const price = randomItem(m.prices);
      const qty = randomInt(10, 500);

      items.push({
        id: nanoid(12),
        name: m.name,
        code: `MAT-${String(mIdx + 1).padStart(3, '0')}`,
        category: m.category,
        specification: spec,
        unit: randomItem(m.units),
        quantity: qty,
        budgetPrice: price * (0.95 + Math.random() * 0.15),
        remark: Math.random() > 0.7 ? '国标产品，需提供质量保证书' : ''
      });
    }

    const totalAmount = items.reduce((s, it) => s + (it.budgetPrice || 0) * it.quantity, 0);
    const statuses = ['draft', 'submitted', 'quoting', 'comparing', 'approved', 'completed'];
    const status = statuses[i % statuses.length];
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate() - i).padStart(2, '0')}`;
    const code = `PR-${ymd}-${nanoid(6).toUpperCase()}`;
    prCodes.push(code);

    await db.collection('purchaserequests').insertOne({
      id: prId,
      code,
      projectName: proj.name,
      projectCode: proj.code,
      projectManagerId: manager.id,
      projectManagerName: manager.name,
      department: proj.dept,
      items,
      attachments: i % 3 === 0 ? [{
        id: nanoid(12),
        filename: `attachment-${nanoid(8)}.pdf`,
        originalName: ['采购需求附件.pdf', '技术规范书.pdf', '施工图纸.dwg.pdf'][i % 3],
        mimeType: 'application/pdf',
        size: randomInt(100000, 2000000),
        url: `/uploads/fake-${i}.pdf`,
        uploadedBy: manager.id,
        uploadedAt: randomDate(-i * 5, -1)
      }] : [],
      requiredDate: randomDate(10, 60),
      description: `${proj.name}第${randomInt(1, 5)}批次材料采购，需确保到场时间与施工进度匹配。\n质量要求：全部材料需符合国家现行标准，提供出厂合格证及检测报告。`,
      status,
      currentQuoteCount: status === 'draft' ? 0 : randomInt(2, 5),
      totalAmount: Math.round(totalAmount * 100) / 100,
      submittedAt: status !== 'draft' ? randomDate(-i * 5, -1) : null,
      createdAt: randomDate(-i * 7, -1),
      updatedAt: now,
    });
  }

  console.log('💰 Inserting quotes...');
  for (let p = 0; p < purchaseRequestIds.length; p++) {
    const prData = await db.collection('purchaserequests').findOne({ id: purchaseRequestIds[p] });
    if (!prData) continue;

    const usedSuppliers = new Set<number>();
    for (let q = 0; q < (prData.status === 'draft' ? 0 : prData.currentQuoteCount || 3); q++) {
      let sIdx: number;
      do {
        sIdx = randomInt(0, supplierNames.length - 1);
      } while (usedSuppliers.has(sIdx) && usedSuppliers.size < supplierNames.length);
      usedSuppliers.add(sIdx);

      const supplier = supplierNames[sIdx];
      const supplierData = await db.collection('suppliers').findOne({ shortName: supplier.shortName });
      if (!supplierData) continue;

      const quoteItems = prData.items.map((item: any) => {
        const variation = 0.85 + Math.random() * 0.35;
        const unitPrice = Math.round(item.budgetPrice * variation * 100) / 100;
        return {
          materialItemId: item.id,
          name: item.name,
          specification: item.specification,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice,
          subtotal: Math.round(unitPrice * item.quantity * 100) / 100,
          deliveryDate: randomDate(5, 30),
          remark: Math.random() > 0.85 ? '现货充足，可分批次供货' : ''
        };
      });

      const totalAmount = quoteItems.reduce((s: number, it: any) => s + it.subtotal, 0);
      const taxRate = 0.13;
      const taxAmount = Math.round(totalAmount * taxRate * 100) / 100;

      const statusList = ['submitted', 'reviewing', 'selected', 'rejected'];
      const quoteStatus = q === 0 && prData.status === 'completed' ? 'selected'
        : q < 3 && prData.status !== 'draft' ? 'submitted'
        : statusList[q % statusList.length];

      const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate() - p).padStart(2, '0')}`;
      const qcode = `QT-${ymd}-${nanoid(6).toUpperCase()}`;
      quoteCodes.push(qcode);

      const quoteId = nanoid(16);

      await db.collection('quotes').insertOne({
        id: quoteId,
        code: qcode,
        purchaseRequestId: prData.id,
        supplierId: supplierData.id,
        supplierName: supplier.name,
        items: quoteItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
        taxRate,
        taxAmount,
        totalWithTax: Math.round((totalAmount + taxAmount) * 100) / 100,
        paymentTerms: ['货到验收合格后30天付款', '预付30%，货到验收合格后60天付清余款', '月结60天'][q % 3],
        deliveryTerms: ['供方送货至项目工地，含卸车', '供方送货到现场，需方卸车', '需方自提'][q % 3],
        warranty: '质保期按国家相关规定执行，质保期内免费更换缺陷产品',
        attachments: q % 2 === 0 ? [{
          id: nanoid(12),
          filename: `quote-${nanoid(8)}.pdf`,
          originalName: `报价单-盖章版.pdf`,
          mimeType: 'application/pdf',
          size: randomInt(500000, 3000000),
          url: `/uploads/quote-${p}-${q}.pdf`,
          uploadedBy: supplierData.id,
          uploadedAt: randomDate(-p * 3 - q, -1)
        }] : [],
        remark: q % 4 === 0 ? '本报价有效期内如遇原材料价格大幅波动，我司保留调价权利' : '',
        status: quoteStatus,
        validityDate: randomDate(20, 60),
        submittedBy: supplierData.id,
        submittedAt: randomDate(-p * 3 - q, -1),
        reviewedAt: prData.status !== 'quoting' && prData.status !== 'submitted' ? randomDate(-p, -1) : null,
        createdAt: randomDate(-p * 3 - q, -1),
        updatedAt: now,
      });

      for (const it of quoteItems) {
        await db.collection('pricehistories').insertOne({
          id: nanoid(16),
          materialName: it.name,
          specification: it.specification,
          category: 'other',
          supplierId: supplierData.id,
          supplierName: supplier.name,
          unitPrice: it.unitPrice,
          unit: it.unit,
          quantity: it.quantity,
          quoteId,
          agreementId: null,
          effectiveDate: randomDate(-p * 3 - q, -1),
          createdAt: now,
        });
      }
    }
  }

  console.log('📄 Inserting framework agreements...');
  for (let i = 0; i < 5; i++) {
    const sIdx = i;
    const supplier = supplierNames[sIdx];
    const supplierData = await db.collection('suppliers').findOne({ shortName: supplier.shortName });
    if (!supplierData) continue;

    const m = materials[i % materials.length];
    const items = m.specs.slice(0, 2).map((spec, j) => ({
      materialCode: `FA-${String(i + 1).padStart(3, '0')}-${j + 1}`,
      name: m.name,
      specification: spec,
      unit: randomItem(m.units),
      unitPrice: Math.round(m.prices[j % m.prices.length] * 0.92 * 100) / 100,
      minQuantity: 100,
      maxQuantity: 5000,
    }));

    const startDate = randomDate(-180, -30);
    const endDate = new Date(startDate.getTime() + 365 * 24 * 3600 * 1000);

    await db.collection('frameworkagreements').insertOne({
      id: nanoid(16),
      code: `FA-${now.getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      name: `${supplier.shortName}${m.name}年度框架协议-${now.getFullYear()}`,
      supplierId: supplierData.id,
      supplierName: supplier.name,
      items,
      startDate,
      endDate,
      totalAmount: Math.round(items.reduce((s, it) => s + it.unitPrice * (it.maxQuantity || 1000), 0) * 100) / 100,
      status: endDate < now ? 'expired' : 'active',
      attachments: [{
        id: nanoid(12),
        filename: `agreement-${nanoid(8)}.pdf`,
        originalName: `框架协议-盖章扫描件.pdf`,
        mimeType: 'application/pdf',
        size: randomInt(1000000, 5000000),
        url: `/uploads/agreement-${i}.pdf`,
        uploadedBy: 'admin-001',
        uploadedAt: startDate
      }],
      terms: `1. 本协议有效期一年，到期如双方无异议自动延续。\n2. 价格锁定：协议期内价格保持不变，遇重大政策调整双方协商。\n3. 交货：接到订单后72小时内送达指定地点。\n4. 付款：月结60天，银行承兑汇票。`,
      createdAt: startDate,
      updatedAt: now,
    });
  }

  console.log('🔔 Inserting qualification alerts...');
  const allSuppliers = await db.collection('suppliers').find().toArray();
  let alertIndex = 0;
  for (const supplier of allSuppliers) {
    for (const qual of supplier.qualifications) {
      const daysLeft = Math.ceil((new Date(qual.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) {
        alertIndex++;
        const issueType = daysLeft <= 0 ? 'expired' : 'expiring';
        const isResolved = Math.random() > 0.6;
        const isAssigned = isResolved || Math.random() > 0.4;
        const createdAt = randomDate(-60, -1);
        const respondedAt = isAssigned ? new Date(createdAt.getTime() + randomInt(1, 24) * 3600 * 1000) : null;
        const resolvedAt = isResolved ? (respondedAt ? new Date(respondedAt.getTime() + randomInt(2, 72) * 3600 * 1000) : null) : null;
        const durationHours = resolvedAt && respondedAt
          ? Math.round((resolvedAt.getTime() - respondedAt.getTime()) / (3600 * 1000) * 10) / 10
          : 0;

        const alertId = nanoid(16);
        const alertStatus = isResolved ? 'resolved' : isAssigned ? 'processing' : 'pending';
        const coordinator = ['陈协同员', '林助理', '吴专员'][randomInt(0, 2)];

        await db.collection('qualificationalerts').insertOne({
          id: alertId,
          supplierId: supplier.id,
          supplierName: supplier.name,
          qualificationName: qual.name,
          issueType,
          expiryDate: qual.expiryDate,
          daysLeft: Math.floor(daysLeft),
          status: alertStatus,
          assigneeId: isAssigned ? `coord-${String(randomInt(1, 5)).padStart(3, '0')}` : null,
          assigneeName: isAssigned ? coordinator : null,
          resolution: isResolved ? `供应商已重新提交最新的${qual.name}扫描件，经审核有效期延长至2026年，合规有效。` : null,
          createdAt,
          respondedAt,
          resolvedAt,
          approvalDurationHours: isResolved ? durationHours : null,
          updatedAt: now,
        });

        if (isResolved && resolvedAt && respondedAt) {
          await db.collection('approvalboarditems').insertOne({
            id: nanoid(16),
            alertId,
            supplierId: supplier.id,
            supplierName: supplier.name,
            qualificationName: qual.name,
            issueType,
            assigneeId: `coord-${String(randomInt(1, 5)).padStart(3, '0')}`,
            assigneeName: coordinator,
            status: 'approved',
            receivedAt: respondedAt,
            processedAt: resolvedAt,
            durationHours,
            remark: `供应商已更新资质文件，审批通过`,
            createdAt: respondedAt,
            updatedAt: now,
          });
        }
      }
    }
  }

  console.log('📝 Inserting change history...');
  const first3PRs = purchaseRequestIds.slice(0, 3);
  const prEntities = await db.collection('purchaserequests').find({ id: { $in: first3PRs } }).toArray();
  for (const pr of prEntities) {
    const originalStatus = 'draft';
    const targetStatus = pr.status;

    if (originalStatus !== targetStatus) {
      await db.collection('changehistories').insertOne({
        id: nanoid(16),
        entityId: pr.id,
        entityType: 'purchase_request',
        entityCode: pr.code,
        changes: [{
          field: 'status',
          fieldLabel: '采购状态',
          oldValue: originalStatus,
          newValue: targetStatus,
          type: 'primitive'
        }, {
          field: 'submittedAt',
          fieldLabel: '提交时间',
          oldValue: null,
          newValue: pr.submittedAt,
          type: 'primitive'
        }],
        changedBy: pr.projectManagerId,
        changedByName: pr.projectManagerName,
        changeReason: '确认采购需求无误，提交审批进入询价流程',
        createdAt: pr.submittedAt || randomDate(-10, -1),
      });
    }

    if (pr.totalAmount > 100000) {
      const originalTotal = Math.round(pr.totalAmount * 0.9 * 100) / 100;
      await db.collection('changehistories').insertOne({
        id: nanoid(16),
        entityId: pr.id,
        entityType: 'purchase_request',
        entityCode: pr.code,
        changes: [{
          field: 'totalAmount',
          fieldLabel: '总金额',
          oldValue: originalTotal,
          newValue: pr.totalAmount,
          type: 'primitive'
        }, {
          field: 'items.0.budgetPrice',
          fieldLabel: '采购数量',
          oldValue: Math.round(pr.items[0].budgetPrice * 0.9 * 100) / 100,
          newValue: pr.items[0].budgetPrice,
          type: 'primitive'
        }],
        changedBy: pr.projectManagerId,
        changedByName: pr.projectManagerName,
        changeReason: '根据设计变更通知单调整工程材料数量及预算',
        createdAt: randomDate(-7, -1),
      });
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('   📋 Purchase Requests:', purchaseRequestIds.length);
  console.log('   🏢 Suppliers:', supplierNames.length);
  console.log('   💰 Quotes generated:', quoteCodes.length);
  console.log('   🔔 Qualification alerts:', alertIndex);
  console.log('   📝 Change history records added\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
