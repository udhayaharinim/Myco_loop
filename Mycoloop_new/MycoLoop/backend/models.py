from pydantic import BaseModel, Field
from typing import Optional


# ============================================================
# SENSOR DATA
# ============================================================

class SensorReading(BaseModel):

    temperature: float = Field(
        ...,
        description="Temperature in Celsius"
    )

    humidity: float = Field(
        ...,
        description="Relative humidity percentage"
    )


# ============================================================
# EQUIPMENT
# ============================================================

class EquipmentLog(BaseModel):

    equipment: str = Field(
        ...,
        description="fan or pump"
    )

    state: str = Field(
        ...,
        description="ON or OFF"
    )

    runtime_seconds: float = Field(
        0,
        description="Runtime in seconds"
    )


# ============================================================
# ALERT
# ============================================================

class AlertCreate(BaseModel):

    alert_type: str

    message: str

    severity: str = "info"


# ============================================================
# CULTIVATION STAGE
# ============================================================

class CultivationStage(BaseModel):

    stage: str = Field(
        ...,
        description="Incubation, Fruiting or Harvest"
    )


# ============================================================
# ESP32 HARDWARE DATA
# ============================================================

class HardwareData(BaseModel):

    temperature: float

    humidity: float

    fan_status: Optional[str] = "OFF"

    pump_status: Optional[str] = "OFF"