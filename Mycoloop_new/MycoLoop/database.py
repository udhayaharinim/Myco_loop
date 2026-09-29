import sqlite3
from pathlib import Path


# Database location
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "mycoloop.db"


def get_connection():
    """
    Create a connection to the MycoLoop SQLite database.
    """
    connection = sqlite3.connect(
        DATABASE_PATH,
        check_same_thread=False
    )

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():
    """
    Create the required MycoLoop database tables.
    """

    connection = get_connection()
    cursor = connection.cursor()

    # Sensor readings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Equipment activity
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS equipment_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment TEXT NOT NULL,
            state TEXT NOT NULL,
            runtime_seconds REAL DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # System alerts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT DEFAULT 'info',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Cultivation stage history
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cultivation_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()
