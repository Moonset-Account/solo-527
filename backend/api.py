import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.data_service import data_service

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'air-quality-dashboard-api'})

@app.route('/api/stations', methods=['GET'])
def get_stations():
    districts = request.args.getlist('districts')
    stations_df = data_service.get_stations(districts if districts else None)
    return jsonify(stations_df.to_dict('records'))

@app.route('/api/air-quality/hourly', methods=['POST'])
def get_air_quality_hourly():
    filters = request.get_json() or {}
    data = data_service.get_air_quality_hourly(filters)
    data['hour_bucket'] = data['hour_bucket'].astype(str)
    return jsonify(data.to_dict('records'))

@app.route('/api/air-quality/daily', methods=['POST'])
def get_air_quality_daily():
    filters = request.get_json() or {}
    data = data_service.get_air_quality_daily(filters)
    data['day_bucket'] = data['day_bucket'].astype(str)
    return jsonify(data.to_dict('records'))

@app.route('/api/air-quality/raw', methods=['POST'])
def get_air_quality_raw():
    filters = request.get_json() or {}
    data = data_service.get_air_quality_raw(filters)
    data['timestamp'] = data['timestamp'].astype(str)
    return jsonify(data.to_dict('records'))

@app.route('/api/traffic/hourly', methods=['POST'])
def get_traffic_hourly():
    filters = request.get_json() or {}
    data = data_service.get_traffic_hourly(filters)
    data['hour_bucket'] = data['hour_bucket'].astype(str)
    return jsonify(data.to_dict('records'))

@app.route('/api/construction-sites', methods=['GET'])
def get_construction_sites():
    districts = request.args.getlist('districts')
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    sites = data_service.get_construction_sites(
        districts if districts else None,
        active_only
    )
    return jsonify(sites.to_dict('records'))

@app.route('/api/complaints', methods=['POST'])
def get_complaints():
    filters = request.get_json() or {}
    is_public = request.args.get('public', 'true').lower() == 'true'
    data = data_service.get_complaints(filters, is_public=is_public)
    data['timestamp'] = data['timestamp'].astype(str)
    if 'verified_at' in data.columns:
        data['verified_at'] = data['verified_at'].astype(str)
    return jsonify(data.to_dict('records'))

@app.route('/api/events', methods=['POST'])
def get_events():
    filters = request.get_json() or {}
    data = data_service.get_events(filters)
    data['start_time'] = data['start_time'].astype(str)
    data['end_time'] = data['end_time'].astype(str)
    return jsonify(data.to_dict('records'))

@app.route('/api/anomalies', methods=['POST'])
def get_anomalies():
    filters = request.get_json() or {}
    data = data_service.get_anomaly_records(filters)
    data['timestamp'] = data['timestamp'].astype(str)
    return jsonify(data.to_dict('records'))

@app.route('/api/pollutant-comparison', methods=['POST'])
def get_pollutant_comparison():
    payload = request.get_json() or {}
    filters = payload.get('filters', {})
    pollutants = payload.get('pollutants', ['pm25', 'o3'])
    data = data_service.get_pollutant_comparison(filters, pollutants)
    data['time_bucket'] = data['time_bucket'].astype(str)
    return jsonify(data.to_dict('records'))

@app.route('/api/district-aggregation', methods=['POST'])
def get_district_aggregation():
    filters = request.get_json() or {}
    data = data_service.get_district_aggregation(filters)
    return jsonify(data.to_dict('records'))

@app.route('/api/verify-aggregation', methods=['POST'])
def verify_aggregation():
    payload = request.get_json() or {}
    filters = payload.get('filters', {})
    sample_size = payload.get('sample_size', 5)
    result = data_service.verify_aggregation(filters, sample_size)
    return jsonify(result)

@app.route('/api/hourly-profile', methods=['POST'])
def get_hourly_profile():
    payload = request.get_json() or {}
    filters = payload.get('filters', {})
    pollutant = payload.get('pollutant', 'pm25')
    data = data_service.get_hourly_profile(filters, pollutant)
    return jsonify(data.to_dict('records'))

@app.route('/api/wind-analysis', methods=['POST'])
def get_wind_analysis():
    payload = request.get_json() or {}
    filters = payload.get('filters', {})
    pollutant = payload.get('pollutant', 'pm25')
    data = data_service.get_wind_analysis(filters, pollutant)
    return jsonify(data.to_dict('records'))

@app.route('/api/last-updated', methods=['GET'])
def get_last_updated():
    return jsonify(data_service.get_last_updated())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
