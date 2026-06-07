import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func
from database import (
    init_db, TemperatureZone, Location, TemperatureReading,
    InventoryBatch, InboundRecord, OutboundRecord, DoorEvent,
    Alarm, ManualNote
)


class DataService:
    def __init__(self, db_url='sqlite:///cold_storage.db'):
        self.session, self.engine = init_db(db_url)
    
    def get_zones(self):
        zones = self.session.query(TemperatureZone).all()
        return pd.DataFrame([{
            'id': z.id,
            'zone_name': z.zone_name,
            'zone_code': z.zone_code,
            'target_temp_min': z.target_temp_min,
            'target_temp_max': z.target_temp_max,
            'capacity_m3': z.capacity_m3
        } for z in zones])
    
    def get_locations(self, zone_id=None):
        query = self.session.query(Location, TemperatureZone.zone_name).join(TemperatureZone)
        if zone_id:
            query = query.filter(Location.zone_id == zone_id)
        results = query.all()
        return pd.DataFrame([{
            'id': loc.id,
            'location_code': loc.location_code,
            'zone_id': loc.zone_id,
            'zone_name': zone_name,
            'aisle': loc.aisle,
            'rack': loc.rack,
            'level': loc.level,
            'position': loc.position,
            'capacity_pallets': loc.capacity_pallets,
            'is_available': loc.is_available
        } for loc, zone_name in results])
    
    def get_temperature_readings(self, zone_ids=None, start_date=None, end_date=None):
        query = self.session.query(
            TemperatureReading.time,
            TemperatureReading.zone_id,
            TemperatureReading.temperature,
            TemperatureReading.humidity,
            TemperatureZone.zone_name
        ).join(TemperatureZone)
        
        if zone_ids:
            query = query.filter(TemperatureReading.zone_id.in_(zone_ids))
        if start_date:
            query = query.filter(TemperatureReading.time >= start_date)
        if end_date:
            query = query.filter(TemperatureReading.time <= end_date)
        
        return pd.read_sql(query.statement, self.engine)
    
    def get_temperature_stats(self, zone_ids=None, start_date=None, end_date=None):
        df = self.get_temperature_readings(zone_ids, start_date, end_date)
        if df.empty:
            return pd.DataFrame()
        
        zones_df = self.get_zones()
        
        stats = df.groupby(['zone_id', 'zone_name']).agg(
            avg_temp=('temperature', 'mean'),
            min_temp=('temperature', 'min'),
            max_temp=('temperature', 'max'),
            temp_std=('temperature', 'std'),
            avg_humidity=('humidity', 'mean'),
            reading_count=('time', 'count')
        ).reset_index()
        
        stats = stats.merge(zones_df[['id', 'target_temp_min', 'target_temp_max']], 
                           left_on='zone_id', right_on='id', how='left')
        
        stats['out_of_range_pct'] = stats.apply(
            lambda row: len(df[(df['zone_id'] == row['zone_id']) & 
                              ((df['temperature'] < row['target_temp_min']) | 
                               (df['temperature'] > row['target_temp_max']))]) / 
                        len(df[df['zone_id'] == row['zone_id']]) * 100 
                        if len(df[df['zone_id'] == row['zone_id']]) > 0 else 0,
            axis=1
        )
        
        return stats
    
    def get_batches(self, zone_ids=None, customers=None, product_types=None, 
                    batch_numbers=None, start_date=None, end_date=None, is_active=None):
        query = self.session.query(
            InventoryBatch, TemperatureZone.zone_name
        ).join(TemperatureZone, isouter=True)
        
        if zone_ids:
            query = query.filter(InventoryBatch.zone_id.in_(zone_ids))
        if customers:
            query = query.filter(InventoryBatch.customer.in_(customers))
        if product_types:
            query = query.filter(InventoryBatch.product_type.in_(product_types))
        if batch_numbers:
            query = query.filter(InventoryBatch.batch_number.in_(batch_numbers))
        if start_date:
            query = query.filter(InventoryBatch.inbound_time >= start_date)
        if end_date:
            query = query.filter(InventoryBatch.inbound_time <= end_date)
        if is_active is not None:
            query = query.filter(InventoryBatch.is_active == is_active)
        
        results = query.all()
        return pd.DataFrame([{
            'id': b.id,
            'batch_number': b.batch_number,
            'customer': b.customer,
            'product_type': b.product_type,
            'product_name': b.product_name,
            'quantity': b.quantity,
            'unit': b.unit,
            'zone_id': b.zone_id,
            'zone_name': zone_name,
            'location_id': b.location_id,
            'inbound_time': b.inbound_time,
            'expected_outbound_time': b.expected_outbound_time,
            'actual_outbound_time': b.actual_outbound_time,
            'is_active': b.is_active
        } for b, zone_name in results])
    
    def get_inbound_records(self, zone_ids=None, start_date=None, end_date=None, include_alarm_period=True):
        query = self.session.query(
            InboundRecord,
            InventoryBatch.batch_number,
            InventoryBatch.customer,
            InventoryBatch.product_type,
            TemperatureZone.zone_name
        ).join(InventoryBatch).join(TemperatureZone)
        
        if zone_ids:
            query = query.filter(InboundRecord.zone_id.in_(zone_ids))
        if start_date:
            query = query.filter(InboundRecord.inbound_time >= start_date)
        if end_date:
            query = query.filter(InboundRecord.inbound_time <= end_date)
        
        df = pd.read_sql(query.statement, self.engine)
        if not include_alarm_period:
            df = df[~df['is_during_alarm']]
        
        return df
    
    def get_outbound_records(self, zone_ids=None, start_date=None, end_date=None):
        query = self.session.query(
            OutboundRecord,
            InventoryBatch.batch_number,
            InventoryBatch.customer,
            InventoryBatch.product_type,
            TemperatureZone.zone_name
        ).join(InventoryBatch).join(TemperatureZone)
        
        if zone_ids:
            query = query.filter(OutboundRecord.zone_id.in_(zone_ids))
        if start_date:
            query = query.filter(OutboundRecord.outbound_time >= start_date)
        if end_date:
            query = query.filter(OutboundRecord.outbound_time <= end_date)
        
        return pd.read_sql(query.statement, self.engine)
    
    def get_alarms(self, zone_ids=None, start_date=None, end_date=None, severity=None):
        query = self.session.query(
            Alarm, TemperatureZone.zone_name
        ).join(TemperatureZone)
        
        if zone_ids:
            query = query.filter(Alarm.zone_id.in_(zone_ids))
        if start_date:
            query = query.filter(Alarm.alarm_start >= start_date)
        if end_date:
            query = query.filter(or_(Alarm.alarm_end <= end_date, Alarm.alarm_end.is_(None)))
        if severity:
            query = query.filter(Alarm.severity.in_(severity))
        
        results = query.all()
        df = pd.DataFrame([{
            'id': a.id,
            'alarm_start': a.alarm_start,
            'alarm_end': a.alarm_end,
            'zone_id': a.zone_id,
            'zone_name': zone_name,
            'alarm_type': a.alarm_type,
            'severity': a.severity,
            'description': a.description,
            'max_temperature': a.max_temperature,
            'min_temperature': a.min_temperature,
            'is_acknowledged': a.is_acknowledged
        } for a, zone_name in results])
        
        if not df.empty:
            df['duration_hours'] = df.apply(
                lambda row: (row['alarm_end'] - row['alarm_start']).total_seconds() / 3600 
                if row['alarm_end'] else None, axis=1
            )
        
        return df
    
    def get_door_events(self, zone_ids=None, start_date=None, end_date=None):
        query = self.session.query(
            DoorEvent, TemperatureZone.zone_name
        ).join(TemperatureZone)
        
        if zone_ids:
            query = query.filter(DoorEvent.zone_id.in_(zone_ids))
        if start_date:
            query = query.filter(DoorEvent.event_time >= start_date)
        if end_date:
            query = query.filter(DoorEvent.event_time <= end_date)
        
        results = query.all()
        return pd.DataFrame([{
            'id': d.id,
            'event_time': d.event_time,
            'zone_id': d.zone_id,
            'zone_name': zone_name,
            'door_id': d.door_id,
            'event_type': d.event_type,
            'duration_seconds': d.duration_seconds,
            'operator': d.operator
        } for d, zone_name in results])
    
    def get_manual_notes(self, related_type=None, related_id=None):
        query = self.session.query(ManualNote)
        
        if related_type:
            query = query.filter(ManualNote.related_type == related_type)
        if related_id:
            query = query.filter(ManualNote.related_id == related_id)
        
        results = query.all()
        return pd.DataFrame([{
            'id': n.id,
            'created_at': n.created_at,
            'related_type': n.related_type,
            'related_id': n.related_id,
            'note': n.note,
            'author': n.author,
            'is_anomaly': n.is_anomaly
        } for n in results])
    
    def add_manual_note(self, related_type, related_id, note, author=None, is_anomaly=False):
        new_note = ManualNote(
            related_type=related_type,
            related_id=related_id,
            note=note,
            author=author,
            is_anomaly=is_anomaly
        )
        self.session.add(new_note)
        self.session.commit()
        return new_note.id
    
    def get_customers(self):
        results = self.session.query(InventoryBatch.customer).distinct().all()
        return [r[0] for r in results]
    
    def get_product_types(self):
        results = self.session.query(InventoryBatch.product_type).distinct().all()
        return [r[0] for r in results]
    
    def get_utilization_by_zone(self, start_date=None, end_date=None):
        locations_df = self.get_locations()
        batches_df = self.get_batches(start_date=start_date, end_date=end_date, is_active=True)
        
        zone_capacity = locations_df.groupby(['zone_id', 'zone_name']).agg(
            total_capacity=('capacity_pallets', 'sum'),
            total_locations=('id', 'count')
        ).reset_index()
        
        zone_occupied = batches_df.groupby(['zone_id', 'zone_name']).agg(
            occupied_pallets=('quantity', 'sum'),
            active_batches=('id', 'count')
        ).reset_index()
        
        utilization = zone_capacity.merge(zone_occupied, on=['zone_id', 'zone_name'], how='left')
        utilization['occupied_pallets'] = utilization['occupied_pallets'].fillna(0)
        utilization['active_batches'] = utilization['active_batches'].fillna(0)
        utilization['utilization_rate'] = (utilization['occupied_pallets'] / utilization['total_capacity'] * 100).round(2)
        
        return utilization
    
    def get_utilization_by_customer(self, start_date=None, end_date=None):
        batches_df = self.get_batches(start_date=start_date, end_date=end_date, is_active=True)
        
        if batches_df.empty:
            return pd.DataFrame()
        
        customer_stats = batches_df.groupby('customer').agg(
            total_pallets=('quantity', 'sum'),
            batch_count=('id', 'count'),
            zones_used=('zone_id', 'nunique'),
            avg_storage_days=('inbound_time', lambda x: (pd.Timestamp.now() - x).dt.days.mean())
        ).reset_index()
        
        total_pallets = customer_stats['total_pallets'].sum()
        customer_stats['share_pct'] = (customer_stats['total_pallets'] / total_pallets * 100).round(2)
        
        return customer_stats.sort_values('total_pallets', ascending=False)
    
    def get_heatmap_data(self, zone_id, date=None):
        locations_df = self.get_locations(zone_id=zone_id)
        
        if date:
            start_dt = pd.Timestamp(date)
            end_dt = start_dt + timedelta(days=1)
            batches_df = self.get_batches(zone_ids=[zone_id], start_date=start_dt, end_date=end_dt)
        else:
            batches_df = self.get_batches(zone_ids=[zone_id], is_active=True)
        
        heatmap_data = locations_df.copy()
        
        occupied_locations = batches_df.groupby('location_id').agg(
            quantity=('quantity', 'sum'),
            batch_count=('id', 'count')
        ).reset_index()
        
        heatmap_data = heatmap_data.merge(
            occupied_locations, left_on='id', right_on='location_id', how='left'
        )
        
        heatmap_data['is_occupied'] = heatmap_data['quantity'].notna()
        heatmap_data['quantity'] = heatmap_data['quantity'].fillna(0)
        heatmap_data['batch_count'] = heatmap_data['batch_count'].fillna(0)
        
        return heatmap_data
    
    def close(self):
        self.session.close()
