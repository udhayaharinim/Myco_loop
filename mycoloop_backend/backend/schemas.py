from typing import Optional

from pydantic import BaseModel, Field


class SensorDataRequest(BaseModel):
    temperature: float = Field(..., ge=-20, le=80)
    humidity: float = Field(..., ge=0, le=100)
    source: str = "hardware"


class StageRequest(BaseModel):
    stage: str


class SensorResponse(BaseModel):
    id: int
    temperature: float
    humidity: float
    source: str
    timestamp: str


class EquipmentResponse(BaseModel):
    fan_on: bool
    pump_on: bool
    fan_runtime: int
    pump_runtime: int
    watering_cycles: int
    ventilation_cycles: int


class DecisionResponse(BaseModel):
    stage: str
    temperature: float
    humidity: float
    temperature_status: str
    humidity_status: str
    environment_status: str
    decision: str
    action: str
    reason: str
    fan_on: bool
    pump_on: bool
    alert: Optional[str] = None


class AlertResponse(BaseModel):
    id: int
    alert_type: str
    message: str
    severity: str
    timestamp: str


class ActivityResponse(BaseModel):
    id: int
    action: str
    details: str
    timestamp: str


class SystemStatusResponse(BaseModel):
    system: str
    data_mode: str
    hardware_connected: bool
    stage: str
    environment_status: str
    temperature: float
    humidity: float
    fan_on: bool
    pump_on: bool