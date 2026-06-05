from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date, timedelta
from django.utils import timezone
from .services import (
    AppointmentReportService, PatientReportService,
    DoctorReportService
)
from core.permissions import IsAdminOrNurseOrDoctor


class ReportViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminOrNurseOrDoctor]

    def get_date_range(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if not date_from:
            date_from = (timezone.now() - timedelta(days=30)).date().isoformat()
        if not date_to:
            date_to = timezone.now().date().isoformat()
        return date_from, date_to

    @action(detail=False, methods=['get'], url_path='appointment-summary')
    def appointment_summary(self, request):
        date_from, date_to = self.get_date_range(request)
        data = AppointmentReportService.get_appointment_summary(date_from, date_to)
        return Response({
            'date_from': date_from,
            'date_to': date_to,
            **data
        })

    @action(detail=False, methods=['get'], url_path='cancellation-reason-stats')
    def cancellation_reason_stats(self, request):
        date_from, date_to = self.get_date_range(request)
        stats = AppointmentReportService.get_cancellation_reason_stats(date_from, date_to)

        breakdown = list(stats.values())

        total_records = sum(item['count'] for item in breakdown)
        patient_fault_count = sum(item['count'] for item in breakdown if item['is_patient_fault'])
        non_patient_fault_count = sum(item['count'] for item in breakdown if not item['is_patient_fault'])

        cancellation_count = sum(item['count'] for item in breakdown if item['type'] == 'cancellation')
        no_show_count = sum(item['count'] for item in breakdown if item['type'] == 'no_show')

        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'breakdown': breakdown,
            'summary': {
                'total_records': total_records,
                'total_cancellations': cancellation_count,
                'total_no_shows': no_show_count,
                'patient_fault_count': patient_fault_count,
                'non_patient_fault_count': non_patient_fault_count,
                'patient_fault_rate': (patient_fault_count / total_records * 100) if total_records > 0 else 0,
                'non_patient_fault_rate': (non_patient_fault_count / total_records * 100) if total_records > 0 else 0,
            },
            'explanation': {
                '患者主动申请改期': '算患者责任，但不算"爽约"',
                '患者爽约（未到诊）': '算患者责任，计入爽约次数',
                '医生停诊': '不算患者责任',
                '药品缺货': '不算患者责任',
                '其他原因': '不算患者责任',
            }
        })

    @action(detail=False, methods=['get'], url_path='doctor-appointment-stats')
    def doctor_appointment_stats(self, request):
        date_from, date_to = self.get_date_range(request)
        data = AppointmentReportService.get_doctor_appointment_stats(date_from, date_to)
        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'results': data
        })

    @action(detail=False, methods=['get'], url_path='daily-trend')
    def daily_trend(self, request):
        date_from, date_to = self.get_date_range(request)
        data = AppointmentReportService.get_daily_appointment_trend(date_from, date_to)
        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'results': data
        })

    @action(detail=False, methods=['get'], url_path='department-stats')
    def department_stats(self, request):
        date_from, date_to = self.get_date_range(request)
        data = AppointmentReportService.get_department_stats(date_from, date_to)
        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'results': data
        })

    @action(detail=False, methods=['get'], url_path='patient-summary')
    def patient_summary(self, request):
        data = PatientReportService.get_patient_summary()
        return Response(data)

    @action(detail=False, methods=['get'], url_path='chronic-disease-stats')
    def chronic_disease_stats(self, request):
        data = PatientReportService.get_chronic_disease_stats()
        return Response({'results': data})

    @action(detail=False, methods=['get'], url_path='no-show-ranking')
    def no_show_ranking(self, request):
        limit = int(request.query_params.get('limit', 10))
        data = PatientReportService.get_no_show_ranking(limit)
        return Response({'results': data})

    @action(detail=False, methods=['get'], url_path='doctor-summary')
    def doctor_summary(self, request):
        data = DoctorReportService.get_doctor_summary()
        return Response(data)

    @action(detail=False, methods=['get'], url_path='slot-utilization')
    def slot_utilization(self, request):
        date_from, date_to = self.get_date_range(request)
        data = DoctorReportService.get_slot_utilization(date_from, date_to)
        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'results': data
        })
