import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../../entities/quote.entity';
import { QuoteItem } from '../../entities/quote-item.entity';
import { PaymentNode } from '../../entities/payment-node.entity';
import { User } from '../../entities/user.entity';

interface CreateQuoteDto {
  demandId?: string;
  items: any[];
  paymentNodes?: any[];
}

interface UpdateQuoteDto {
  items?: any[];
  paymentNodes?: any[];
  status?: string;
}

@Injectable()
export class QuoteService {
  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteItem)
    private quoteItemRepository: Repository<QuoteItem>,
    @InjectRepository(PaymentNode)
    private paymentNodeRepository: Repository<PaymentNode>,
  ) {}

  async findAll(query: any) {
    const { status, demandId, createdBy, page = 1, pageSize = 20 } = query;
    const where: any = {};

    if (status) where.status = status;
    if (demandId) where.demandId = demandId;
    if (createdBy) where.createdById = createdBy;

    const [data, total] = await this.quoteRepository.findAndCount({
      where,
      relations: ['demand', 'createdBy', 'items', 'items.supplier'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['demand', 'createdBy', 'items', 'items.supplier', 'paymentNodes'],
    });
    if (!quote) {
      throw new NotFoundException('报价不存在');
    }
    return quote;
  }

  async getVersions(quoteId: string) {
    const quote = await this.findOne(quoteId);
    if (!quote.demandId) {
      return [quote];
    }
    return this.quoteRepository.find({
      where: { demandId: quote.demandId },
      relations: ['items', 'paymentNodes'],
      order: { version: 'DESC', createdAt: 'DESC' },
    });
  }

  async compareVersions(quoteId: string, version1: number, version2: number) {
    const quote = await this.findOne(quoteId);
    if (!quote.demandId) {
      throw new BadRequestException('该报价没有关联需求，无法对比版本');
    }

    const v1 = await this.quoteRepository.findOne({
      where: { demandId: quote.demandId, version: version1 },
      relations: ['items', 'paymentNodes'],
    });
    const v2 = await this.quoteRepository.findOne({
      where: { demandId: quote.demandId, version: version2 },
      relations: ['items', 'paymentNodes'],
    });

    if (!v1 || !v2) {
      throw new NotFoundException('指定的版本不存在');
    }

    return { version1: v1, version2: v2 };
  }

  private calculateTotals(items: any[]) {
    let totalCost = 0;
    let totalPrice = 0;

    items.forEach((item) => {
      totalCost += Number(item.unitCost) * Number(item.quantity || 1);
      totalPrice += Number(item.unitPrice) * Number(item.quantity || 1);
    });

    const profitMargin = totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0;
    return { totalCost, totalPrice, profitMargin };
  }

  async create(dto: CreateQuoteDto, user: User) {
    const { items = [], paymentNodes = [] } = dto;

    const existingQuotes = await this.quoteRepository.count({
      where: { demandId: dto.demandId },
    });

    const { totalCost, totalPrice, profitMargin } = this.calculateTotals(items);

    const threshold = parseFloat(process.env.PROFIT_MARGIN_THRESHOLD || '15');
    const requiresManagerApproval = profitMargin < threshold;

    const quote = this.quoteRepository.create({
      demandId: dto.demandId,
      version: existingQuotes + 1,
      status: 'draft',
      totalCost,
      totalPrice,
      profitMargin,
      requiresManagerApproval,
      createdById: user.id,
    });

    const savedQuote = await this.quoteRepository.save(quote);

    if (items.length > 0) {
      const quoteItems = items.map((item) => ({
        ...item,
        quoteId: savedQuote.id,
      }));
      await this.quoteItemRepository.save(quoteItems);
    }

    if (paymentNodes.length > 0) {
      const nodes = paymentNodes.map((node) => ({
        ...node,
        quoteId: savedQuote.id,
        amount: (Number(node.percentage) / 100) * totalPrice,
      }));
      await this.paymentNodeRepository.save(nodes);
    }

    return this.findOne(savedQuote.id);
  }

  async update(id: string, dto: UpdateQuoteDto, user: User) {
    const existingQuote = await this.findOne(id);

    if (!dto.items && !dto.paymentNodes && !dto.status) {
      return existingQuote;
    }

    if (dto.status && !dto.items && !dto.paymentNodes) {
      existingQuote.status = dto.status as any;
      return this.quoteRepository.save(existingQuote);
    }

    const items = dto.items || existingQuote.items;
    const paymentNodes = dto.paymentNodes || existingQuote.paymentNodes;

    const { totalCost, totalPrice, profitMargin } = this.calculateTotals(items);
    const threshold = parseFloat(process.env.PROFIT_MARGIN_THRESHOLD || '15');

    const existingVersionCount = await this.quoteRepository.count({
      where: { demandId: existingQuote.demandId },
    });

    const newQuote = this.quoteRepository.create({
      demandId: existingQuote.demandId,
      version: existingVersionCount + 1,
      status: dto.status ? (dto.status as any) : 'draft',
      totalCost,
      totalPrice,
      profitMargin,
      requiresManagerApproval: profitMargin < threshold,
      createdById: user.id,
    });

    const savedQuote = await this.quoteRepository.save(newQuote);

    if (items.length > 0) {
      const quoteItems = items.map((item) => {
        const { id: _, ...itemData } = item;
        return {
          ...itemData,
          quoteId: savedQuote.id,
        };
      });
      await this.quoteItemRepository.save(quoteItems);
    }

    if (paymentNodes.length > 0) {
      const nodes = paymentNodes.map((node) => {
        const { id: _, ...nodeData } = node;
        return {
          ...nodeData,
          quoteId: savedQuote.id,
          amount: (Number(nodeData.percentage) / 100) * totalPrice,
        };
      });
      await this.paymentNodeRepository.save(nodes);
    }

    return this.findOne(savedQuote.id);
  }

  async submitForApproval(id: string, user: User) {
    const quote = await this.findOne(id);
    if (quote.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的报价可以提交审批');
    }

    quote.status = 'pending_approval';
    return this.quoteRepository.save(quote);
  }

  async remove(id: string) {
    const quote = await this.findOne(id);
    return this.quoteRepository.remove(quote);
  }
}
