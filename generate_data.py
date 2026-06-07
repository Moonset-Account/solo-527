import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from database import (
    init_db, init_timescaledb, is_timescaledb_enabled, get_db_url,
    TemperatureZone, Location, TemperatureReading,
    InventoryBatch, InboundRecord, OutboundRecord, DoorEvent,
    Alarm, ManualNote
)


def generate_zones():
    zones = [
        {'zone_name': '冷冻区A', 'zone_code': 'FRZ-A', 'target_temp_min': -25, 'target_temp_max': -18, 'capacity_m3': 500, 'description': '深度冷冻食品储存'},
        {'zone_name': '冷冻区B', 'zone_code': 'FRZ-B', 'target_temp_min': -25, 'target_temp_max': -18, 'capacity_m3': 450, 'description': '冰淇淋专区'},
        {'zone_name': '冷藏区A', 'zone_code': 'REF-A', 'target_temp_min': 0, 'target_temp_max': 4, 'capacity_m3': 600, 'description': '生鲜蔬果'},
        {'zone_name': '冷藏区B', 'zone_code': 'REF-B', 'target_temp_min': 0, 'target_temp_max': 4, 'capacity_m3': 550, 'description': '乳制品'},
        {'zone_name': '恒温区A', 'zone_code': 'CON-A', 'target_temp_min': 10, 'target_temp_max': 15, 'capacity_m3': 400, 'description': '巧克力/红酒'},
        {'zone_name': '恒温区B', 'zone_code': 'CON-B', 'target_temp_min': 15, 'target_temp_max': 20, 'capacity_m3': 350, 'description': '药品专区'},
    ]
    return zones


def generate_locations(zones):
    locations = []
    for zone_idx, zone in enumerate(zones):
        for aisle in ['A', 'B', 'C']:
            for rack in range(1, 4):
                for level in range(1, 5):
                    for position in range(1, 6):
                        loc_code = f"{zone['zone_code']}-{aisle}{rack}-L{level}-P{position}"
                        locations.append({
                            'location_code': loc_code,
                            'zone_id': zone_idx + 1,
                            'aisle': aisle,
                            'rack': str(rack),
                            'level': level,
                            'position': position,
                            'capacity_pallets': 2 if level <= 2 else 1,
                            'is_available': True
                        })
    return locations


def generate_temperature_readings(zones, start_date, days=30):
    readings = []
    current_time = start_date
    end_time = start_date + timedelta(days=days)
    
    while current_time < end_time:
        for zone_idx, zone in enumerate(zones):
            zone_id = zone.get('id', zone_idx + 1)
            base_temp = (zone['target_temp_min'] + zone['target_temp_max']) / 2
            temp_variation = np.random.normal(0, 0.8)
            temperature = base_temp + temp_variation
            
            if random.random() < 0.02:
                temperature += random.uniform(3, 8) if base_temp < 0 else random.uniform(2, 5)
            
            humidity = random.uniform(40, 80)
            
            readings.append({
                'time': current_time,
                'zone_id': zone_id,
                'temperature': round(temperature, 2),
                'humidity': round(humidity, 1),
                'sensor_id': f"SENSOR-{zone['zone_code']}-001"
            })
        
        current_time += timedelta(minutes=15)
    
    return readings


def generate_batches(zones, locations, start_date, days=30):
    customers = ['鲜丰食品', '优鲜配送', '味好美', '绿源农场', '百盛物流', '康泰医药']
    product_types = {
        'FRZ': ['冷冻肉类', '速冻面点', '冰淇淋', '冷冻海鲜'],
        'REF': ['新鲜蔬菜', '新鲜水果', '乳制品', '鲜蛋'],
        'CON': ['巧克力', '红酒', '生物制剂', '疫苗']
    }
    
    location_ids = [loc.get('id', i + 1) for i, loc in enumerate(locations)]
    
    batches = []
    batch_counter = 1
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        num_batches = random.randint(3, 8)
        
        for _ in range(num_batches):
            zone_idx = random.randint(0, len(zones) - 1)
            zone = zones[zone_idx]
            zone_id = zone.get('id', zone_idx + 1)
            zone_prefix = zone['zone_code'].split('-')[0]
            
            customer = random.choice(customers)
            product_type = random.choice(product_types.get(zone_prefix, ['其他']))
            product_name = f"{product_type}-{random.randint(100, 999)}"
            
            quantity = random.randint(1, 12)
            inbound_time = current_date + timedelta(
                hours=random.randint(6, 20),
                minutes=random.randint(0, 59)
            )
            
            storage_days = random.randint(1, 15)
            expected_outbound = inbound_time + timedelta(days=storage_days)
            actual_outbound = expected_outbound + timedelta(days=random.randint(-2, 2)) if random.random() < 0.7 else None
            
            batch = {
                'batch_number': f"BATCH{batch_counter:06d}",
                'customer': customer,
                'product_type': product_type,
                'product_name': product_name,
                'quantity': quantity,
                'unit': 'pallet',
                'zone_id': zone_id,
                'location_id': random.choice(location_ids),
                'inbound_time': inbound_time,
                'expected_outbound_time': expected_outbound,
                'actual_outbound_time': actual_outbound,
                'is_active': actual_outbound is None
            }
            batches.append(batch)
            batch_counter += 1
    
    return batches


