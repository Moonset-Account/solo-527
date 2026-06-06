function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    data.push(row);
  }

  return data;
}

async function exportToCSV(data: Record<string, unknown>[]): Promise<string> {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerLine = headers.join(',');
  const lines = data.map((row) =>
    headers.map((h) => {
      const value = String(row[h] ?? '');
      return value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );

  return [headerLine, ...lines].join('\n');
}

export async function processImport(
  entity: string,
  fileBuffer: Buffer,
  fileFormat: 'csv' | 'xlsx',
  userId: string
) {
  const taskId = Date.now().toString();
  console.log('[Import] Processing:', { entity, fileFormat, userId });

  let data: Record<string, string>[] = [];
  if (fileFormat === 'csv') {
    data = parseCSV(fileBuffer.toString('utf-8'));
  }

  return {
    taskId,
    result: {
      total: data.length,
      success: data.length,
      failed: 0,
      errors: [],
      importedIds: data.map((_, i) => `imported-${i}`),
    },
  };
}

export async function processExport(
  options: { entity: string; format: 'csv' | 'xlsx'; filters?: Record<string, unknown> },
  userId: string
) {
  const taskId = Date.now().toString();
  const fileName = `${options.entity}_${Date.now()}.${options.format}`;
  
  console.log('[Export] Processing:', { ...options, userId });

  const mockData = [
    { id: '1', name: '示例数据1', created: '2024-01-01' },
    { id: '2', name: '示例数据2', created: '2024-01-02' },
  ];

  let fileContent = '';
  if (options.format === 'csv') {
    fileContent = await exportToCSV(mockData);
  }

  return { taskId, filePath: fileName, count: mockData.length, content: fileContent };
}

export async function getImportExportTask(taskId: string) {
  return null;
}

export function getExportFilePath(fileName: string) {
  return fileName;
}
