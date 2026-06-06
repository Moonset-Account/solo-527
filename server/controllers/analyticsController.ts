import type { Request, Response } from 'express';
import { getOverviewData } from '../services/overviewService';
import { getFunnelData } from '../services/funnelService';
import { getParetoData } from '../services/paretoService';
import { getPromotionComparison } from '../services/promotionService';
import { getSupplierRanking } from '../services/supplierService';
import { getFilterOptions, parseFilterParams } from '../services/filterService';
import { getWeatherTrafficAnalysis } from '../services/weatherTrafficService';
import { getCachedData, setCachedData, generateCacheKey, CACHE_TTL } from '../utils/cache';

export async function getOverview(req: Request, res: Response) {
  try {
    const filters = parseFilterParams(req.query);
    const cacheKey = generateCacheKey('overview', filters);
    const cached = await getCachedData(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const data = await getOverviewData(filters);
    await setCachedData(cacheKey, data, CACHE_TTL.SHORT);
    res.json(data);
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
}

export async function getFunnel(req: Request, res: Response) {
  try {
    const filters = parseFilterParams(req.query);
    const cacheKey = generateCacheKey('funnel', filters);
    const cached = await getCachedData(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const data = await getFunnelData(filters);
    await setCachedData(cacheKey, data, CACHE_TTL.SHORT);
    res.json(data);
  } catch (error) {
    console.error('Funnel error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
}

export async function getPareto(req: Request, res: Response) {
  try {
    const filters = parseFilterParams(req.query);
    const dimension = (req.query.dimension as string) || 'category';
    const cacheKey = generateCacheKey(`pareto:${dimension}`, filters);
    const cached = await getCachedData(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const data = await getParetoData(filters, dimension as any);
    await setCachedData(cacheKey, data, CACHE_TTL.SHORT);
    res.json(data);
  } catch (error) {
    console.error('Pareto error:', error);
    res.status(500).json({ error: 'Failed to fetch pareto data' });
  }
}

export async function getPromotion(req: Request, res: Response) {
  try {
    const filters = parseFilterParams(req.query);
    const cacheKey = generateCacheKey('promotion', filters);
    const cached = await getCachedData(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const data = await getPromotionComparison(filters);
    await setCachedData(cacheKey, data, CACHE_TTL.MEDIUM);
    res.json(data);
  } catch (error) {
    console.error('Promotion error:', error);
    res.status(500).json({ error: 'Failed to fetch promotion data' });
  }
}

export async function getSuppliers(req: Request, res: Response) {
  try {
    const filters = parseFilterParams(req.query);
    const cacheKey = generateCacheKey('suppliers', filters);
    const cached = await getCachedData(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const data = await getSupplierRanking(filters);
    await setCachedData(cacheKey, data, CACHE_TTL.MEDIUM);
    res.json(data);
  } catch (error) {
    console.error('Suppliers error:', error);
    res.status(500).json({ error: 'Failed to fetch supplier data' });
  }
}

export async function getFilters(req: Request, res: Response) {
  try {
    const cacheKey = 'dim:filters';
    const cached = await getCachedData(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const data = await getFilterOptions();
    await setCachedData(cacheKey, data, CACHE_TTL.LONG);
    res.json(data);
  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
}

export async function getWeatherTraffic(req: Request, res: Response) {
  try {
    const filters = parseFilterParams(req.query);
    const cacheKey = generateCacheKey('weather-traffic', filters);
    const cached = await getCachedData(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const data = await getWeatherTrafficAnalysis(filters);
    await setCachedData(cacheKey, data, CACHE_TTL.MEDIUM);
    res.json(data);
  } catch (error) {
    console.error('Weather traffic error:', error);
    res.status(500).json({ error: 'Failed to fetch weather traffic data' });
  }
}
