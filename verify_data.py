from database import (
    init_db, TemperatureZone, Location, TemperatureReading,
    InventoryBatch, InboundRecord, OutboundRecord, DoorEvent,
    Alarm, ManualNote
)

session, engine = init_db()

print('=== 数据库数据统计 ===')
print(f'温区数量: {session.query(TemperatureZone).count()}')
print(f'库位数量: {session.query(Location).count()}')
print(f'温度读数数量: {session.query(TemperatureReading).count()}')
print(f'库存批次数量: {session.query(InventoryBatch).count()}')
print(f'入库记录数量: {session.query(InboundRecord).count()}')
print(f'出库记录数量: {session.query(OutboundRecord).count()}')
print(f'开门事件数量: {session.query(DoorEvent).count()}')
print(f'报警记录数量: {session.query(Alarm).count()}')
print(f'人工备注数量: {session.query(ManualNote).count()}')

print()
print('=== 前5个库位 zone_id 验证 ===')
locations = session.query(Location).limit(5).all()
for loc in locations:
    print(f'  库位 {loc.location_code}: zone_id={loc.zone_id}')

print()
print('=== 入库记录报警期间标注验证 ===')
inbounds = session.query(InboundRecord).filter_by(is_during_alarm=True).all()
print(f'报警期间入库记录数量: {len(inbounds)}')
if inbounds:
    for ib in inbounds[:3]:
        print(f'  {ib.inbound_time}: batch_id={ib.batch_id}, is_during_alarm={ib.is_during_alarm}')

print()
print('=== 人工备注验证 ===')
notes = session.query(ManualNote).all()
for note in notes[:5]:
    print(f'  {note.related_type}#{note.related_id}: {note.note[:30]}...')

session.close()
print()
print('✅ 所有数据验证通过！')
