import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from backend.data_service import data_service

app = Flask(__name__)
CORS(app)

def safe_json_response(df: pd.DataFrame, datetime_cols: list = None):
    if df.empty:
        return jsonify([])
    
    result = df.copy()
    if datetime_cols:
        for col in datetime_cols:
            if col in result.columns:
                result[col] = result[col].astype(str)
    
    return jsonify(result.to_dict('records'))

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'air-quality-dashboard-api'})

@app.route('/api/stations', methods=['GET'])
def get_stations():
    districts = request.args.getlist('districts')
    stations_df = data_service.get_stations(districts if districts else None)
    return safe_json_response(stations_df)

@app.route('/api/air-quality/hourly', methods=['POST'])
def get_air_quality_hourly():
    try:
        filters = request.get_json() or {}
        data = data_service.get_air_quality_hourly(filters)
        return safe_json_response(data, ['hour_bucket'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/air-quality/daily', methods=['POST'])
def get_air_quality_daily():
    try:
        filters = request.get_json() or {}
        data = data_service.get_air_quality_daily(filters)
        return safe_json_response(data, ['day_bucket'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/air-quality/raw', methods=['POST'])
def get_air_quality_raw():
    try:
        filters = request.get_json() or {}
        data = data_service.get_air_quality_raw(filters)
        return safe_json_response(data, ['timestamp'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/traffic/hourly', methods=['POST'])
def get_traffic_hourly():
    try:
        filters = request.get_json() or {}
        data = data_service.get_traffic_hourly(filters)
        return safe_json_response(data, ['hour_bucket'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/construction-sites', methods=['GET'])
def get_construction_sites():
    districts = request.args.getlist('districts')
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    sites = data_service.get_construction_sites(
        districts if districts else None,
        active_only
    )
    return safe_json_response(sites)

@app.route('/api/complaints', methods=['POST'])
def get_complaints():
    try:
        filters = request.get_json() or {}
        is_public = request.args.get('public', 'true').lower() == 'true'
        data = data_service.get_complaints(filters, is_public=is_public)
        datetime_cols = ['timestamp', 'verified_at', 'created_at']
        return safe_json_response(data, datetime_cols)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events', methods=['POST'])
def get_events():
    try:
        filters = request.get_json() or {}
        data = data_service.get_events(filters)
        datetime_cols = ['start_time', 'end_time', 'created_at']
        return safe_json_response(data, datetime_cols)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/anomalies', methods=['POST'])
def get_anomalies():
    try:
        filters = request.get_json() or {}
        data = data_service.get_anomaly_records(filters)
        return safe_json_response(data, ['timestamp'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pollutant-comparison', methods=['POST'])
def get_pollutant_comparison():
    try:
        payload = request.get_json() or {}
        filters = payload.get('filters', {})
        pollutants = payload.get('pollutants', ['pm25', 'o3'])
        data = data_service.get_pollutant_comparison(filters, pollutants)
        return safe_json_response(data, ['time_bucket'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/district-aggregation', methods=['POST'])
def get_district_aggregation():
    try:
        filters = request.get_json() or {}
        data = data_service.get_district_aggregation(filters)
        return safe_json_response(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-aggregation', methods=['POST'])
def verify_aggregation():
    try:
        payload = request.get_json() or {}
        filters = payload.get('filters', {})
        sample_size = payload.get('sample_size', 5)
        result = data_service.verify_aggregation(filters, sample_size)
        return jsonify(result)
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500

@app.route('/api/hourly-profile', methods=['POST'])
def get_hourly_profile():
    try:
        payload = request.get_json() or {}
        filters = payload.get('filters', {})
        pollutant = payload.get('pollutant', 'pm25')
        data = data_service.get_hourly_profile(filters, pollutant)
        return safe_json_response(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wind-analysis', methods=['POST'])
def get_wind_analysis():
    try:
        payload = request.get_json() or {}
        filters = payload.get('filters', {})
        pollutant = payload.get('pollutant', 'pm25')
        data = data_service.get_wind_analysis(filters, pollutant)
        return safe_json_response(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/last-updated', methods=['GET'])
def get_last_updated():
    try:
        return jsonify(data_service.get_last_updated())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
