from django.db import models
from django.db.models import Count, Q, F
from django.utils import timezone
from datetime import date, timedelta
from appointments.models import Appointment, RescheduleReason
from patients.models import PatientProfile
from doctors.models import DoctorProfile, DailySlot


class AppointmentReportService:
    @staticmethod
    def get_appointment_summary(start_date, end_date):
        appointments = Appointment.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )

        total = appointments.count()
        completed = appointments.filter(status='COMPLETED').count()
        cancelled = appointments.filter(status='CANCELLED').count()
        no_show = appointments.filter(status='NO_SHOW').count()
        rescheduled = appointments.filter(status='RESCHEDULED').count()
        booked = appointments.filter(status='BOOKED').count()

        return {
            'total': total,
            'completed': completed,
            'cancelled': cancelled,
            'no_show': no_show,
            'rescheduled': rescheduled,
            'booked': booked,
            'completion_rate': (completed / total * 100) if total > 0 else 0,
        }

    @staticmethod
    def get_cancellation_reason_stats(start_date, end_date):
        from appointments.models import Appointment
        from django.db.models import Count

        all_records = Appointment.objects.filter(
            models.Q(
                cancelled_at__date__gte=start_date,
                cancelled_at__date__lte=end_date,
                status__in=['CANCELLED', 'RESCHEDULED']
            ) | models.Q(
                status='NO_SHOW',
                updated_at__date__gte=start_date,
                updated_at__date__lte=end_date
            )
        ).select_related('reschedule_reason')

        stats = {}
        for category, label in RescheduleReason.Category.choices:
            cancelled_count = all_records.filter(
                status__in=['CANCELLED', 'RESCHEDULED'],
                reschedule_reason__category=category
            ).count()
            stats[f'CANCEL_{category}'] = {
                'type': 'cancellation',
                'category_code': category,
                'category_label': label,
                'label': f'{label}（取消/改期）',
                'count': cancelled_count,
                'is_patient_fault': category == 'PATIENT_REQUEST',
                'note': '患者主动申请算患者责任，其他不算' if category == 'PATIENT_REQUEST' else '不算患者责任'
            }

        no_category_count = all_records.filter(
            status__in=['CANCELLED', 'RESCHEDULED'],
            reschedule_reason__isnull=True
        ).count()

        stats['CANCEL_UNKNOWN'] = {
            'type': 'cancellation',
            'category_code': 'UNKNOWN',
            'category_label': '未分类',
            'label': '未分类（取消/改期）',
            'count': no_category_count,
            'is_patient_fault': False,
            'note': '不算患者责任'
        }

        no_show_count = all_records.filter(status='NO_SHOW').count()
        stats['NO_SHOW'] = {
            'type': 'no_show',
            'category_code': 'NO_SHOW',
            'category_label': '患者爽约',
            'label': '患者爽约（未到诊）',
            'count': no_show_count,
            'is_patient_fault': True,
            'note': '算患者责任'
        }

        return stats

    @staticmethod
    def get_doctor_appointment_stats(start_date, end_date):
        from django.db.models import Count

        stats = Appointment.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).values(
            'doctor__id',
            'doctor__name',
            'doctor__department__name'
        ).annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='COMPLETED')),
            cancelled=Count('id', filter=Q(status='CANCELLED')),
            no_show=Count('id', filter=Q(status='NO_SHOW')),
        ).order_by('-total')

        return list(stats)

    @staticmethod
    def get_daily_appointment_trend(start_date, end_date):
        from django.db.models.functions import TruncDate

        trend = Appointment.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id'),
            completed=Count('id', filter=Q(status='COMPLETED')),
            cancelled=Count('id', filter=Q(status='CANCELLED')),
        ).order_by('date')

        return list(trend)

    @staticmethod
    def get_department_stats(start_date, end_date):
        stats = Appointment.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).values(
            'doctor__department__name'
        ).annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='COMPLETED')),
        ).order_by('-total')

        return list(stats)


class PatientReportService:
    @staticmethod
    def get_patient_summary():
        total = PatientProfile.objects.filter(is_active=True).count()
        needs_confirmation = PatientProfile.objects.filter(
            needs_confirmation=True,
            is_active=True
        ).count()
        no_show_patients = PatientProfile.objects.filter(
            no_show_count__gt=0,
            is_active=True
        ).count()

        return {
            'total_patients': total,
            'needs_confirmation': needs_confirmation,
            'has_no_show': no_show_patients,
        }

    @staticmethod
    def get_chronic_disease_stats():
        from patients.models import ChronicDisease

        stats = ChronicDisease.objects.filter(
            is_active=True
        ).annotate(
            patient_count=Count('patients')
        ).values('name', 'patient_count').order_by('-patient_count')

        return list(stats)

    @staticmethod
    def get_no_show_ranking(limit=10):
        patients = PatientProfile.objects.filter(
            no_show_count__gt=0,
            is_active=True
        ).order_by('-no_show_count')[:limit]

        return [
            {
                'patient_no': p.patient_no,
                'name': p.name,
                'no_show_count': p.no_show_count,
                'needs_confirmation': p.needs_confirmation,
            }
            for p in patients
        ]


class DoctorReportService:
    @staticmethod
    def get_doctor_summary():
        total = DoctorProfile.objects.filter(is_active=True).count()
        departments = DoctorProfile.objects.filter(
            is_active=True
        ).values('department__name').annotate(
            count=Count('id')
        )

        return {
            'total_doctors': total,
            'by_department': list(departments),
        }

    @staticmethod
    def get_slot_utilization(start_date, end_date):
        slots = DailySlot.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).select_related('doctor')

        stats = []
        for slot in slots:
            total_capacity = slot.max_patients
            booked = slot.booked_count
            utilization = (booked / total_capacity * 100) if total_capacity > 0 else 0

            stats.append({
                'doctor': slot.doctor.name,
                'date': slot.date,
                'shift': slot.get_shift_display(),
                'total_capacity': total_capacity,
                'booked': booked,
                'utilization_rate': utilization,
                'status': slot.get_status_display(),
            })

        return stats


class ReportExporter:
    @staticmethod
    def export_to_csv(data, filename):
        import csv
        from django.http import HttpResponse
        from io import StringIO

        buffer = StringIO()
        if data:
            writer = csv.DictWriter(buffer, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)

        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        return response
