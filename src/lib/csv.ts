export interface CSVParseResult<T = any> {
  headers: string[];
  data: T[];
  rowCount: number;
}

export function parseCSV(csvContent: string): CSVParseResult<Record<string, string>> {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], data: [], rowCount: 0 };
  }

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });
    
    data.push(row);
  }

  return {
    headers,
    data,
    rowCount: data.length,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export const CSV_COLUMN_MAPPING: Record<string, string> = {
  "就诊号": "visitNumber",
  "就诊编号": "visitNumber",
  "visit_number": "visitNumber",
  "科室": "deptId",
  "科室ID": "deptId",
  "department": "deptId",
  "department_id": "deptId",
  "医生": "doctorId",
  "医生ID": "doctorId",
  "doctor": "doctorId",
  "doctor_id": "doctorId",
  "患者类型": "patientTypeId",
  "patient_type": "patientTypeId",
  "挂号时间": "registerTime",
  "register_time": "registerTime",
  "签到时间": "checkinTime",
  "checkin_time": "checkinTime",
  "分诊时间": "triageTime",
  "triage_time": "triageTime",
  "叫号时间": "callTime",
  "就诊时间": "callTime",
  "call_time": "callTime",
  "缴费时间": "paymentTime",
  "payment_time": "paymentTime",
  "取药时间": "medicineTime",
  "medicine_time": "medicineTime",
};

export function mapCSVRow(
  row: Record<string, string>,
  columnMapping: Record<string, string> = CSV_COLUMN_MAPPING
): any {
  const mapped: Record<string, any> = {};
  
  Object.entries(row).forEach(([key, value]) => {
    const mappedKey = columnMapping[key] || columnMapping[key.toLowerCase()];
    if (mappedKey) {
      mapped[mappedKey] = value || null;
    }
  });

  return mapped;
}

export function generateCSV(data: any[], headers: string[]): string {
  const BOM = "\uFEFF";
  const csvRows: string[] = [];
  
  csvRows.push(headers.join(","));
  
  data.forEach((row) => {
    const values = headers.map((header) => {
      let value = row[header];
      if (value === null || value === undefined) {
        value = "";
      }
      value = String(value);
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(","));
  });

  return BOM + csvRows.join("\n");
}
