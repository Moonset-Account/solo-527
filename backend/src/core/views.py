from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.services import DashboardService


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = DashboardService.get_overview_stats(request.user)
        return Response(data)


class DashboardPickupTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        data = DashboardService.get_pickup_trend(request.user, days)
        return Response(data)


class DashboardClassUtilizationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = DashboardService.get_class_utilization(request.user)
        return Response(data)


class DashboardStatusBreakdownView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = DashboardService.get_status_breakdown(request.user)
        return Response(data)
