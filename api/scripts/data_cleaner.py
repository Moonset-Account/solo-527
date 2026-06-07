#!/usr/bin/env python3
"""
工业园区访客数据清洗脚本
功能：
1. 从原始闸机/车牌识别系统导入原始数据
2. 数据去重、格式标准化
3. 缺失值处理、异常值识别
4. 数据脱敏（车牌、身份证）
5. 导出清洗后的数据供 ClickHouse 导入
"""

import json
import csv
import hashlib
import re
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import random

class DataCleaner:
    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_config(config_path)
        self.stats = {
            'total_raw': 0,
            'duplicates_removed': 0,
            'invalid_records': 0,
            'missing_filled': 0,
            'clean_records': 0,
            'abnormal_detected': 0,
        }

    def _load_config(self, config_path: Optional[str]) -> Dict:
        default_config = {
            'plate_regex': r'^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]?$',
            'idcard_regex': r'^\d{17}[\dXx]$',
            'required_fields': ['passTime', 'plateNumber', 'gateId', 'enterpriseId'],
            'desensitize': {
                'plate': {'keep_prefix': 2, 'keep_suffix': 1},
                'idcard': {'keep_prefix': 3, 'keep_suffix': 4},
                'phone': {'keep_prefix': 3, 'keep_suffix': 4},
            }
        }
        if config_path and Path(config_path).exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                default_config.update(json.load(f))
        return default_config

    def desensitize_plate(self, plate: str) -> str:
        if not plate or len(plate) < 3:
            return plate
        cfg = self.config['desensitize']['plate']
        prefix = plate[:cfg['keep_prefix']]
        suffix = plate[-cfg['keep_suffix']:] if cfg['keep_suffix'] > 0 else ''
        middle = '*' * (len(plate) - cfg['keep_prefix'] - cfg['keep_suffix'])
        return f"{prefix}{middle}{suffix}"

    def desensitize_idcard(self, idcard: str) -> str:
        if not idcard or len(idcard) < 8:
            return idcard
        cfg = self.config['desensitize']['idcard']
        prefix = idcard[:cfg['keep_prefix']]
        suffix = idcard[-cfg['keep_suffix']:]
        middle = '*' * (len(idcard) - cfg['keep_prefix'] - cfg['keep_suffix'])
        return f"{prefix}{middle}{suffix}"

    def validate_plate(self, plate: str) -> bool:
        if not plate:
            return False
        return bool(re.match(self.config['plate_regex'], plate))

    def validate_idcard(self, idcard: str) -> bool:
        if not idcard:
            return False
        if not re.match(self.config['idcard_regex'], idcard):
            return False
        weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
        check_codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
        total = sum(int(idcard[i]) * weights[i] for i in range(17))
        return check_codes[total % 11] == idcard[17].upper()

    def detect_abnormal(self, record: Dict[str, Any], prev_record: Optional[Dict] = None) -> Dict[str, Any]:
        abnormal = False
        reasons = []
        level = 'info'

        if not record.get('appointmentId') and record.get('visitorType') not in ['employee', 'delivery']:
            abnormal = True
            reasons.append('无预约记录')
            level = 'warning'

        if record.get('passHour') in [23, 0, 1, 2, 3, 4, 5]:
            abnormal = True
            reasons.append('非工作时段通行')
            level = 'warning'

        if prev_record:
            time_diff = record['passTimestamp'] - prev_record['passTimestamp']
            if time_diff < 60000 and record.get('plateNumber') == prev_record.get('plateNumber'):
                abnormal = True
                reasons.append('短时间重复通行')
                level = 'info'

        if record.get('plateNumber') and not self.validate_plate(record['plateNumber']):
            abnormal = True
            reasons.append('车牌格式异常')
            level = 'warning'

        if len(reasons) >= 2:
            level = 'critical'

        return {
            'isAbnormal': abnormal,
            'abnormalReasons': reasons,
            'abnormalLevel': level,
        }

    def clean_record(self, record: Dict[str, Any], prev_record: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        self.stats['total_raw'] += 1

        for field in self.config['required_fields']:
            if field not in record or record[field] is None or str(record[field]).strip() == '':
                if field in ['plateNumber']:
                    record[field] = ''
                else:
                    self.stats['invalid_records'] += 1
                    return None

        try:
            pass_time = record['passTime']
            if isinstance(pass_time, str):
                pass_time = pass_time.replace('Z', '+00:00')
                dt = datetime.fromisoformat(pass_time)
            else:
                dt = datetime.fromtimestamp(pass_time / 1000 if pass_time > 1e12 else pass_time)
            
            record['passTimestamp'] = int(dt.timestamp() * 1000)
            record['passTime'] = dt.isoformat()
            record['hourBucket'] = dt.replace(minute=0, second=0, microsecond=0).timestamp() * 1000
            record['dayBucket'] = dt.strftime('%Y-%m-%d')
            record['passHour'] = dt.hour
            record['passWeekday'] = dt.weekday()
        except Exception as e:
            self.stats['invalid_records'] += 1
            return None

        record['plateNumber'] = str(record.get('plateNumber', '')).upper().strip()
        record['idCard'] = str(record.get('idCard', '')).strip()

        if record.get('plateNumber') and not self.validate_plate(record['plateNumber']):
            self.stats['missing_filled'] += 1

        abnormal_info = self.detect_abnormal(record, prev_record)
        record.update(abnormal_info)
        if abnormal_info['isAbnormal']:
            self.stats['abnormal_detected'] += 1

        record['plateNumberDesensitized'] = self.desensitize_plate(record.get('plateNumber', ''))
        record['idCardDesensitized'] = self.desensitize_idcard(record.get('idCard', ''))

        self.stats['clean_records'] += 1
        return record

    def clean_file(self, input_path: str, output_path: str, format: str = 'json') -> Dict[str, Any]:
        records = self._load_file(input_path)
        print(f"Loaded {len(records)} raw records")

        cleaned_records = []
        seen_hashes = set()

        records.sort(key=lambda r: r.get('passTime', ''))

        prev_record = None
        for record in records:
            hash_fields = [str(record.get('plateNumber', '')), str(record.get('passTime', ''))]
            record_hash = hashlib.md5('|'.join(hash_fields).encode()).hexdigest()
            
            if record_hash in seen_hashes:
                self.stats['duplicates_removed'] += 1
                continue
            seen_hashes.add(record_hash)

            cleaned = self.clean_record(record, prev_record)
            if cleaned:
                cleaned_records.append(cleaned)
                prev_record = cleaned

        self._save_file(cleaned_records, output_path, format)
        print(f"\n清洗统计:")
        for k, v in self.stats.items():
            print(f"  {k}: {v}")
        print(f"  清洗率: {self.stats['clean_records'] / max(1, self.stats['total_raw']) * 100:.1f}%")

        return {
            'stats': self.stats,
            'output_path': output_path,
            'record_count': len(cleaned_records),
        }

    def _load_file(self, path: str) -> List[Dict]:
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        if p.suffix == '.json':
            with open(p, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, list) else data.get('records', [])
        elif p.suffix == '.csv':
            with open(p, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return list(reader)
        else:
            raise ValueError(f"Unsupported format: {p.suffix}")

    def _save_file(self, records: List[Dict], path: str, format: str):
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)

        if format == 'json':
            with open(p, 'w', encoding='utf-8') as f:
                json.dump({
                    'generatedAt': datetime.now().isoformat(),
                    'stats': self.stats,
                    'records': records,
                }, f, ensure_ascii=False, indent=2)
        elif format == 'csv':
            if records:
                with open(p, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=records[0].keys())
                    writer.writeheader()
                    writer.writerows(records)
        print(f"Saved {len(records)} records to {path}")


def generate_sample_raw_data(output_path: str, count: int = 10000):
    """生成模拟的原始脏数据用于演示清洗效果"""
    enterprises = [f'e{i:03d}' for i in range(1, 21)]
    gates = [f'g{i:02d}' for i in range(1, 7)]
    visitor_types = ['visitor', 'delivery', 'interview', 'maintenance', 'vip', 'employee']
    prefixes = ['粤B', '粤A', '沪A', '京A', '浙A']
    
    records = []
    base_time = datetime.now() - timedelta(days=30)
    
    for i in range(count):
        hour = random.choices(
            list(range(24)),
            weights=[0.02]*6 + [0.1, 0.3, 0.8, 1.0, 0.7, 0.6, 0.6, 0.6, 0.7, 0.9, 1.0, 0.8, 0.5, 0.3] + [0.1]*3
        )[0]
        
        minute = random.randint(0, 59)
        pass_dt = base_time + timedelta(days=random.randint(0, 29), hours=hour, minutes=minute)
        
        plate = ''
        if random.random() > 0.1:
            prefix = random.choice(prefixes)
            chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
            plate = prefix + ''.join(random.choice(chars) for _ in range(5))
            if random.random() < 0.05:
                plate = plate[:3] + '**' + plate[5:]
        
        record = {
            'passTime': pass_dt.isoformat() if random.random() > 0.02 else str(int(pass_dt.timestamp())),
            'plateNumber': plate if random.random() > 0.03 else '',
            'idCard': '' if random.random() > 0.3 else '440301' + ''.join(str(random.randint(0,9)) for _ in range(11)),
            'gateId': random.choice(gates),
            'enterpriseId': random.choice(enterprises),
            'visitorType': random.choice(visitor_types),
            'appointmentId': f'apt{random.randint(10000, 99999)}' if random.random() > 0.2 else None,
            'laneId': f'l{random.randint(1, 10):02d}',
        }
        
        if random.random() < 0.02:
            records.append(record)
            records.append(record.copy())
        
        records.append(record)
    
    p = Path(output_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    print(f"Generated {len(records)} sample raw records to {output_path}")


def main():
    parser = argparse.ArgumentParser(description='工业园区访客数据清洗工具')
    parser.add_argument('action', choices=['clean', 'generate'], help='执行动作')
    parser.add_argument('--input', '-i', help='输入文件路径')
    parser.add_argument('--output', '-o', default='data/cleaned/visitor_records_cleaned.json', help='输出文件路径')
    parser.add_argument('--format', '-f', default='json', choices=['json', 'csv'], help='输出格式')
    parser.add_argument('--count', '-n', type=int, default=10000, help='生成数据量')
    parser.add_argument('--config', '-c', help='配置文件路径')
    
    args = parser.parse_args()
    
    cleaner = DataCleaner(args.config)
    
    if args.action == 'generate':
        generate_sample_raw_data(args.input or 'data/raw/sample_raw_records.json', args.count)
    elif args.action == 'clean':
        if not args.input:
            print("错误: clean 操作需要 --input 参数")
            return
        result = cleaner.clean_file(args.input, args.output, args.format)
        print(f"\n清洗完成，输出: {result['output_path']}")


if __name__ == '__main__':
    main()
