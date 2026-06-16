# 🚌 Online Bus Reservation System

A full-stack web application that allows users to search buses, view seat availability, book tickets, and manage bookings online. The system uses Flask for the backend, MySQL for database management, and JWT-based authentication for secure user access.

---

## 📌 Features

### User Features
- User Registration and Login
- Secure JWT Authentication
- Search Available Buses
- View Seat Availability
- Book Bus Tickets
- View Booking History
- Cancel Bookings

### Admin Features
- Manage Bus Information
- Manage Seat Availability
- View Bookings

---

## 🛠️ Technology Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Flask (Python)

### Database
- MySQL

### Authentication
- JWT (JSON Web Tokens)

---

## 📂 Project Structure

```text
online-bus-reservation-system/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── booking.html
│   └── assets/
│
├── database/
│   └── bus_reservation.sql
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/online-bus-reservation-system.git
cd online-bus-reservation-system
```

### 2. Install Dependencies

```bash
pip install flask
pip install flask-mysqldb
pip install flask-cors
pip install PyJWT
pip install python-dotenv
```

### 3. Configure MySQL

Create a MySQL database:

```sql
CREATE DATABASE bus_reservation;
```

Import the SQL file:

```sql
SOURCE bus_reservation.sql;
```

### 4. Update Database Configuration

Edit `config.py`:

```python
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_password'
MYSQL_DB = 'bus_reservation'
```

### 5. Run the Application

```bash
cd backend
py -3.14 -m flask run
```

Server will start at:

```text
http://127.0.0.1:5000
```

---

## 🔐 API Endpoints

### Authentication

| Method | Endpoint | Description |
|----------|-----------|-------------|
| POST | /api/register | Register User |
| POST | /api/login | Login User |

### Bus Management

| Method | Endpoint | Description |
|----------|-----------|-------------|
| POST | /api/buses/search | Search Buses |
| GET | /api/buses/<bus_id>/seats | Get Available Seats |

### Booking

| Method | Endpoint | Description |
|----------|-----------|-------------|
| POST | /api/book | Book Ticket |
| GET | /api/bookings | View Bookings |
| POST | /api/bookings/<booking_id>/cancel | Cancel Booking |

---

## 🗄️ Database Tables

- users
- buses
- seats
- bookings

---

## 🚀 Future Enhancements

- Online Payment Gateway Integration
- Live Bus Tracking using GPS
- Email and SMS Notifications
- Mobile Application Support
- Admin Dashboard Analytics
- E-Ticket PDF Generation

---

## 👩‍💻 Author

**Javvaji Varshitha**

- GitHub: https://github.com/javvajivarshitha
- LinkedIn: https://www.linkedin.com/in/varshitha-javvaji

---

## 📄 License

This project is developed for educational and academic purposes.
