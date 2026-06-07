import { NextResponse } from 'next/server';
import { INDICATORS, WATER_QUALITY_GRADES, RIVER_SECTIONS, ORGANIZATIONS } from '@/lib/utils/constants';

export async function GET() {
  return NextResponse.json({
    indicators: INDICATORS,
    waterQualityGrades: WATER_QUALITY_GRADES,
    riverSections: RIVER_SECTIONS,
    organizations: ORGANIZATIONS,
  });
}
