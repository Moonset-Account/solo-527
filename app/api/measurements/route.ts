import { NextResponse } from 'next/server';
import { getMeasurements, addMeasurements, getSites } from '@/lib/db';
import Papa from 'papaparse';
import { isValueAnomaly } from '@/lib/utils/dataUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const siteIds = searchParams.get('siteIds')?.split(',').filter(Boolean);
    const organizations = searchParams.get('organizations')?.split(',').filter(Boolean);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const dataSource = (searchParams.get('dataSource') as 'manual' | 'automatic' | 'all') || 'all';
    const onlyAnomalies = searchParams.get('onlyAnomalies') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const format = searchParams.get('format');

    const result = await getMeasurements({
      siteIds,
      organizations,
      startDate,
      endDate,
      dataSource,
      onlyAnomalies,
      limit: format ? 100000 : limit,
      offset,
    });

    if (format === 'csv') {
      const csvData = result.data.map(m => ({
        ID: m.id,
        站点ID: m.siteId,
        采样时间: m.sampleTime,
        水温: m.temperature,
        pH: m.ph,
        溶解氧: m.dissolvedOxygen,
        氨氮: m.ammoniaNitrogen,
        降雨量: m.rainfall,
        数据来源: m.dataSource === 'manual' ? '人工采样' : '自动站',
        机构: m.organization,
        是否异常: m.isAnomaly ? '是' : '否',
        异常原因: m.anomalyReason || '',
        备注: m.note || '',
        采样人员: m.sampledBy || '',
      }));

      const csv = Papa.unparse(csvData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="measurements_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('获取监测数据错误:', error);
    return NextResponse.json(
      { error: '获取监测数据失败: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: '未找到上传文件' },
          { status: 400 }
        );
      }

      const text = await file.text();
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      const sites = await getSites();
      const siteMap = new Map(sites.map(s => [s.code, s]));

      const measurements: Array<{
        siteId: string;
        sampleTime: string;
        temperature: number | null;
        ph: number | null;
        dissolvedOxygen: number | null;
        ammoniaNitrogen: number | null;
        rainfall: number | null;
        dataSource: 'manual' | 'automatic';
        organization: string;
        isAnomaly: boolean;
        anomalyReason?: string;
        note?: string;
        sampledBy?: string;
      }> = [];

      for (const row of result.data as any[]) {
        const siteCode = row['站点编码'] || row['siteCode'] || row['code'];
        let site = siteMap.get(siteCode);

        if (!site) {
          const siteName = row['站点名称'] || row['siteName'] || row['name'];
          if (siteName) {
            site = sites.find(s => s.name === siteName);
          }
        }

        if (!site) continue;

        const sampleTime = row['采样时间'] || row['sampleTime'] || row['time'];
        if (!sampleTime) continue;

        const temperature = row['水温'] !== undefined && row['水温'] !== '' ? parseFloat(row['水温']) : null;
        const ph = row['pH'] !== undefined && row['pH'] !== '' ? parseFloat(row['pH']) : null;
        const dissolvedOxygen = row['溶解氧'] !== undefined && row['溶解氧'] !== '' ? parseFloat(row['溶解氧']) : null;
        const ammoniaNitrogen = row['氨氮'] !== undefined && row['氨氮'] !== '' ? parseFloat(row['氨氮']) : null;
        const rainfall = row['降雨量'] !== undefined && row['降雨量'] !== '' ? parseFloat(row['降雨量']) : null;

        const dataSource = (row['数据来源'] === '自动站' || row['dataSource'] === 'automatic') ? 'automatic' : 'manual';

        const isAnomaly =
          isValueAnomaly('temperature', temperature) ||
          isValueAnomaly('ph', ph) ||
          isValueAnomaly('dissolvedOxygen', dissolvedOxygen) ||
          isValueAnomaly('ammoniaNitrogen', ammoniaNitrogen);

        measurements.push({
          siteId: site.id,
          sampleTime: new Date(sampleTime).toISOString(),
          temperature,
          ph,
          dissolvedOxygen,
          ammoniaNitrogen,
          rainfall,
          dataSource,
          organization: site.organization,
          isAnomaly,
          anomalyReason: row['异常原因'] || row['anomalyReason'] || undefined,
          note: row['备注'] || row['note'] || undefined,
          sampledBy: row['采样人员'] || row['sampledBy'] || undefined,
        });
      }

      if (measurements.length === 0) {
        return NextResponse.json(
          { error: '未解析到有效的数据记录，请检查 CSV 格式' },
          { status: 400 }
        );
      }

      const saved = await addMeasurements(measurements);

      return NextResponse.json({
        success: true,
        imported: saved.length,
        message: `成功导入 ${saved.length} 条记录`,
      });
    } else {
      const body = await request.json();
      const measurements = Array.isArray(body) ? body : [body];
      const saved = await addMeasurements(measurements);
      return NextResponse.json(saved, { status: 201 });
    }
  } catch (error: any) {
    console.error('导入监测数据错误:', error);
    return NextResponse.json(
      { error: '导入监测数据失败: ' + error.message },
      { status: 500 }
    );
  }
}
