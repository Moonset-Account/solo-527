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
    permission_classes = [IsAdminOrNurseOrDoctor()]

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

        result = []
        for key, value in stats.items():
            is_patient_fault = key == 'PATIENT_NO_SHOW' or (
                key != 'PATIENT_NO_SHOW' and value.get('label') == '患者主动申请'
            )
            result.append({
                'category_code': key,
                'category_label': value['label'],
                'count': value['count'],
                'is_patient_fault': is_patient_fault,
                'note': '不算患者爽约' if not is_patient_fault else '算患者爽约'
            })

        total_cancelled = sum(item['count'] for item in result)
        patient_fault_count = sum(item['count'] for item in result if item['is_patient_fault'])
        non_patient_fault_count = sum(item['count'] for item in result if not item['is_patient_fault'])

        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'breakdown': result,
            'total_cancelled': total_cancelled,
            'patient_fault_count': patient_fault_count,
            'non_patient_fault_count': non_patient_fault_count,
            'patient_fault_rate': (patient_fault_count / total_cancelled * 100) if total_cancelled > 0 else 0,
            'non_patient_fault_rate': (non_patient_fault_count / total_cancelled * 100) if total_cancelled > 0 else 0,
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