def generate_inbound_records(batches, alarms):
    inbound_records = []
    
    for batch_idx, batch in enumerate(batches):
        batch_id = batch.get('id', batch_idx + 1)
        zone_id = batch['zone_id']
        
        is_during_alarm = False
        for alarm in alarms:
            alarm_zone_id = alarm.get('zone_id')
            if alarm_zone_id == zone_id:
                alarm_end = alarm['alarm_end'] or alarm['alarm_start'] + timedelta(hours=2)
                if alarm['alarm_start'] <= batch['inbound_time'] <= alarm_end:
                    is_during_alarm = True
                    break
        
        inbound_records.append({
            'inbound_time': batch['inbound_time'],
            'batch_id': batch_id,
            'zone_id': zone_id,
            'location_id': batch['location_id'],
            'quantity': batch['quantity'],
            'temperature_on_arrival': round(random.uniform(-20, 18), 1),
            'operator': random.choice(['张师傅', '李师傅', '王师傅', '赵师傅']),
            'is_during_alarm': is_during_alarm
        })
    
    return inbound_records


def generate_outbound_records(batches):
    outbound_records = []
    
    for batch_idx, batch in enumerate(batches):
        if batch['actual_outbound_time']:
            batch_id = batch.get('id', batch_idx + 1)
            outbound_records.append({
                'outbound_time': batch['actual_outbound_time'],
                'batch_id': batch_id,
                'zone_id': batch['zone_id'],
                'location_id': batch['location_id'],
                'quantity': batch['quantity'],
                'temperature_on_departure': round(random.uniform(-20, 18), 1),
                'operator': random.choice(['张师傅', '李师傅', '王师傅', '赵师傅'])
            })
    
    return outbound_records


def generate_door_events(zones, start_date, days=30):
    events = []
    current_time = start_date
    end_time = start_date + timedelta(days=days)
    
    while current_time < end_time:
        if random.random() < 0.3:
            zone_idx = random.randint(0, len(zones) - 1)
            zone = zones[zone_idx]
            zone_id = zone.get('id', zone_idx + 1)
            door_id = f"DOOR-{zone['zone_code']}-{random.randint(1, 3):02d}"
            
            open_time = current_time
            duration = random.randint(30, 600)
            close_time = open_time + timedelta(seconds=duration)
            
            events.append({
                'event_time': open_time,
                'zone_id': zone_id,
                'door_id': door_id,
                'event_type': 'open',
                'duration_seconds': None,
                'operator': random.choice(['张师傅', '李师傅', '王师傅', '赵师傅'])
            })
            
            events.append({
                'event_time': close_time,
                'zone_id': zone_id,
                'door_id': door_id,
                'event_type': 'close',
                'duration_seconds': duration,
                'operator': random.choice(['张师傅', '李师傅', '王师傅', '赵师傅'])
            })
        
        current_time += timedelta(minutes=random.randint(15, 120))
    
    return events


