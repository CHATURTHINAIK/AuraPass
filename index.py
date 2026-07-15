from flask import Flask, jsonify, request, send_from_directory
import secrets
import string

app = Flask(__name__, static_folder='.', template_folder='.')

def generate_secure_password(length, uppercase, lowercase, numbers, symbols):
    """Generates a secure random password based on the provided settings."""
    pool = ""
    guaranteed = []

    if uppercase:
        pool += string.ascii_uppercase
        guaranteed.append(secrets.choice(string.ascii_uppercase))
    if lowercase:
        pool += string.ascii_lowercase
        guaranteed.append(secrets.choice(string.ascii_lowercase))
    if numbers:
        pool += string.digits
        guaranteed.append(secrets.choice(string.digits))
    if symbols:
        symbol_list = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        pool += symbol_list
        guaranteed.append(secrets.choice(symbol_list))

    if not pool:
        raise ValueError("At least one character type must be selected.")

    # If the requested length is less than the number of guaranteed characters,
    # we adjust to avoid out-of-bounds, though standard length is larger.
    if length < len(guaranteed):
        # Just select from the full pool
        password_chars = [secrets.choice(pool) for _ in range(length)]
    else:
        # Fill the rest of the length from the pool
        remaining_length = length - len(guaranteed)
        password_chars = guaranteed + [secrets.choice(pool) for _ in range(remaining_length)]
        # Shuffle to randomize placement of guaranteed characters
        secrets.SystemRandom().shuffle(password_chars)

    return "".join(password_chars)

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def css():
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def js():
    return send_from_directory('.', 'script.js')

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.get_json() or {}
    
    try:
        length = int(data.get('length', 12))
        uppercase = bool(data.get('uppercase', True))
        lowercase = bool(data.get('lowercase', True))
        numbers = bool(data.get('numbers', True))
        symbols = bool(data.get('symbols', False))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid parameters provided.'}), 400

    if length < 4 or length > 128:
        return jsonify({'error': 'Password length must be between 4 and 128 characters.'}), 400

    if not any([uppercase, lowercase, numbers, symbols]):
        return jsonify({'error': 'At least one character type must be selected.'}), 400

    try:
        password = generate_secure_password(length, uppercase, lowercase, numbers, symbols)
        return jsonify({'password': password})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the server locally on port 5000
    app.run(debug=True, port=5000)
