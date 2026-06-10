import { nanoid } from 'nanoid';
import { QuoteModel } from '../models/Quote.js';
import { PurchaseRequestModel } from '../models/PurchaseRequest.js';
import { PriceHistoryModel } from '../models/PriceHistory.js';
import { 
  Quote, 
  QuoteItem, 
  QuoteStatus, 
  PriceHistory,
  PriceFluctuation,
  ApiResponse,
  MaterialCategory
} from '@app/shared';
import { createChangeHistory, getChangeHistory } from './changeTracker.js';
import { getRedisClient, CACHE_KEYS, CACHE_TTL, NOTIFICATION_CHANNELS } from '../config/redis.js';

function generateQuoteCode(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `QT-${ymd}-${nanoid(6).toUpperCase()}`;
}

export async function createQuote(
  data: Partial<Quote>,
  userId: string,
  userName: string
): Promise<ApiResponse<Quote>> {
  try {
    const code = generateQuoteCode();
    const items: QuoteItem[] = (data.items || []).map(item => ({
      ...item,
      subtotal: item.unitPrice * item.quantity
    }));
    
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxRate = data.taxRate || 0;
    const taxAmount = totalAmount * taxRate;
    const totalWithTax = totalAmount + taxAmount;

    const validityDate = data.validityDate || 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const quote = await QuoteModel.create({
      id: nanoid(16),
      code,
      purchaseRequestId: data.purchaseRequestId,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      items,
      totalAmount,
      taxRate,
      taxAmount,
      totalWithTax,
      paymentTerms: data.paymentTerms,
      deliveryTerms: data.deliveryTerms,
      warranty: data.warranty,
      attachments: data.attachments || [],
      remark: data.remark,
      status: 'submitted' as QuoteStatus,
      validityDate,
      submittedBy: userId,
    });

    if (data.purchaseRequestId) {
      const pr = await PurchaseRequestModel.findOne({ 
        $or: [{ id: data.purchaseRequestId }, { _id: data.purchaseRequestId }] 
      });
      if (pr) {
        pr.currentQuoteCount = (pr.currentQuoteCount || 0) + 1;
        if (pr.status === 'submitted') {
          pr.status = 'quoting';
        }
        await pr.save();
      }
    }

    await savePriceHistory(quote.toObject() as Quote);
    await detectPriceFluctuation(quote.toObject() as Quote);
    
    const redis = getRedisClient();
    redis.publish(
      NOTIFICATION_CHANNELS.QUOTE_SUBMITTED,
      JSON.stringify({ quoteId: quote.id, code, purchaseRequestId: data.purchaseRequestId })
    );

    return {
      success: true,
      data: quote.toObject() as Quote,
      message: '报价已提交'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建报价失败'
    };
  }
}

async function savePriceHistory(quote: Quote): Promise<void> {
  const records: Partial<PriceHistory>[] = quote.items.map(item => ({
    id: nanoid(16),
    materialName: item.name,
    specification: item.specification,
    category: 'other' as MaterialCategory,
    supplierId: quote.supplierId,
    supplierName: quote.supplierName,
    unitPrice: item.unitPrice,
    unit: item.unit,
    quantity: item.quantity,
    quoteId: quote.id,
    effectiveDate: quote.submittedAt || new Date()
  }));

  await PriceHistoryModel.insertMany(records);
}

async function detectPriceFluctuation(quote: Quote): Promise<PriceFluctuation[]> {
  const fluctuations: PriceFluctuation[] = [];
  const thresholdPercent = 10;

  for (const item of quote.items) {
    const previousPrices = await PriceHistoryModel
      .find({
        materialName: item.name,
        specification: item.specification,
        supplierId: quote.supplierId
      })
      .sort({ effectiveDate: -1 })
      .skip(1)
      .limit(1)
      .lean()
      .exec();

    if (previousPrices.length > 0) {
      const previous = previousPrices[0];
      const changeAmount = item.unitPrice - previous.unitPrice;
      const changePercent = (changeAmount / previous.unitPrice) * 100;

      if (Math.abs(changePercent) >= thresholdPercent) {
        fluctuations.push({
          materialName: item.name,
          specification: item.specification,
          currentPrice: item.unitPrice,
          previousPrice: previous.unitPrice,
          changeAmount,
          changePercent,
          supplierName: quote.supplierName,
          currentQuoteId: quote.id,
          previousQuoteId: previous.quoteId || '',
          date: new Date()
        });
      }
    }
  }

  if (fluctuations.length > 0) {
    const redis = getRedisClient();
    await redis.setex(
      `${CACHE_KEYS.PRICE_FLUCTUATION}${quote.id}`,
      CACHE_TTL.ONE_DAY,
      JSON.stringify(fluctuations)
    );
    redis.publish(
      NOTIFICATION_CHANNELS.PRICE_ALERT,
      JSON.stringify({ quoteId: quote.id, fluctuations })
    );
  }

  return fluctuations;
}

