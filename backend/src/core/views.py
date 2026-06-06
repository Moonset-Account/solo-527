from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.services import DashboardService


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = {
            'class_id': request.query_params.get('class_id'),
            'teacher_id': request.query_params.get('teacher_id'),
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'status': request.query_params.get('status'),
        }
        data = DashboardService.get_overview_stats(request.user, filters)
        return Response(data)


class DashboardPickupTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        filters = {
            'class_id': request.query_params.get('class_id'),
            'teacher_id': request.query_params.get('teacher_id'),
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'status': request.query_params.get('status'),
        }
        data = DashboardService.get_pickup_trend(request.user, days, filters)
        return Response(data)


class DashboardClassUtilizationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = {
            'class_id': request.query_params.get('class_id'),
            'teacher_id': request.query_params.get('teacher_id'),
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'status': request.query_params.get('status'),
        }
        data = DashboardService.get_class_utilization(request.user, filters)
        return Response(data)


class DashboardStatusBreakdownView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = {
            'class_id': request.query_params.get('class_id'),
            'teacher_id': request.query_params.get('teacher_id'),
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'status': request.query_params.get('status'),
        }
        data = DashboardService.get_status_breakdown(request.user, filters)
        return Response(data)
