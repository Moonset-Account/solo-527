export function formatCSVValue(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = '\uFEFF' + [
    headers.map(formatCSVValue).join(','),
    ...rows.map((row) => row.map(formatCSVValue).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportChartAsImage(filename: string, dataUrl: string) {
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = filename
  anchor.click()
}
