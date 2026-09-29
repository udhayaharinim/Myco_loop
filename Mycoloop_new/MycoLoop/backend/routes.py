from fastapi import APIRouter, HTTPException

try:
    from .database import (
        save_sensor_reading,
        get_sensor_readings,
        save_equipment_log,
        get_equipment_logs,
        save_alert,
        get_alerts,
        save_cultivation_stage,
        get_cultivation_stages
    )
    from .models import (
        SensorReading,
        EquipmentLog,
        AlertCreate,
        CultivationStage,
        HardwareData
    )
except ImportError:
    from database import (
        save_sensor_reading,
        get_sensor_readings,
        save_equipment_log,
        get_equipment_logs,
        save_alert,
        get_alerts,
        save_cultivation_stage,
        get_cultivation_stages
    )
    from models import (
        SensorReading,
        EquipmentLog,
        AlertCreate,
        CultivationStage,
        HardwareData
    )


# ============================================================
# API ROUTER
# ============================================================

router = APIRouter(
    prefix="/api"
)


# ============================================================
# SENSOR API
# ============================================================

@router.post("/sensor")
def add_sensor_reading(data: SensorReading):

    save_sensor_reading(
        data.temperature,
        data.humidity
    )

    return {
        "success": True,
        "message": "Sensor reading saved",
        "temperature": data.temperature,
        "humidity": data.humidity
    }


@router.get("/sensor")
def read_sensor_data(limit: int = 50):

    if limit < 1 or limit > 500:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 500"
        )

    return {
        "success": True,
        "data": get_sensor_readings(limit)
    }


# ============================================================
# ESP32 HARDWARE API
# ============================================================

@router.post("/hardware/data")
def receive_hardware_data(data: HardwareData):

    # Save temperature and humidity
    save_sensor_reading(
        data.temperature,
        data.humidity
    )

    # Save fan status
    if data.fan_status is not None:

        save_equipment_log(
            "fan",
            data.fan_status
        )

    # Save pump status
    if data.pump_status is not None:

        save_equipment_log(
            "pump",
            data.pump_status
        )

    return {
        "success": True,
        "message": "Hardware data received",

        "temperature": data.temperature,
        "humidity": data.humidity,

        "fan_status": data.fan_status,
        "pump_status": data.pump_status
    }


# ============================================================
# EQUIPMENT API
# ============================================================

@router.post("/equipment")
def add_equipment_log(data: EquipmentLog):

    equipment = data.equipment.lower()

    if equipment not in ["fan", "pump"]:

        raise HTTPException(
            status_code=400,
            detail="Equipment must be fan or pump"
        )

    state = data.state.upper()

    if state not in ["ON", "OFF"]:

        raise HTTPException(
            status_code=400,
            detail="State must be ON or OFF"
        )

    save_equipment_log(
        equipment,
        state,
        data.runtime_seconds
    )

    return {
        "success": True,
        "message": "Equipment activity saved",
        "equipment": equipment,
        "state": state,
        "runtime_seconds": data.runtime_seconds
    }


@router.get("/equipment")
def read_equipment_logs(limit: int = 50):

    if limit < 1 or limit > 500:

        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 500"
        )

    return {
        "success": True,
        "data": get_equipment_logs(limit)
    }


# ============================================================
# ALERT API
# ============================================================

@router.post("/alerts")
def create_alert(data: AlertCreate):

    save_alert(
        data.alert_type,
        data.message,
        data.severity
    )

    return {
        "success": True,
        "message": "Alert saved"
    }


@router.get("/alerts")
def read_alerts(limit: int = 50):

    if limit < 1 or limit > 500:

        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 500"
        )

    return {
        "success": True,
        "data": get_alerts(limit)
    }


# ============================================================
# CULTIVATION STAGE API
# ============================================================

@router.post("/stage")
def set_cultivation_stage(data: CultivationStage):

    stage = data.stage.capitalize()

    valid_stages = [
        "Incubation",
        "Fruiting",
        "Harvest"
    ]

    if stage not in valid_stages:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid stage. "
                "Use Incubation, Fruiting or Harvest."
            )
        )

    save_cultivation_stage(stage)

    return {
        "success": True,
        "message": "Cultivation stage saved",
        "stage": stage
    }


@router.get("/stage")
def read_cultivation_stages(limit: int = 50):

    if limit < 1 or limit > 500:

        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 500"
        )

    return {
        "success": True,
        "data": get_cultivation_stages(limit)
    }


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@router.get("/dashboard")
def dashboard_summary():

    sensor_data = get_sensor_readings(1)

    equipment_data = get_equipment_logs(10)

    alerts_data = get_alerts(10)

    stages_data = get_cultivation_stages(1)

    latest_sensor = (
        sensor_data[0]
        if sensor_data
        else None
    )

    latest_stage = (
        stages_data[0]
        if stages_data
        else None
    )

    return {
        "success": True,

        "latest_sensor": latest_sensor,

        "latest_stage": latest_stage,

        "equipment": equipment_data,

        "alerts": alerts_data
    }