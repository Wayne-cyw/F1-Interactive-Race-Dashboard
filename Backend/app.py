from flask import Flask, jsonify
from flask_cors import CORS
import fastf1
import pandas as pd
import os
from functools import lru_cache

app = Flask(__name__)
CORS(app)

# Enable FastF1 cache
cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(cache_dir, exist_ok=True)
fastf1.Cache.enable_cache(cache_dir)

# In-memory cache for faster subsequent requests
@lru_cache(maxsize=50)
def get_cached_session(year, race_round):
    """Cache loaded sessions in memory"""
    session = fastf1.get_session(year, race_round, 'R')
    session.load()
    return session

@app.route('/')
def home():
    return jsonify({
        'message': 'F1 Dashboard API - FastF1',
        'status': 'running',
        'endpoints': {
            '/api/races/<year>': 'Get all races for a season',
            '/api/race/<year>/<round>': 'Get race data',
            '/api/drivers/<year>/<round>': 'Get drivers in race'
        }
    })

@app.route('/api/races/<int:year>')
def get_races(year):
    try:
        schedule = fastf1.get_event_schedule(year)
        races = []
        
        for idx, event in schedule.iterrows():
            if event['EventFormat'] != 'testing':
                races.append({
                    'round': int(event['RoundNumber']),
                    'name': event['EventName'],
                    'country': event['Country'],
                    'location': event['Location']
                })
        
        return jsonify({
            'status': 'success',
            'year': year,
            'races': races
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/race/<int:year>/<int:race_round>')
def get_race_data(year, race_round):
    try:
        print(f"Loading race data for {year}, round {race_round}...")
        
        # Use cached session
        session = get_cached_session(year, race_round)
        
        print("Session loaded, processing laps...")
        
        laps = session.laps
        
        # Optimize: Only select needed columns
        needed_cols = ['Driver', 'LapNumber', 'LapTime', 'Position', 'Compound', 'Team']
        laps_subset = laps[needed_cols].copy()
        
        # Filter out invalid laps upfront
        laps_subset = laps_subset[laps_subset['LapTime'].notna()]
        
        # Convert to list more efficiently
        laps_data = []
        for _, lap in laps_subset.iterrows():
            laps_data.append({
                'driver': lap['Driver'],
                'lap_number': int(lap['LapNumber']),
                'lap_time': lap['LapTime'].total_seconds(),
                'position': int(lap['Position']) if pd.notna(lap['Position']) else None,
                'compound': lap['Compound'] if pd.notna(lap['Compound']) else 'UNKNOWN',
                'team': lap['Team']
            })
        
        print(f"Processed {len(laps_data)} laps")
        
        results = session.results
        results_data = []
        
        for _, result in results.iterrows():
            results_data.append({
                'driver': result['Abbreviation'],
                'driver_name': result['FullName'],
                'team': result['TeamName'],
                'position': int(result['Position']) if pd.notna(result['Position']) else None,
                'points': float(result['Points']) if pd.notna(result['Points']) else 0
            })
        
        event = session.event
        race_info = {
            'name': event['EventName'],
            'country': event['Country'],
            'location': event['Location']
        }
        
        return jsonify({
            'status': 'success',
            'race': race_info,
            'laps': laps_data,
            'results': results_data,
            'total_laps': int(laps['LapNumber'].max()) if len(laps) > 0 else 0
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/drivers/<int:year>/<int:race_round>')
def get_drivers(year, race_round):
    try:
        # Use cached session
        session = get_cached_session(year, race_round)
        
        results = session.results
        drivers = []
        
        for _, driver in results.iterrows():
            drivers.append({
                'code': driver['Abbreviation'],
                'name': driver['FullName'],
                'team': driver['TeamName']
            })
        
        return jsonify({
            'status': 'success',
            'drivers': drivers
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting F1 Dashboard API...")
    print("Backend running on http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')