export async function getPriceFluctuations(
  materialName?: string,
  days: number = 30
): Promise<ApiResponse<PriceFluctuation[]>> {
  try {
    const cacheKey = `${CACHE_KEYS.PRICE_FLUCTUATION}report:${materialName || 'all'}:${days}`;
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return {
        success: true,
        data: JSON.parse(cached)
      };
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter: any = { effectiveDate: { $gte: startDate } };
    if (materialName) {
      filter.materialName = { $regex: materialName, $options: 'i' };
    }

    const history = await PriceHistoryModel
      .find(filter)
      .sort({ materialName: 1, specification: 1, effectiveDate: -1 })
      .lean()
      .exec();

    const fluctuations: PriceFluctuation[] = [];
    const materialMap = new Map<string, PriceHistory[]>();

    for (const h of history) {
      const key = `${h.materialName}|${h.specification}|${h.supplierId}`;
      if (!materialMap.has(key)) materialMap.set(key, []);
      materialMap.get(key)!.push(h as PriceHistory);
    }

    for (const [, records] of materialMap) {
      for (let i = 0; i < records.length - 1; i++) {
        const current = records[i];
        const previous = records[i + 1];
        const changeAmount = current.unitPrice - previous.unitPrice;
        const changePercent = previous.unitPrice !== 0 
          ? (changeAmount / previous.unitPrice) * 100 
          : 0;

        fluctuations.push({
          materialName: current.materialName,
          specification: current.specification,
          currentPrice: current.unitPrice,
          previousPrice: previous.unitPrice,
          changeAmount,
          changePercent,
          supplierName: current.supplierName,
          currentQuoteId: current.quoteId || '',
          previousQuoteId: previous.quoteId || '',
          date: current.effectiveDate
        });
      }
    }

    await redis.setex(cacheKey, CACHE_TTL.ONE_HOUR, JSON.stringify(fluctuations));

    return {
      success: true,
      data: fluctuations
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}

export async function compareQuotesByPR(
  purchaseRequestId: string
): Promise<ApiResponse<any>> {
  try {
    const quotes = await QuoteModel
      .find({ purchaseRequestId })
      .sort({ totalAmount: 1 })
      .lean()
      .exec();

    if (quotes.length === 0) {
      return { success: true, data: { quotes: [], comparison: [] } };
    }

    const materialMap = new Map<string, any[]>();
    for (const quote of quotes) {
      for (const item of (quote as Quote).items) {
        const key = `${item.name}|${item.specification}`;
        if (!materialMap.has(key)) materialMap.set(key, []);
        materialMap.get(key)!.push({
          supplierName: (quote as Quote).supplierName,
          quoteId: (quote as Quote).id,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          deliveryDate: item.deliveryDate
        });
      }
    }

    const comparison = Array.from(materialMap.entries()).map(([key, records]) => {
      const [name, spec] = key.split('|');
      const prices = records.map(r => r.unitPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      return {
        materialName: name,
        specification: spec,
        minPrice,
        maxPrice,
        avgPrice,
        priceRange: maxPrice - minPrice,
        records: records.sort((a, b) => a.unitPrice - b.unitPrice)
      };
    });

    return {
      success: true,
      data: {
        quotes: quotes as Quote[],
        comparison
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}

export async function updateQuote(
  id: string,
  data: Partial<Quote>,
  userId: string,
  userName: string,
  changeReason?: string
): Promise<ApiResponse<Quote>> {
  try {
    const oldQuote = await QuoteModel.findOne({ 
      $or: [{ id }, { _id: id }] 
    }).lean().exec();
    
    if (!oldQuote) {
      return { success: false, error: '报价不存在' };
    }

    const updateData: any = { ...data };
    if (data.items) {
      updateData.items = data.items.map(item => ({
        ...item,
        subtotal: item.unitPrice * item.quantity
      }));
      updateData.totalAmount = updateData.items.reduce(
        (sum: number, item: QuoteItem) => sum + item.subtotal, 0
      );
      const taxRate = data.taxRate || (oldQuote as any).taxRate || 0;
      updateData.taxAmount = updateData.totalAmount * taxRate;
      updateData.totalWithTax = updateData.totalAmount + updateData.taxAmount;
    }

    const updatedQuote = await QuoteModel.findOneAndUpdate(
      { $or: [{ id }, { _id: id }] },
      { $set: updateData },
      { new: true }
    ).lean().exec();

    await createChangeHistory(
      'quote',
      oldQuote.id || String((oldQuote as any)._id),
      (oldQuote as any).code,
      oldQuote,
      updatedQuote,
      userId,
      userName,
      changeReason
    );

    return {
      success: true,
      data: updatedQuote as Quote,
      message: '报价已更新'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失败'
    };
  }
}

export async function selectQuote(
  quoteId: string,
  purchaseRequestId: string,
  userId: string,
  userName: string
): Promise<ApiResponse<any>> {
  try {
    await QuoteModel.updateMany(
      { purchaseRequestId },
      { $set: { status: 'rejected' as QuoteStatus } }
    );

    await QuoteModel.findOneAndUpdate(
      { $or: [{ id: quoteId }, { _id: quoteId }] },
      { $set: { status: 'selected' as QuoteStatus } }
    );

    const selectedQuote = await QuoteModel.findOne({ 
      $or: [{ id: quoteId }, { _id: quoteId }] 
    }).lean().exec();

    const pr = await PurchaseRequestModel.findOneAndUpdate(
      { $or: [{ id: purchaseRequestId }, { _id: purchaseRequestId }] },
      { 
        $set: { 
          status: 'comparing' as any,
          selectedQuoteId: quoteId,
          totalAmount: (selectedQuote as any)?.totalAmount
        }
      },
      { new: true }
    ).lean().exec();

    return {
      success: true,
      data: { quote: selectedQuote, purchaseRequest: pr },
      message: '已选中报价'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败'
    };
  }
}

export async function getQuoteHistory(entityId: string) {
  return getChangeHistory('quote', entityId);
}

export async function listQuotes(
  query: {
    purchaseRequestId?: string;
    supplierId?: string;
    status?: QuoteStatus;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ApiResponse<Quote[]>> {
  try {
    const { purchaseRequestId, supplierId, status, page = 1, pageSize = 20 } = query;
    const filter: any = {};
    if (purchaseRequestId) filter.purchaseRequestId = purchaseRequestId;
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;

    const total = await QuoteModel.countDocuments(filter);
    const list = await QuoteModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    return {
      success: true,
      data: list as Quote[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询失败'
    };
  }
}
