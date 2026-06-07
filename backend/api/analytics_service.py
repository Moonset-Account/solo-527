import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from typing import List, Dict, Optional, Tuple

try:
    from backend.db.models import Member, Checkin, Booking, Coach, Course, Store, \
        MemberType, Suspension, PTPurchase, Feedback, BodyMeasurement
    from backend.cache.redis_cache import cache
except ImportError:
    from db.models import Member, Checkin, Booking, Coach, Course, Store, \
        MemberType, Suspension, PTPurchase, Feedback, BodyMeasurement
    from cache.redis_cache import cache

MIN_SAMPLE_SIZE = 30

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
    
    def _check_sample_size(self, count: int) -> Tuple[bool, Optional[str]]:
        if count < MIN_SAMPLE_SIZE:
            return True, f"样本量不足（当前{count}人，建议不少于{MIN_SAMPLE_SIZE}人）"
        return False, None
    
    def _get_active_members_query(self, filters: Dict):
        query = self.db.query(Member).filter(Member.status == 'active')
        
        if filters.get('member_type_ids'):
            query = query.filter(Member.member_type_id.in_(filters['member_type_ids']))
        if filters.get('store_ids'):
            query = query.filter(Member.store_id.in_(filters['store_ids']))
        if filters.get('coach_ids'):
            pt_members = self.db.query(PTPurchase.member_id).filter(
                PTPurchase.coach_id.in_(filters['coach_ids'])
            ).subquery()
            query = query.filter(Member.id.in_(pt_members))
        
        return query
    
    def _get_member_suspensions(self, member_ids: List[int]) -> Dict[int, List]:
        suspensions = self.db.query(Suspension).filter(
            Suspension.member_id.in_(member_ids),
            Suspension.status == 'approved'
        ).all()
        
        susp_map = {}
        for s in suspensions:
            if s.member_id not in susp_map:
                susp_map[s.member_id] = []
            susp_map[s.member_id].append((s.start_date, s.end_date))
        return susp_map
    
    def _is_member_suspended(self, member_id: int, check_date: datetime, 
                             susp_map: Dict[int, List]) -> bool:
        if member_id not in susp_map:
            return False
        
        check_date = check_date.date()
        for start, end in susp_map[member_id]:
            if start <= check_date <= end:
                return True
        return False
    
    def _apply_month_filter(self, query, date_column, filters: Dict):
        if filters.get('month'):
            try:
                year, month = map(int, filters['month'].split('-'))
                start_date = datetime(year, month, 1).date()
                if month == 12:
                    end_date = datetime(year + 1, 1, 1).date()
                else:
                    end_date = datetime(year, month + 1, 1).date()
                query = query.filter(
                    date_column >= start_date,
                    date_column < end_date
                )
            except (ValueError, AttributeError):
                pass
        return query
    
    def get_anomaly_summary(self, filters: Dict) -> Dict:
        cache_key = cache.generate_key("anomaly_summary", **filters)
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        today = datetime.now().date()
        thirty_days_ago = today - timedelta(days=30)
        sixty_days_ago = today - timedelta(days=60)
        
        anomalies = []
        warnings = []
        
        active_members = self._get_active_members_query(filters).all()
        member_ids = [m.id for m in active_members]
        
        checkins_30d = self.db.query(Checkin).filter(
            Checkin.member_id.in_(member_ids),
            Checkin.checkin_time >= thirty_days_ago
        ).count()
        
        checkins_prev_30d = self.db.query(Checkin).filter(
            Checkin.member_id.in_(member_ids),
            Checkin.checkin_time >= sixty_days_ago,
            Checkin.checkin_time < thirty_days_ago
        ).count()
        
        if checkins_prev_30d > 0:
            checkin_change = (checkins_30d - checkins_prev_30d) / checkins_prev_30d
            if abs(checkin_change) > 0.5:
                anomalies.append({
                    "type": "checkin_volume",
                    "severity": "high" if abs(checkin_change) > 0.5 else "medium",
                    "message": f"近30天签到量环比{checkins_prev_30d}天{ '上升' if checkin_change > 0 else '下降' }{abs(checkin_change)*100:.1f}%",
                    "value": checkin_change
                })
        
        churned_count = 0
        susp_map = self._get_member_suspensions(member_ids)
        
        for member in active_members:
            last_checkin = self.db.query(Checkin).filter(
                Checkin.member_id == member.id
            ).order_by(Checkin.checkin_time.desc()).first()
            
            if last_checkin:
                days_inactive = (today - last_checkin.checkin_time.date()).days
                if not self._is_member_suspended(member.id, datetime.combine(today, datetime.min.time()), susp_map):
                    if days_inactive > 30:
                        churned_count += 1
        
        churn_rate = churned_count / len(active_members) if active_members else 0
        if churn_rate > 0.2:
            anomalies.append({
                "type": "churn_rate",
                "severity": "high",
                "message": f"当前月流失率达{churn_rate*100:.1f}%，超过20%警戒线",
                "value": churn_rate
            })
        
        cancelled_bookings = self.db.query(Booking).filter(
            Booking.member_id.in_(member_ids),
            Booking.booking_date >= thirty_days_ago,
            Booking.status == 'cancelled'
        ).count()
        
        total_bookings = self.db.query(Booking).filter(
            Booking.member_id.in_(member_ids),
            Booking.booking_date >= thirty_days_ago
        ).count()
        
        if total_bookings > 0:
            cancel_rate = cancelled_bookings / total_bookings
            if cancel_rate > 0.4:
                anomalies.append({
                    "type": "booking_cancel",
                    "severity": "medium",
                    "message": f"近30天课程取消率达{cancel_rate*100:.1f}%，超过40%警戒线",
                    "value": cancel_rate
                })
        
        avg_rating = self.db.query(func.avg(Feedback.rating)).filter(
            Feedback.member_id.in_(member_ids),
            Feedback.feedback_date >= thirty_days_ago
        ).scalar()
        
        if avg_rating and avg_rating < 3:
            anomalies.append({
                "type": "feedback_rating",
                "severity": "medium",
                "message": f"近30天会员平均评分{avg_rating:.1f}分，低于3分",
                "value": avg_rating
            })
        
        sample_warn, warn_msg = self._check_sample_size(len(active_members))
        if sample_warn:
            warnings.append(warn_msg)
        
        result = {
            "anomalies": sorted(anomalies, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["severity"]]),
            "warnings": warnings,
            "summary_stats": {
                "active_members": len(active_members),
                "checkins_30d": checkins_30d,
                "churn_rate": churn_rate,
                "avg_rating": float(avg_rating) if avg_rating else None
            }
        }
        
        cache.set(cache_key, result, ttl=1800)
        return result
    
    def get_retention_cohort(self, filters: Dict, months: int = 6) -> Dict:
        cache_key = cache.generate_key("retention_cohort", months=months, **filters)
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        members = self._get_active_members_query(filters).all()
        member_ids = [m.id for m in members]
        
        cohort_data = []
        warnings = []
        
        member_join_dates = {}
        for m in members:
            member_join_dates[m.id] = m.join_date
        
        join_months = sorted(set(
            pd.Timestamp(d).to_period('M') for d in member_join_dates.values()
        ))
        
        if len(join_months) > months + 1:
            join_months = join_months[-(months + 1):]
        
        susp_map = self._get_member_suspensions(member_ids)
        
        for cohort_month in join_months:
            cohort_member_ids = [
                mid for mid, jd in member_join_dates.items()
                if pd.Timestamp(jd).to_period('M') == cohort_month
            ]
            
            cohort_size = len(cohort_member_ids)
            sample_warn, warn_msg = self._check_sample_size(cohort_size)
            if sample_warn:
                warnings.append(f"{cohort_month}组{warn_msg}")
            
            retention = []
            for month_offset in range(months + 1):
                target_month_start = (cohort_month + month_offset).to_timestamp()
                target_month_end = (cohort_month + month_offset + 1).to_timestamp()
                
                active_count = 0
                eligible_count = 0
                
                for mid in cohort_member_ids:
                    member_suspended_in_month = any(
                        start <= target_month_end.date() and end >= target_month_start.date()
                        for start, end in susp_map.get(mid, [])
                    )
                    
                    if member_suspended_in_month:
                        continue
                    
                    eligible_count += 1
                    
                    has_checkin = self.db.query(Checkin).filter(
                        Checkin.member_id == mid,
                        Checkin.checkin_time >= target_month_start,
                        Checkin.checkin_time < target_month_end
                    ).first()
                    
                    if has_checkin:
                        active_count += 1
                
                rate = active_count / eligible_count if eligible_count > 0 else None
                retention.append(rate)
            
            cohort_data.append({
                "cohort_month": str(cohort_month),
                "cohort_size": cohort_size,
                "retention": retention,
                "sample_warning": sample_warn
            })
        
        result = {
            "cohort_data": cohort_data,
            "warnings": warnings,
            "months": months
        }
        
        cache.set(cache_key, result, ttl=3600)
        return result
    
    def get_course_heatmap(self, filters: Dict) -> Dict:
        cache_key = cache.generate_key("course_heatmap", **filters)
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        
        query = self.db.query(
            Course.id,
            Course.name,
            Course.category,
            Course.capacity,
            func.count(Booking.id).label('total_bookings'),
            func.sum(case((Booking.status == 'checked_in', 1), else_=0)).label('checked_in'),
            func.sum(case((Booking.status == 'cancelled', 1), else_=0)).label('cancelled')
        ).select_from(Course).join(Booking, Course.id == Booking.course_id, isouter=True)
        
        if filters.get('course_ids'):
            query = query.filter(Course.id.in_(filters['course_ids']))
        if filters.get('store_ids'):
            query = query.filter(Booking.store_id.in_(filters['store_ids']))
        if filters.get('coach_ids'):
            query = query.filter(Booking.coach_id.in_(filters['coach_ids']))
        
        query = query.filter(
            Booking.booking_date >= thirty_days_ago
        ).group_by(Course.id, Course.name, Course.category, Course.capacity)
        
        course_data = []
        for row in query.all():
            total = row.total_bookings or 0
            checked_in = row.checked_in or 0
            cancelled = row.cancelled or 0
            
            booking_rate = min(total / row.capacity, 1) if row.capacity and total > 0 else 0
            checkin_rate = checked_in / total if total > 0 else 0
            cancel_rate = cancelled / total if total > 0 else 0
            
            hot_score = (booking_rate * 0.5 + checkin_rate * 0.3 + (1 - cancel_rate) * 0.2)
            
            course_data.append({
                "course_id": row.id,
                "name": row.name,
                "category": row.category,
                "total_bookings": total,
                "capacity": row.capacity,
                "booking_rate": booking_rate,
                "checkin_rate": checkin_rate,
                "cancel_rate": cancel_rate,
                "hot_score": hot_score
            })
        
        course_data.sort(key=lambda x: x["hot_score"], reverse=True)
        
        sample_warn, warn_msg = self._check_sample_size(len(course_data))
        warnings = [warn_msg] if sample_warn else []
        
        result = {
            "courses": course_data,
            "warnings": warnings
        }
        
        cache.set(cache_key, result, ttl=3600)
        return result
    
    def get_coach_load(self, filters: Dict) -> Dict:
        cache_key = cache.generate_key("coach_load", **filters)
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        
        query = self.db.query(
            Coach.id,
            Coach.name,
            Coach.level,
            Store.name.label('store_name'),
            func.count(Booking.id).label('total_classes')
        ).join(Store, Coach.store_id == Store.id, isouter=True)\
         .join(Booking, Coach.id == Booking.coach_id, isouter=True)
        
        if filters.get('coach_ids'):
            query = query.filter(Coach.id.in_(filters['coach_ids']))
        if filters.get('store_ids'):
            query = query.filter(Coach.store_id.in_(filters['store_ids']))
        
        query = query.filter(
            Booking.booking_date >= thirty_days_ago,
            Booking.status == 'checked_in'
        ).group_by(Coach.id, Coach.name, Coach.level, Store.name)
        
        coach_data = []
        for row in query.all():
            weekly_hours = (row.total_classes or 0) * 1 / 4.33
            
            pt_students = self.db.query(PTPurchase.member_id).filter(
                PTPurchase.coach_id == row.id
            ).distinct().count()
            
            pt_conversion = 0
            total_measured = self.db.query(BodyMeasurement.member_id).filter(
                BodyMeasurement.coach_id == row.id
            ).distinct().count()
            if total_measured > 0:
                pt_conversion = pt_students / total_measured
            
            student_ids = self.db.query(PTPurchase.member_id).filter(
                PTPurchase.coach_id == row.id
            ).distinct().all()
            student_ids = [s[0] for s in student_ids]
            
            retention_rate = 0
            if student_ids:
                active_count = 0
                for sid in student_ids:
                    has_checkin = self.db.query(Checkin).filter(
                        Checkin.member_id == sid,
                        Checkin.checkin_time >= thirty_days_ago
                    ).first()
                    if has_checkin:
                        active_count += 1
                retention_rate = active_count / len(student_ids) if student_ids else 0
            
            coach_data.append({
                "coach_id": row.id,
                "name": row.name,
                "level": row.level,
                "store": row.store_name,
                "weekly_hours": round(weekly_hours, 1),
                "student_count": pt_students,
                "pt_conversion": pt_conversion,
                "retention_rate": retention_rate
            })
        
        sample_warn, warn_msg = self._check_sample_size(len(coach_data))
        warnings = [warn_msg] if sample_warn else []
        
        result = {
            "coaches": coach_data,
            "warnings": warnings
        }
        
        cache.set(cache_key, result, ttl=3600)
        return result
    
    def get_churn_warning_list(self, filters: Dict, limit: int = 100) -> Dict:
        cache_key = cache.generate_key("churn_warning", limit=limit, **filters)
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        today = datetime.now().date()
        members = self._get_active_members_query(filters).all()
        member_ids = [m.id for m in members]
        
        if filters.get('coach_ids'):
            coach_member_ids = set()
            pt_members = self.db.query(PTPurchase.member_id).filter(
                PTPurchase.coach_id.in_(filters['coach_ids'])
            ).all()
            for m in pt_members:
                coach_member_ids.add(m.member_id)
            
            booking_members = self.db.query(Booking.member_id).filter(
                Booking.coach_id.in_(filters['coach_ids'])
            ).all()
            for m in booking_members:
                coach_member_ids.add(m.member_id)
            
            member_ids = [mid for mid in member_ids if mid in coach_member_ids]
            members = [m for m in members if m.id in member_ids]
        
        if filters.get('course_ids'):
            course_member_ids = set()
            booking_members = self.db.query(Booking.member_id).filter(
                Booking.course_id.in_(filters['course_ids'])
            ).all()
            for m in booking_members:
                course_member_ids.add(m.member_id)
            
            member_ids = [mid for mid in member_ids if mid in course_member_ids]
            members = [m for m in members if m.id in member_ids]
        
        if filters.get('month'):
            try:
                year, month = map(int, filters['month'].split('-'))
                month_start = datetime(year, month, 1).date()
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date()
                else:
                    month_end = datetime(year, month + 1, 1).date()
                
                month_member_ids = set()
                checkin_members = self.db.query(Checkin.member_id).filter(
                    Checkin.member_id.in_(member_ids),
                    Checkin.checkin_time >= month_start,
                    Checkin.checkin_time < month_end
                ).all()
                for m in checkin_members:
                    month_member_ids.add(m.member_id)
                
                booking_members = self.db.query(Booking.member_id).filter(
                    Booking.member_id.in_(member_ids),
                    Booking.booking_date >= month_start,
                    Booking.booking_date < month_end
                ).all()
                for m in booking_members:
                    month_member_ids.add(m.member_id)
                
                member_ids = [mid for mid in member_ids if mid in month_member_ids]
                members = [m for m in members if m.id in member_ids]
            except (ValueError, AttributeError):
                pass
        
        susp_map = self._get_member_suspensions(member_ids)
        
        high_risk = []
        medium_risk = []
        low_risk = []
        
        member_type_map = {mt.id: mt.name for mt in self.db.query(MemberType).all()}
        store_map = {s.id: s.name for s in self.db.query(Store).all()}
        
        for member in members:
            last_checkin_query = self.db.query(Checkin).filter(
                Checkin.member_id == member.id
            )
            last_checkin = last_checkin_query.order_by(Checkin.checkin_time.desc()).first()
            
            if not last_checkin:
                continue
            
            days_inactive = (today - last_checkin.checkin_time.date()).days
            
            if self._is_member_suspended(member.id, datetime.combine(today, datetime.min.time()), susp_map):
                continue
            
            freq_query = self.db.query(Checkin).filter(
                Checkin.member_id == member.id,
                Checkin.checkin_time >= today - timedelta(days=90)
            )
            checkins_90d = freq_query.count()
            avg_weekly_freq = checkins_90d / 12.86 if checkins_90d > 0 else 0
            
            member_info = {
                "member_id": member.id,
                "name": member.name,
                "member_type": member_type_map.get(member.member_type_id, '未知'),
                "store": store_map.get(member.store_id, '未知'),
                "join_date": str(member.join_date),
                "last_checkin": str(last_checkin.checkin_time.date()),
                "days_inactive": days_inactive,
                "avg_weekly_freq": round(avg_weekly_freq, 2),
                "risk_level": ""
            }
            
            if avg_weekly_freq >= 2 and days_inactive >= 7:
                member_info["risk_level"] = "高风险"
                high_risk.append(member_info)
            elif days_inactive >= 30:
                member_info["risk_level"] = "高风险"
                high_risk.append(member_info)
            elif days_inactive >= 14:
                member_info["risk_level"] = "中风险"
                medium_risk.append(member_info)
            elif days_inactive >= 7:
                member_info["risk_level"] = "低风险"
                low_risk.append(member_info)
        
        high_risk.sort(key=lambda x: x["days_inactive"], reverse=True)
        medium_risk.sort(key=lambda x: x["days_inactive"], reverse=True)
        low_risk.sort(key=lambda x: x["days_inactive"], reverse=True)
        
        all_warnings = high_risk + medium_risk + low_risk
        result_list = all_warnings[:limit]
        
        sample_warn, warn_msg = self._check_sample_size(len(all_warnings))
        warnings = [warn_msg] if sample_warn else []
        
        result = {
            "high_risk_count": len(high_risk),
            "medium_risk_count": len(medium_risk),
            "low_risk_count": len(low_risk),
            "members": result_list,
            "warnings": warnings
        }
        
        cache.set(cache_key, result, ttl=1800)
        return result
    
    def get_filters_options(self) -> Dict:
        stores = self.db.query(Store.id, Store.name).all()
        coaches = self.db.query(Coach.id, Coach.name, Store.name.label('store_name'))\
            .join(Store, Coach.store_id == Store.id).all()
        courses = self.db.query(Course.id, Course.name, Course.category).all()
        member_types = self.db.query(MemberType.id, MemberType.name).all()
        
        return {
            "stores": [{"id": s.id, "name": s.name} for s in stores],
            "coaches": [{"id": c.id, "name": c.name, "store": c.store_name} for c in coaches],
            "courses": [{"id": c.id, "name": c.name, "category": c.category} for c in courses],
            "member_types": [{"id": mt.id, "name": mt.name} for mt in member_types]
        }
