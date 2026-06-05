import dbConnect from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/response';
import Standing from '@/models/Standing';

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('seasonId');

  if (!seasonId) {
    return errorResponse('赛季ID为必填项');
  }

  const standings = await Standing.find({ seasonId })
    .populate('teamId', 'name')
    .sort({ points: -1, goalsFor: -1, goalsAgainst: 1 });

  return successResponse(standings);
}
