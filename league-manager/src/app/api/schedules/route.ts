import dbConnect from '@/lib/db';
import { successResponse, paginatedResponse } from '@/lib/response';
import Match from '@/models/Match';

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const seasonId = searchParams.get('seasonId');
  const teamId = searchParams.get('teamId');
  const refereeId = searchParams.get('refereeId');
  const venueId = searchParams.get('venueId');
  const status = searchParams.get('status');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const filter: Record<string, unknown> = {};
  if (seasonId) filter.seasonId = seasonId;
  if (status) filter.status = status;
  if (venueId) filter.venueId = venueId;
  if (refereeId) filter.refereeId = refereeId;
  if (teamId) filter.$or = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    filter.matchDate = dateFilter;
  }

  const total = await Match.countDocuments(filter);
  const matches = await Match.find(filter)
    .populate('homeTeamId', 'name')
    .populate('awayTeamId', 'name')
    .populate('venueId', 'name address')
    .populate('refereeId', 'name email')
    .sort({ matchDate: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return paginatedResponse(matches, total, page, limit);
}