def generate_alarms(zones, start_date, days=30):
    alarms = []
    alarm_types = {
        '高温报警': ('error', 5, 10),
        '低温报警': ('warning', -10, -5),
        '传感器故障': ('warning', 0, 0),
        '门未关报警': ('warning', 0, 0),
        '湿度异常': ('info', 0, 0)
    }
    
    for day in range(days):
        if random.random() < 0.4:
            zone_idx = random.randint(0, len(zones) - 1)
            zone = zones[zone_idx]
            zone_id = zone.get('id', zone_idx + 1)
            alarm_type_key = random.choice(list(alarm_types.keys()))
            severity, temp_offset_min, temp_offset_max = alarm_types[alarm_type_key]
            
            alarm_start = start_date + timedelta(
                days=day,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            duration_hours = random.uniform(0.5, 4)
            alarm_end = alarm_start + timedelta(hours=duration_hours)
            
            base_temp = (zone['target_temp_min'] + zone['target_temp_max']) / 2
            
            alarms.append({
                'alarm_start': alarm_start,
                'alarm_end': alarm_end,
                'zone_id': zone_id,
                'alarm_type': alarm_type_key,
                'severity': severity,
                'description': f"{zone['zone_name']}发生{alarm_type_key}，持续{duration_hours:.1f}小时",
                'max_temperature': round(base_temp + temp_offset_max, 2) if temp_offset_max != 0 else None,
                'min_temperature': round(base_temp + temp_offset_min, 2) if temp_offset_min != 0 else None,
                'is_acknowledged': random.random() < 0.8
            })
    
    return alarms


def generate_manual_notes(alarms, batches):
    notes = []
    
    for i, alarm in enumerate(alarms[:20]):
        alarm_id = alarm.get('id', i + 1)
        notes.append({
            'created_at': alarm['alarm_end'] or alarm['alarm_start'] + timedelta(hours=1),
            'related_type': 'alarm',
            'related_id': alarm_id,
            'note': random.choice([
                '经排查为冷库门未关严导致，已整改',
                '压缩机临时故障，已报修恢复',
                '传感器校准偏差，已重新校准',
                '属于正常除霜周期，非设备故障',
                '待进一步观察'
            ]),
            'author': random.choice(['陈经理', '刘主管', '杨工程师']),
            'is_anomaly': random.random() < 0.3
        })
    
    for i, batch in enumerate(batches[:10]):
        batch_id = batch.get('id', i + 1)
        notes.append({
            'created_at': batch['inbound_time'] + timedelta(hours=2),
            'related_type': 'batch',
            'related_id': batch_id,
            'note': random.choice([
                '该批次包装有破损，已单独存放',
                '客户特殊要求，优先出库',
                '温度检测合格，正常入库',
                '需要抽样检验，待质检结果'
            ]),
            'author': random.choice(['陈经理', '刘主管', '质检员小李']),
            'is_anomaly': random.random() < 0.4
        })
    
    return notes


def clear_all_tables(session):
    print("清空现有数据...")
    session.query(ManualNote).delete()
    session.query(DoorEvent).delete()
    session.query(OutboundRecord).delete()
    session.query(InboundRecord).delete()
    session.query(Alarm).delete()
    session.query(TemperatureReading).delete()
    session.query(InventoryBatch).delete()
    session.query(Location).delete()
    session.query(TemperatureZone).delete()
    session.commit()
    print("已清空所有表")


def main():
    print("开始生成模拟数据...")
    db_url = get_db_url()
    
    if is_timescaledb_enabled():
        print(f"使用 TimescaleDB: {db_url}")
        session, engine = init_timescaledb(db_url)
    else:
        print(f"使用 SQLite: {db_url}")
        session, engine = init_db(db_url)
    
    clear_all_tables(session)
    
    start_date = datetime.now() - timedelta(days=30)
    
    zones = generate_zones()
    zone_objects = []
    for zone_data in zones:
        zone = TemperatureZone(**zone_data)
        session.add(zone)
        zone_objects.append(zone)
    session.flush()
    for i, zone in enumerate(zone_objects):
        zones[i]['id'] = zone.id
    session.commit()
    print(f"生成 {len(zones)} 个温区")
    
    locations = generate_locations(zones)
    location_objects = []
    for loc_data in locations:
        loc = Location(**loc_data)
        session.add(loc)
        location_objects.append(loc)
    session.flush()
    for i, loc in enumerate(location_objects):
        locations[i]['id'] = loc.id
    session.commit()
    print(f"生成 {len(locations)} 个库位")
    
    alarms = generate_alarms(zones, start_date, days=30)
    alarm_objects = []
    for alarm_data in alarms:
        alarm = Alarm(**alarm_data)
        session.add(alarm)
        alarm_objects.append(alarm)
    session.flush()
    for i, alarm in enumerate(alarm_objects):
        alarms[i]['id'] = alarm.id
    session.commit()
    print(f"生成 {len(alarms)} 条报警记录")
    
    readings = generate_temperature_readings(zones, start_date, days=30)
    for i in range(0, len(readings), 1000):
        batch = readings[i:i+1000]
        session.bulk_insert_mappings(TemperatureReading, batch)
        session.commit()
    print(f"生成 {len(readings)} 条温度读数")
    
    batches = generate_batches(zones, locations, start_date, days=30)
    batch_objects = []
    for batch_data in batches:
        batch = InventoryBatch(**batch_data)
        session.add(batch)
        batch_objects.append(batch)
    session.flush()
    for i, batch in enumerate(batch_objects):
        batches[i]['id'] = batch.id
    session.commit()
    print(f"生成 {len(batches)} 个库存批次")
    
    inbound_records = generate_inbound_records(batches, alarms)
    for record_data in inbound_records:
        record = InboundRecord(**record_data)
        session.add(record)
    session.commit()
    print(f"生成 {len(inbound_records)} 条入库记录")
    
    outbound_records = generate_outbound_records(batches)
    for record_data in outbound_records:
        record = OutboundRecord(**record_data)
        session.add(record)
    session.commit()
    print(f"生成 {len(outbound_records)} 条出库记录")
    
    door_events = generate_door_events(zones, start_date, days=30)
    for i in range(0, len(door_events), 1000):
        batch = door_events[i:i+1000]
        session.bulk_insert_mappings(DoorEvent, batch)
        session.commit()
    print(f"生成 {len(door_events)} 条开门事件")
    
    notes = generate_manual_notes(alarms, batches)
    for note_data in notes:
        note = ManualNote(**note_data)
        session.add(note)
    session.commit()
    print(f"生成 {len(notes)} 条人工备注")
    
    session.close()
    print("数据生成完成！")


if __name__ == '__main__':
    main()
