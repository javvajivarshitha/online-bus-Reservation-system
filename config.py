import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'Varshitha@1126')
    MYSQL_DB = os.getenv('MYSQL_DB', 'bus_reservations')
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')