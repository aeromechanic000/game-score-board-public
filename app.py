from flask import Flask, render_template, jsonify, request
import requests
import json
import os

app = Flask(__name__)

# Pollinations AI endpoint
POLLINATIONS_API_URL = "https://text.pollinations.ai/"

# Data file path
DATA_FILE = os.path.join(app.static_folder, 'data.json')

def load_data():
    """Load data from JSON file"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading data: {e}")
    
    # Return default structure if file doesn't exist or error occurs
    return {
        'columns': [
            {'name': 'Player Name', 'type': 'text', 'required': True},
            {'name': 'Result Score', 'type': 'number', 'required': True}
        ],
        'players': [],
        'history': [],
        'leaderboard': {},
        'theme': 'light',
        'lang': 'en'
    }

def save_data(data):
    """Save data to JSON file"""
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving data: {e}")
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    """Get all data"""
    data = load_data()
    return jsonify(data)

@app.route('/api/data', methods=['POST'])
def update_data():
    """Update all data"""
    try:
        data = request.json
        if save_data(data):
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/players', methods=['POST'])
def add_player():
    """Add a new player"""
    try:
        data = load_data()
        player_data = request.json
        data['players'].append(player_data)
        if save_data(data):
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/players/<int:index>', methods=['DELETE'])
def delete_player(index):
    """Delete a player"""
    try:
        data = load_data()
        if 0 <= index < len(data['players']):
            data['players'].pop(index)
            if save_data(data):
                return jsonify({'success': True, 'data': data})
            else:
                return jsonify({'error': 'Failed to save data'}), 500
        else:
            return jsonify({'error': 'Invalid player index'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/players/<int:player_index>/<int:col_index>', methods=['PUT'])
def update_player_data(player_index, col_index):
    """Update player data"""
    try:
        data = load_data()
        value = request.json.get('value', '')
        
        if 0 <= player_index < len(data['players']):
            if col_index < len(data['players'][player_index]['data']):
                data['players'][player_index]['data'][col_index] = value
            else:
                # Extend data array if needed
                while len(data['players'][player_index]['data']) <= col_index:
                    data['players'][player_index]['data'].append('')
                data['players'][player_index]['data'][col_index] = value
            
            if save_data(data):
                return jsonify({'success': True, 'data': data})
            else:
                return jsonify({'error': 'Failed to save data'}), 500
        else:
            return jsonify({'error': 'Invalid player index'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/columns', methods=['POST'])
def add_column():
    """Add a new column"""
    try:
        data = load_data()
        column_data = request.json
        data['columns'].append(column_data)
        
        # Add empty data for this column to all existing players
        for player in data['players']:
            player['data'].append('')
        
        if save_data(data):
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/columns/<int:index>', methods=['DELETE'])
def delete_column(index):
    """Delete a column"""
    try:
        data = load_data()
        if 0 <= index < len(data['columns']):
            data['columns'].pop(index)
            
            # Remove data for this column from all players
            for player in data['players']:
                if index < len(player['data']):
                    player['data'].pop(index)
            
            if save_data(data):
                return jsonify({'success': True, 'data': data})
            else:
                return jsonify({'error': 'Failed to save data'}), 500
        else:
            return jsonify({'error': 'Invalid column index'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/game/finish', methods=['POST'])
def finish_game():
    """Finish current game and save to history"""
    try:
        data = load_data()
        game_data = request.json
        
        data['history'].append(game_data['gameData'])
        
        # Update leaderboard
        for name, score in game_data['leaderboard'].items():
            if name in data['leaderboard']:
                data['leaderboard'][name] += score
            else:
                data['leaderboard'][name] = score
        
        # Clear current players
        data['players'] = []
        
        if save_data(data):
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/game/clear', methods=['POST'])
def clear_current():
    """Clear current game"""
    try:
        data = load_data()
        data['players'] = []
        
        if save_data(data):
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/all/clear', methods=['POST'])
def clear_all():
    """Clear all data"""
    try:
        data = {
            'columns': [
                {'name': 'Player Name', 'type': 'text', 'required': True},
                {'name': 'Result Score', 'type': 'number', 'required': True}
            ],
            'players': [],
            'history': [],
            'leaderboard': {},
            'theme': 'light',
            'lang': 'en'
        }
        
        if save_data(data):
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    """Update theme or language settings"""
    try:
        data = load_data()
        settings = request.json
        
        if 'theme' in settings:
            data['theme'] = settings['theme']
        if 'lang' in settings:
            data['lang'] = settings['lang']
        
        if save_data(data):
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'error': 'Failed to save data'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_scores():
    try:
        data = request.json
        players = data.get('players', [])
        
        if not players:
            return jsonify({'error': 'No player data provided'}), 400
        
        # Format player data for AI analysis
        score_summary = "Current Game Scores:\n"
        for player in players:
            score_summary += f"- {player['name']}: {player['score']} points"
            if player.get('details'):
                score_summary += f" ({player['details']})"
            score_summary += "\n"
        
        # Create AI prompt
        prompt = f"""Analyze this board game situation and provide insights:

{score_summary}

Please provide:
1. Current ranking and score analysis
2. Performance insights for each player
3. Winning probability assessment
4. Strategic recommendations for players who are behind
5. Key observations about the game dynamics

Keep the analysis concise, practical, and engaging."""

        # Call Pollinations AI API
        response = requests.post(
            POLLINATIONS_API_URL,
            json={
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "model": "openai",
                "jsonMode": False,
                "private": True,
            },
            headers={
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            # Pollinations returns plain text response
            analysis = response.text
            return jsonify({'analysis': analysis})
        else:
            return jsonify({'error': f'API request failed with status {response.status_code}'}), 500
    
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timed out. Please try again.'}), 504
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Network error: {str(e)}'}), 500
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=9998)