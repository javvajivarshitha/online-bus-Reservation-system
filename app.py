from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import db
from config import Config
from datetime import datetime
import os
import socket
import qrcode

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.SECRET_KEY


def get_lan_base_url():
    """Return the LAN IP base URL (e.g. http://192.168.7.7:5000).
    This ensures QR codes work when scanned from mobile devices on the same Wi-Fi.
    Falls back to 127.0.0.1 only if detection fails.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        lan_ip = s.getsockname()[0]
        s.close()
    except Exception:
        lan_ip = '127.0.0.1'
    return f'http://{lan_ip}:5000'


# Initialize database
db.connect()
db.init_database()
db.insert_sample_data()

# Routes

@app.route('/')
def index():
    logged_in = 'user_id' in session
    return render_template('index.html', logged_in=logged_in)

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        name = data.get('name', 'Anonymous')
        rating = data.get('rating', 5)
        comment = data.get('comment', '')

        success = db.execute_query(
            'INSERT INTO feedbacks (name, rating, comment) VALUES (%s, %s, %s)',
            (name, rating, comment)
        )

        if success:
            return jsonify({'success': True, 'message': 'Thank you for your feedback!'})
        else:
            return jsonify({'success': False, 'message': 'Database error'})
    except Exception as e:
        print(f"Feedback error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    try:
        # Fetch the latest 3 highest-rated feedbacks (rating >= 4)
        results = db.fetch_all('''
            SELECT name, rating, comment, created_at FROM feedbacks
            WHERE rating >= 4 ORDER BY id DESC LIMIT 3
        ''')
        testimonials = []
        for row in results:
            testimonials.append({
                'name': row[0],
                'rating': row[1],
                'comment': row[2],
                'created_at': row[3].strftime('%d %b %Y') if row[3] else ''
            })
        return jsonify({'success': True, 'testimonials': testimonials})
    except Exception as e:
        print(f"Testimonials error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            
            result = db.fetch_one(
                'SELECT id, username, mobile, gender FROM users WHERE email = %s AND password = %s',
                (email, password)
            )
            
            if result:
                session['user_id'] = result[0]
                session['username'] = result[1]
                session['mobile'] = result[2]
                session['gender'] = result[3]
                
                return jsonify({
                    'success': True,
                    'user': {
                        'id': result[0],
                        'username': result[1],
                        'email': email,
                        'mobile': result[2],
                        'gender': result[3]
                    }
                })
            else:
                return jsonify({'success': False, 'message': 'Invalid email or password'})
        except Exception as e:
            print(f"Login error: {e}")
            return jsonify({'success': False, 'message': str(e)})
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        try:
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            mobile = data.get('mobile')
            gender = data.get('gender')
            
            # Check if email exists
            result = db.fetch_one('SELECT id FROM users WHERE email = %s', (email,))
            if result:
                return jsonify({'success': False, 'message': 'Email already registered'})
            
            # Insert new user
            success = db.execute_query(
                'INSERT INTO users (username, email, password, mobile, gender) VALUES (%s, %s, %s, %s, %s)',
                (username, email, password, mobile, gender)
            )
            
            if success:
                return jsonify({'success': True})
            else:
                return jsonify({'success': False, 'message': 'Database error during registration'})
        except Exception as e:
            print(f"Registration error: {e}")
            return jsonify({'success': False, 'message': str(e)})
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))
@app.route('/search', methods=['GET', 'POST'])
def search():
    if request.method == 'GET':
        return render_template('search.html')

    data = request.get_json(silent=True)

    if data:
        from_city = data.get('from_city', '').strip()
        to_city = data.get('to_city', '').strip()
        date = data.get('date')
    else:
        from_city = request.form.get('from_city', '').strip()
        to_city = request.form.get('to_city', '').strip()
        date = request.form.get('date')

    print("DEBUG:", from_city, to_city, date)

    results = db.fetch_all(
        '''SELECT * FROM buses 
           WHERE LOWER(from_city)=LOWER(%s) 
           AND LOWER(to_city)=LOWER(%s) 
           AND date=%s''',
        (from_city, to_city, date)
    )

    bus_list = []
    for bus in results:
        bus_list.append({
            'id': bus[0],
            'name': bus[1],
            'from_city': bus[2],
            'to_city': bus[3],
            'departure_time': bus[4],
            'arrival_time': bus[5],
            'price': float(bus[6]),
            'seats_available': bus[7],
            'date': bus[9],
            'type': bus[10] if len(bus) > 10 else 'Non-AC'
        })

    # ✅ IMPORTANT: return in correct format
    return jsonify({
        "success": True,
        "buses": bus_list
    })
@app.route('/book', methods=['POST'])
def book():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Please login first'}), 401
        
        data = request.get_json()
        bus_id = data.get('bus_id')
        seats = int(data.get('seats', 1))
        user_id = session['user_id']
        
        print(f"Booking request - User: {user_id}, Bus: {bus_id}, Seats: {seats}")
        
        # Get bus details
        bus = db.fetch_one(
            'SELECT id, price, seats_available FROM buses WHERE id = %s',
            (bus_id,)
        )
        
        if not bus:
            return jsonify({'success': False, 'message': 'Bus not found'}), 404
        
        bus_id_db, price, seats_available = bus
        
        if seats_available < seats:
            return jsonify({'success': False, 'message': f'Only {seats_available} seats available'}), 400
        
        if seats <= 0:
            return jsonify({'success': False, 'message': 'Invalid number of seats'}), 400
        
        total_price = float(price) * seats
        
        # Create booking
        success = db.execute_query(
            'INSERT INTO bookings (user_id, bus_id, seats_booked, total_price) VALUES (%s, %s, %s, %s)',
            (user_id, bus_id, seats, total_price)
        )
        
        if success:
            # Get booking ID
            booking = db.fetch_one('SELECT LAST_INSERT_ID()')
            booking_id = booking[0] if booking else 0
            
            # Update available seats
            update_success = db.execute_query(
                'UPDATE buses SET seats_available = seats_available - %s WHERE id = %s',
                (seats, bus_id)
            )
            
            if update_success:
                # Generate QR code for ticket verification
                # Uses LAN IP so mobile devices can scan and open the URL
                qr_code_url = None
                try:
                    qr_dir = os.path.join(app.static_folder, 'qrcodes')
                    os.makedirs(qr_dir, exist_ok=True)

                    base_url = get_lan_base_url()
                    verification_url = f'{base_url}/ticket/{booking_id}'
                    print(f"🔗 QR verification URL: {verification_url}")

                    qr = qrcode.QRCode(
                        version=1,
                        error_correction=qrcode.constants.ERROR_CORRECT_H,
                        box_size=10,
                        border=4,
                    )
                    qr.add_data(verification_url)
                    qr.make(fit=True)
                    qr_img = qr.make_image(fill_color='black', back_color='white')

                    qr_filename = f'qr_booking_{booking_id}.png'
                    qr_path = os.path.join(qr_dir, qr_filename)
                    qr_img.save(qr_path)

                    qr_code_url = f'/static/qrcodes/{qr_filename}'
                    db.execute_query(
                        'UPDATE bookings SET qr_code_path = %s WHERE id = %s',
                        (qr_code_url, booking_id)
                    )
                    print(f"✅ QR code saved: {qr_path}")
                except Exception as qr_err:
                    print(f"⚠️ QR generation failed (non-fatal): {qr_err}")
                
                print(f"✅ Booking created - ID: {booking_id}")
                return jsonify({
                    'success': True,
                    'message': 'Booking confirmed!',
                    'booking_id': booking_id,
                    'qr_code_url': qr_code_url,
                    'base_url': get_lan_base_url()
                }), 201
            else:
                return jsonify({'success': False, 'message': 'Failed to update seats'}), 500
        else:
            return jsonify({'success': False, 'message': 'Booking failed'}), 500
    
    except Exception as e:
        print(f"Booking error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
@app.route('/my-bookings')
def my_bookings():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    
    results = db.fetch_all('''
        SELECT b.id, bs.name, bs.from_city, bs.to_city, b.seats_booked, b.total_price, b.booking_date, b.status,
               u.username, u.mobile, bs.date, bs.departure_time, bs.type
        FROM bookings b
        JOIN buses bs ON b.bus_id = bs.id
        JOIN users u ON b.user_id = u.id
        WHERE b.user_id = %s
        ORDER BY b.booking_date DESC
    ''', (user_id,))
    
    bookings = []
    for booking in results:
        bookings.append({
            'id': booking[0],
            'bus_name': booking[1],
            'from_city': booking[2],
            'to_city': booking[3],
            'seats': booking[4],
            'total_price': float(booking[5]),
            'booking_date': booking[6].strftime('%Y-%m-%d %H:%M'),
            'status': booking[7],
            'passenger_name': booking[8],
            'passenger_mobile': booking[9],
            'travel_date': booking[10],
            'travel_time': booking[11],
            'bus_type': booking[12]
        })
    
    return render_template('my_bookings.html', bookings=bookings)

@app.route('/api/cancel-booking', methods=['POST'])
def cancel_booking():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Please login first'}), 401
        
        data = request.get_json()
        booking_id = data.get('booking_id')
        user_id = session['user_id']
        
        # Check if booking belongs to user
        booking = db.fetch_one(
            'SELECT b.id, b.bus_id, b.seats_booked, b.status FROM bookings b WHERE b.id = %s AND b.user_id = %s',
            (booking_id, user_id)
        )
        
        if not booking:
            return jsonify({'success': False, 'message': 'Booking not found or access denied'}), 404
        
        b_id, bus_id, seats_booked, status = booking
        
        if status == 'Cancelled':
            return jsonify({'success': False, 'message': 'Booking is already cancelled'}), 400
        
        # Update booking status
        success = db.execute_query(
            "UPDATE bookings SET status = 'Cancelled' WHERE id = %s",
            (booking_id,)
        )
        
        if success:
            # Revert seats available in buses table
            db.execute_query(
                "UPDATE buses SET seats_available = seats_available + %s WHERE id = %s",
                (seats_booked, bus_id)
            )
            return jsonify({'success': True, 'message': 'Booking cancelled successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to cancel booking'})
            
    except Exception as e:
        print(f"Cancel error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/booking')
def booking():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('booking.html')

@app.route('/payment')
def payment():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('payment.html')

@app.route('/ticket')
def ticket():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('ticket.html')

@app.route('/ticket/<int:booking_id>')
def verify_ticket(booking_id):
    """QR code verification route — publicly accessible so anyone scanning can verify."""
    result = db.fetch_one('''
        SELECT b.id, u.username, u.mobile, bs.from_city, bs.to_city,
               bs.name, b.seats_booked, b.status, b.booking_date,
               bs.date, bs.departure_time, bs.type
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN buses bs ON b.bus_id = bs.id
        WHERE b.id = %s
    ''', (booking_id,))
    
    if result:
        raw_status = result[7] or 'Unknown'
        # Normalise to Title Case for display; compare case-insensitively
        status_display = raw_status.strip().title()   # e.g. "confirmed" → "Confirmed"
        is_valid = raw_status.strip().lower() == 'confirmed'
        ticket_data = {
            'booking_id':     result[0],
            'passenger_name': result[1] or '—',
            'mobile':         result[2] or '—',
            'source':         result[3] or '—',
            'destination':    result[4] or '—',
            'bus_name':       result[5] or '—',
            'seats_booked':   result[6],
            'status':         status_display,
            'booking_date':   result[8].strftime('%d %b %Y, %H:%M') if result[8] else '—',
            'travel_date':    str(result[9]) if result[9] else '—',
            'departure_time': result[10] or '—',
            'bus_type':       result[11] or 'Non-AC',
            'is_valid':       is_valid
        }
        return render_template(
            'verify_ticket.html',
            ticket=ticket_data,
            found=True,
            now=datetime.now().strftime('%d %b %Y, %H:%M')
        )
    else:
        return render_template('verify_ticket.html', ticket=None, found=False, now=None)

@app.route('/tracking')
def tracking():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('tracking.html')

@app.route('/all-buses')
def all_buses():
    results = db.fetch_all(
        'SELECT id, name, from_city, to_city, departure_time, arrival_time, price, seats_available, date, type FROM buses ORDER BY date DESC'
    )
    
    bus_list = []
    for bus in results:
        bus_list.append({
            'id': bus[0],
            'name': bus[1],
            'from_city': bus[2],
            'to_city': bus[3],
            'departure_time': bus[4],
            'arrival_time': bus[5],
            'price': float(bus[6]),
            'seats_available': bus[7],
            'date': bus[8],
            'type': bus[9]
        })
    
    return jsonify({'buses': bus_list})

@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

if __name__ == '__main__':
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    finally:
        db.close()
# trigger reload 2