import sqlite3
from pathlib import Path


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "mycoloop.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    connection = sqlite3.connect(
        DATABASE_PATH,
        check_same_thread=False
    )

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def initialize_database():

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

    # Equipment logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS equipment_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment TEXT NOT NULL,
            state TEXT NOT NULL,
            runtime_seconds REAL DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Alerts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT DEFAULT 'info',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Cultivation stages
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cultivation_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


# ============================================================
# SENSOR FUNCTIONS
# ============================================================

def save_sensor_reading(temperature, humidity):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO sensor_readings
        (temperature, humidity)
        VALUES (?, ?)
    """, (temperature, humidity))

    connection.commit()
    connection.close()


def get_sensor_readings(limit=50):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM sensor_readings
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]


# ============================================================
# EQUIPMENT FUNCTIONS
# ============================================================

def save_equipment_log(
    equipment,
    state,
    runtime_seconds=0
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO equipment_logs
        (equipment, state, runtime_seconds)
        VALUES (?, ?, ?)
    """, (
        equipment,
        state,
        runtime_seconds
    ))

    connection.commit()
    connection.close()


def get_equipment_logs(limit=50):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM equipment_logs
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]


# ============================================================
# ALERT FUNCTIONS
# ============================================================

def save_alert(
    alert_type,
    message,
    severity="info"
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO alerts
        (alert_type, message, severity)
        VALUES (?, ?, ?)
    """, (
        alert_type,
        message,
        severity
    ))

    connection.commit()
    connection.close()


def get_alerts(limit=50):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM alerts
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]


# ============================================================
# CULTIVATION STAGE FUNCTIONS
# ============================================================

def save_cultivation_stage(stage):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO cultivation_stages
        (stage)
        VALUES (?)
    """, (stage,))

    connection.commit()
    connection.close()


def get_cultivation_stages(limit=50):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM cultivation_stages
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]