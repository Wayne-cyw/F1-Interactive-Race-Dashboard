from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_compress import Compress
import fastf1
import pandas as pd
import os
from functools import lru_cache
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler
import json

app = Flask(__name__)
CORS(app)
Compress(app)

# Setup logging
if not os.path.exists('logs'):
    os.makedirs('logs')

file_handler = RotatingFileHandler('logs/api.log', maxBytes=10240000, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('F1 Dashboard API Ultimate startup')

user_log_file = 'logs/user_activity.log'

def log_user_activity(endpoint, user_ip, params=None):
    """Log user activity"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        'timestamp': timestamp,
        'endpoint': endpoint,
        'ip': user_ip,
        'params': params,
        'user_agent': request.headers.get('User-Agent', 'Unknown')
    }
    
    with open(user_log_file, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

@app.before_request
def before_request():
    g.start = datetime.now()
    g.user_ip = request.remote_addr

@app.after_request
def after_request(response):
    if hasattr(g, 'start'):
        duration = (datetime.now() - g.start).total_seconds()
        app.logger.info(f'{request.method} {request.path} - {response.status_code} - {duration:.3f}s - IP: {g.user_ip}')
    return response

# Enable FastF1 cache
cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(cache_dir, exist_ok=True)
fastf1.Cache.enable_cache(cache_dir)

@lru_cache(maxsize=200)
def get_cached_session(year, race_round, session_type='R'):
    """Cache loaded sessions in memory"""
    app.logger.info(f'Loading session: {year} Round {race_round} ({session_type})')
    session = fastf1.get_session(year, race_round, session_type)
    session.load()
    app.logger.info(f'Session loaded: {year} Round {race_round}')
    return session

TEAM_COLORS = {
    'Red Bull Racing': '#3671C6',
    'Ferrari': '#DC2F02',
    'Mercedes': '#27F4D2',
    'McLaren': '#FAA307',
    'Aston Martin': '#229971',
    'Alpine': '#FF87BC',
    'Williams': '#64C4FF',
    'AlphaTauri': '#5E8FAA',
    'Alfa Romeo': '#9D0208',
    'Haas F1 Team': '#B6BABD',
    'RB': '#6692FF',
    'Kick Sauber': '#52E252'
}

@app.route('/')
def home():
    log_user_activity('home', g.user_ip)
    return jsonify({
        'message': 'F1 Dashboard API Ultimate Edition',
        'status': 'running',
        'version': '3.0',
        'features': [
            'Gzip compression',
            'Full season coverage (2018+)',
            'Weather data',
            'Telemetry data',
            'Qualifying & Sprint sessions',
            'Pit stop tracking',
            'Race control messages',
            'Track status'
        ]
    })

@app.route('/api/seasons')
def get_seasons():
    log_user_activity('seasons', g.user_ip)
    # Get all available seasons from 2018 to current year
    current_year = datetime.now().year
    seasons = list(range(2018, current_year + 1))
    seasons.reverse()
    
    return jsonify({
        'status': 'success',
        'seasons': seasons
    })

@app.route('/api/session-types/<int:year>/<int:race_round>')
def get_session_types(year, race_round):
    """Get available session types for a race"""
    log_user_activity('session_types', g.user_ip, {'year': year, 'round': race_round})
    
    try:
        event = fastf1.get_event(year, race_round)
        
        available_sessions = []
        session_map = {
            'FP1': 'Practice 1',
            'FP2': 'Practice 2',
            'FP3': 'Practice 3',
            'Q': 'Qualifying',
            'S': 'Sprint',
            'SQ': 'Sprint Qualifying',
            'R': 'Race'
        }
        
        for code, name in session_map.items():
            try:
                session = fastf1.get_session(year, race_round, code)
                if session is not None:
                    available_sessions.append({'code': code, 'name': name})
            except:
                continue
        
        return jsonify({
            'status': 'success',
            'sessions': available_sessions
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/races/<int:year>')
def get_races(year):
    log_user_activity('races', g.user_ip, {'year': year})
    
    try:
        schedule = fastf1.get_event_schedule(year)
        races = []
        
        for _, event in schedule.iterrows():
            if event['EventFormat'] != 'testing':
                races.append({
                    'round': int(event['RoundNumber']),
                    'name': event['EventName'],
                    'country': event['Country'],
                    'location': event['Location'],
                    'date': event['EventDate'].strftime('%Y-%m-%d') if pd.notna(event['EventDate']) else None
                })
        
        return jsonify({
            'status': 'success',
            'year': year,
            'races': races
        })
    except Exception as e:
        app.logger.error(f'Error fetching races: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/session/<int:year>/<int:race_round>/<session_type>')
def get_session_data(year, race_round, session_type):
    """Get data for any session type (Race, Qualifying, Sprint, etc.)"""
    log_user_activity('session_data', g.user_ip, {'year': year, 'round': race_round, 'type': session_type})
    
    try:
        session = get_cached_session(year, race_round, session_type)
        
        laps = session.laps
        needed_cols = ['Driver', 'LapNumber', 'LapTime', 'Position', 'Compound', 'Team']
        
        # Filter valid columns
        available_cols = [col for col in needed_cols if col in laps.columns]
        laps_subset = laps[available_cols].copy()
        
        if 'LapTime' in laps_subset.columns:
            laps_subset = laps_subset[laps_subset['LapTime'].notna()]
        
        laps_data = []
        for _, lap in laps_subset.iterrows():
            lap_dict = {
                'driver': lap['Driver'] if 'Driver' in lap.index else None,
                'lap_number': int(lap['LapNumber']) if 'LapNumber' in lap.index and pd.notna(lap['LapNumber']) else None,
            }
            
            if 'LapTime' in lap.index and pd.notna(lap['LapTime']):
                lap_dict['lap_time'] = lap['LapTime'].total_seconds()
            if 'Position' in lap.index and pd.notna(lap['Position']):
                lap_dict['position'] = int(lap['Position'])
            if 'Compound' in lap.index:
                lap_dict['compound'] = lap['Compound'] if pd.notna(lap['Compound']) else 'UNKNOWN'
            if 'Team' in lap.index:
                lap_dict['team'] = lap['Team']
                
            laps_data.append(lap_dict)
        
        results = session.results if hasattr(session, 'results') else pd.DataFrame()
        results_data = []
        
        if not results.empty:
            for _, result in results.iterrows():
                team_name = result['TeamName'] if 'TeamName' in result.index else 'Unknown'
                results_data.append({
                    'driver': result['Abbreviation'] if 'Abbreviation' in result.index else None,
                    'driver_name': result['FullName'] if 'FullName' in result.index else None,
                    'team': team_name,
                    'team_color': TEAM_COLORS.get(team_name, '#FFFFFF'),
                    'position': int(result['Position']) if 'Position' in result.index and pd.notna(result['Position']) else None,
                    'points': float(result['Points']) if 'Points' in result.index and pd.notna(result['Points']) else 0,
                    'status': result['Status'] if 'Status' in result.index else 'Unknown'
                })
        
        event = session.event
        session_info = {
            'name': event['EventName'],
            'country': event['Country'],
            'location': event['Location'],
            'session_type': session_type
        }
        
        return jsonify({
            'status': 'success',
            'session': session_info,
            'laps': laps_data,
            'results': results_data,
            'total_laps': int(laps['LapNumber'].max()) if len(laps) > 0 and 'LapNumber' in laps.columns else 0
        })
        
    except Exception as e:
        app.logger.error(f'Error fetching session data: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/weather/<int:year>/<int:race_round>')
def get_weather(year, race_round):
    """Get weather data for a race"""
    log_user_activity('weather', g.user_ip, {'year': year, 'round': race_round})
    
    try:
        session = get_cached_session(year, race_round, 'R')
        
        if not hasattr(session, 'weather_data') or session.weather_data.empty:
            return jsonify({
                'status': 'error',
                'message': 'No weather data available'
            }), 404
        
        weather = session.weather_data
        
        # Get latest weather reading
        latest = weather.iloc[-1] if len(weather) > 0 else None
        
        if latest is not None:
            weather_data = {
                'air_temp': float(latest['AirTemp']) if pd.notna(latest.get('AirTemp')) else None,
                'track_temp': float(latest['TrackTemp']) if pd.notna(latest.get('TrackTemp')) else None,
                'humidity': float(latest['Humidity']) if pd.notna(latest.get('Humidity')) else None,
                'pressure': float(latest['Pressure']) if pd.notna(latest.get('Pressure')) else None,
                'rainfall': bool(latest['Rainfall']) if pd.notna(latest.get('Rainfall')) else False,
                'wind_speed': float(latest['WindSpeed']) if pd.notna(latest.get('WindSpeed')) else None,
                'wind_direction': float(latest['WindDirection']) if pd.notna(latest.get('WindDirection')) else None
            }
        else:
            weather_data = {}
        
        return jsonify({
            'status': 'success',
            'weather': weather_data
        })
        
    except Exception as e:
        app.logger.error(f'Error fetching weather: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/telemetry/<int:year>/<int:race_round>/<session_type>/<driver_code>')
def get_telemetry(year, race_round, session_type, driver_code):
    """Get telemetry for a specific driver"""
    log_user_activity('telemetry', g.user_ip, {'year': year, 'round': race_round, 'driver': driver_code})
    
    try:
        session = get_cached_session(year, race_round, session_type)
        driver_laps = session.laps.pick_driver(driver_code)
        
        if driver_laps.empty:
            return jsonify({
                'status': 'error',
                'message': f'No laps found for {driver_code}'
            }), 404
        
        fastest_lap = driver_laps.pick_fastest()
        
        if fastest_lap is None or fastest_lap.empty:
            return jsonify({
                'status': 'error',
                'message': 'No valid fastest lap'
            }), 404
        
        telemetry = fastest_lap.get_telemetry()
        
        # Sample telemetry (every 10th point to reduce size)
        sampled = telemetry.iloc[::10]
        
        telemetry_data = []
        for _, point in sampled.iterrows():
            telemetry_data.append({
                'distance': float(point['Distance']) if pd.notna(point.get('Distance')) else None,
                'speed': float(point['Speed']) if pd.notna(point.get('Speed')) else None,
                'throttle': float(point['Throttle']) if pd.notna(point.get('Throttle')) else None,
                'brake': bool(point['Brake']) if pd.notna(point.get('Brake')) else False,
                'gear': int(point['nGear']) if pd.notna(point.get('nGear')) else None,
                'rpm': float(point['RPM']) if pd.notna(point.get('RPM')) else None,
                'drs': int(point['DRS']) if pd.notna(point.get('DRS')) else 0
            })
        
        return jsonify({
            'status': 'success',
            'driver': driver_code,
            'lap_number': int(fastest_lap['LapNumber']),
            'lap_time': fastest_lap['LapTime'].total_seconds(),
            'telemetry': telemetry_data
        })
        
    except Exception as e:
        app.logger.error(f'Error fetching telemetry: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/pitstops/<int:year>/<int:race_round>')
def get_pitstops(year, race_round):
    """Get pit stop data"""
    log_user_activity('pitstops', g.user_ip, {'year': year, 'round': race_round})
    
    try:
        session = get_cached_session(year, race_round, 'R')
        laps = session.laps
        
        # Detect pit stops (compound changes)
        pit_stops = []
        
        for driver in laps['Driver'].unique():
            driver_laps = laps[laps['Driver'] == driver].copy()
            driver_laps = driver_laps.sort_values('LapNumber')
            
            prev_compound = None
            for _, lap in driver_laps.iterrows():
                current_compound = lap.get('Compound')
                
                if prev_compound is not None and current_compound != prev_compound:
                    pit_stops.append({
                        'driver': driver,
                        'lap': int(lap['LapNumber']),
                        'from_compound': prev_compound,
                        'to_compound': current_compound,
                        'pit_duration': None  # FastF1 doesn't always have this
                    })
                
                prev_compound = current_compound
        
        return jsonify({
            'status': 'success',
            'pit_stops': pit_stops
        })
        
    except Exception as e:
        app.logger.error(f'Error fetching pit stops: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/standings/<int:year>')
def get_standings(year):
    log_user_activity('standings', g.user_ip, {'year': year})
    
    try:
        schedule = fastf1.get_event_schedule(year)
        now = datetime.now()
        
        completed_races = schedule[schedule['EventDate'] < now]
        
        if len(completed_races) == 0:
            return jsonify({
                'status': 'error',
                'message': f'No completed races in {year} yet'
            }), 404
        
        latest_round = int(completed_races.iloc[-1]['RoundNumber'])
        
        driver_points = {}
        team_points = {}
        
        for round_num in range(1, latest_round + 1):
            try:
                session = get_cached_session(year, round_num, 'R')
                results = session.results
                
                for _, result in results.iterrows():
                    driver = result['Abbreviation']
                    driver_name = result['FullName']
                    team = result['TeamName']
                    points = float(result['Points']) if pd.notna(result['Points']) else 0
                    
                    if driver not in driver_points:
                        driver_points[driver] = {
                            'driver': driver,
                            'name': driver_name,
                            'team': team,
                            'team_color': TEAM_COLORS.get(team, '#FFFFFF'),
                            'points': 0
                        }
                    driver_points[driver]['points'] += points
                    
                    if team not in team_points:
                        team_points[team] = {
                            'team': team,
                            'color': TEAM_COLORS.get(team, '#FFFFFF'),
                            'points': 0
                        }
                    team_points[team]['points'] += points
                    
            except Exception as e:
                app.logger.warning(f'Could not load round {round_num}: {str(e)}')
                continue
        
        driver_standings = sorted(driver_points.values(), key=lambda x: x['points'], reverse=True)
        team_standings = sorted(team_points.values(), key=lambda x: x['points'], reverse=True)
        
        for i, driver in enumerate(driver_standings):
            driver['position'] = i + 1
            
        for i, team in enumerate(team_standings):
            team['position'] = i + 1
        
        return jsonify({
            'status': 'success',
            'year': year,
            'last_race': latest_round,
            'driver_standings': driver_standings,
            'team_standings': team_standings
        })
        
    except Exception as e:
        app.logger.error(f'Error fetching standings: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/teams/<int:year>')
def get_teams(year):
    log_user_activity('teams', g.user_ip, {'year': year})
    
    try:
        session = get_cached_session(year, 1, 'R')
        results = session.results
        
        teams = {}
        
        for _, result in results.iterrows():
            team_name = result['TeamName']
            
            if team_name not in teams:
                teams[team_name] = {
                    'name': team_name,
                    'color': TEAM_COLORS.get(team_name, '#FFFFFF'),
                    'drivers': []
                }
            
            teams[team_name]['drivers'].append({
                'code': result['Abbreviation'],
                'name': result['FullName']
            })
        
        return jsonify({
            'status': 'success',
            'year': year,
            'teams': list(teams.values())
        })
        
    except Exception as e:
        app.logger.error(f'Error fetching teams: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/track/<int:year>/<int:race_round>')
def get_track_info(year, race_round):
    log_user_activity('track', g.user_ip, {'year': year, 'round': race_round})
    
    try:
        session = get_cached_session(year, race_round, 'R')
        
        fastest_lap = session.laps.pick_fastest()
        
        if fastest_lap is None or fastest_lap.empty:
            return jsonify({
                'status': 'error',
                'message': 'No valid lap data available'
            }), 404
        
        telemetry = fastest_lap.get_telemetry()
        
        track_data = []
        for _, point in telemetry.iterrows():
            if pd.notna(point.get('X')) and pd.notna(point.get('Y')):
                track_data.append({
                    'x': float(point['X']),
                    'y': float(point['Y'])
                })
        
        event = session.event
        
        return jsonify({
            'status': 'success',
            'track': {
                'name': event['EventName'],
                'location': event['Location'],
                'country': event['Country'],
                'coordinates': track_data
            }
        })
        
    except Exception as e:
        app.logger.error(f'Error fetching track: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/drivers/<int:year>/<int:race_round>')
def get_drivers(year, race_round):
    log_user_activity('drivers', g.user_ip, {'year': year, 'round': race_round})
    
    try:
        session = get_cached_session(year, race_round, 'R')
        results = session.results
        drivers = []
        
        for _, driver in results.iterrows():
            team_name = driver['TeamName']
            drivers.append({
                'code': driver['Abbreviation'],
                'name': driver['FullName'],
                'team': team_name,
                'team_color': TEAM_COLORS.get(team_name, '#FFFFFF')
            })
        
        return jsonify({
            'status': 'success',
            'drivers': drivers
        })
        
    except Exception as e:
        app.logger.error(f'Error fetching drivers: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("F1 Dashboard API - Ultimate Edition v3.0")
    print("=" * 60)
    print("Features:")
    print("  ✓ All seasons (2018+)")
    print("  ✓ Weather data")
    print("  ✓ Telemetry")
    print("  ✓ Qualifying & Sprint")
    print("  ✓ Pit stops")
    print("  ✓ Gzip compression")
    print("=" * 60)
    print("Backend running on http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, port=5000, host='0.0.0.0')
