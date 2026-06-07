import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataCleaner:
    def __init__(self):
        self.cleaning_stats = {}
    
    def clean_members(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("开始清洗会员数据...")
        initial_count = len(df)
        
        df = df[~df['phone'].astype(str).str.contains('TEST', case=False, na=False)]
        df = df[df['status'] != 'test']
        
        df['age'] = df['age'].fillna(
            df.groupby('member_type_id')['age'].transform('median')
        )
        
        df['join_date'] = pd.to_datetime(df['join_date']).dt.date
        df['expire_date'] = pd.to_datetime(df['expire_date']).dt.date
        
        cleaned_count = len(df)
        self.cleaning_stats['members_removed'] = initial_count - cleaned_count
        logger.info(f"会员数据清洗完成，移除 {initial_count - cleaned_count} 条记录")
        return df
    
    def clean_checkins(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("开始清洗签到数据...")
        initial_count = len(df)
        
        df['checkin_time'] = pd.to_datetime(df['checkin_time'])
        df = df.sort_values(['member_id', 'checkin_time'])
        
        df['time_diff'] = df.groupby('member_id')['checkin_time'].diff().dt.total_seconds()
        df = df[~((df['time_diff'] < 3600) & (df['time_diff'].notna()))]
        df = df.drop(columns=['time_diff'])
        
        if 'checkout_time' in df.columns:
            df['checkout_time'] = pd.to_datetime(df['checkout_time'])
            df['duration'] = (df['checkout_time'] - df['checkin_time']).dt.total_seconds() / 60
            df = df[(df['duration'].isna()) | (df['duration'] >= 5) & (df['duration'] <= 360)]
        
        cleaned_count = len(df)
        self.cleaning_stats['checkins_removed'] = initial_count - cleaned_count
        logger.info(f"签到数据清洗完成，移除 {initial_count - cleaned_count} 条记录")
        return df
    
    def clean_bookings(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("开始清洗预约数据...")
        initial_count = len(df)
        
        df['booking_date'] = pd.to_datetime(df['booking_date']).dt.date
        df = df[df['status'].isin(['booked', 'checked_in', 'cancelled', 'no_show'])]
        
        cleaned_count = len(df)
        self.cleaning_stats['bookings_removed'] = initial_count - cleaned_count
        logger.info(f"预约数据清洗完成，移除 {initial_count - cleaned_count} 条记录")
        return df
    
    def clean_suspensions(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("开始清洗停卡数据...")
        initial_count = len(df)
        
        df['start_date'] = pd.to_datetime(df['start_date']).dt.date
        df['end_date'] = pd.to_datetime(df['end_date']).dt.date
        df['reason'] = df['reason'].fillna('未说明')
        df = df[df['status'] == 'approved']
        
        cleaned_count = len(df)
        self.cleaning_stats['suspensions_removed'] = initial_count - cleaned_count
        logger.info(f"停卡数据清洗完成，移除 {initial_count - cleaned_count} 条记录")
        return df
    
    def exclude_suspension_periods(self, checkins_df: pd.DataFrame, 
                                    suspensions_df: pd.DataFrame) -> pd.DataFrame:
        logger.info("排除停卡期间的签到记录...")
        
        if suspensions_df.empty:
            return checkins_df
        
        checkins_df = checkins_df.copy()
        checkins_df['checkin_date'] = pd.to_datetime(checkins_df['checkin_time']).dt.date
        
        mask = pd.Series([True] * len(checkins_df), index=checkins_df.index)
        
        for _, susp in suspensions_df.iterrows():
            susp_mask = (
                (checkins_df['member_id'] == susp['member_id']) &
                (checkins_df['checkin_date'] >= susp['start_date']) &
                (checkins_df['checkin_date'] <= susp['end_date'])
            )
            mask = mask & ~susp_mask
        
        result = checkins_df[mask].drop(columns=['checkin_date'])
        logger.info(f"排除停卡期间签到，移除 {len(checkins_df) - len(result)} 条记录")
        return result
    
    def get_cleaning_report(self) -> Dict:
        return self.cleaning_stats
