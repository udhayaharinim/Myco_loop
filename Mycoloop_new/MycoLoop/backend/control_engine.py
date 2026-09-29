from typing import Dict

from models import ControlDecision, StageProfile


PROFILES: Dict[str, StageProfile] = {
    "incubation": StageProfile(
        name="Incubation",
        temp_min=24,
        temp_max=28,
        humidity_min=75,
        humidity_max=85,
    ),
    "fruiting": StageProfile(
        name="Fruiting",
        temp_min=24,
        temp_max=28,
        humidity_min=80,
        humidity_max=90,
    ),
    "harvest": StageProfile(
        name="Harvest",
        temp_min=23,
        temp_max=27,
        humidity_min=75,
        humidity_max=85,
    ),
}


MAX_PUMP_RUNTIME = 15
MAX_FAN_RUNTIME = 30


def get_profile(stage: str) -> StageProfile:
    stage = stage.lower()

    if stage not in PROFILES:
        stage = "fruiting"

    return PROFILES[stage]


def temperature_status(
    temperature: float,
    profile: StageProfile,
) -> str:

    if temperature < profile.temp_min:
        return "Low"

    if temperature > profile.temp_max:
        return "High"

    return "Normal"


def humidity_status(
    humidity: float,
    profile: StageProfile,
) -> str:

    if humidity < profile.humidity_min:
        return "Low"

    if humidity > profile.humidity_max:
        return "High"

    return "Normal"


def environment_status(
    temperature: float,
    humidity: float,
    profile: StageProfile,
) -> str:

    temp_ok = profile.temp_min <= temperature <= profile.temp_max
    humidity_ok = profile.humidity_min <= humidity <= profile.humidity_max

    if temp_ok and humidity_ok:
        return "STABLE"

    return "ATTENTION"


def make_decision(
    stage: str,
    temperature: float,
    humidity: float,
    fan_on: bool,
    pump_on: bool,
    pump_runtime: int = 0,
    fan_runtime: int = 0,
) -> ControlDecision:

    profile = get_profile(stage)

    temp_status = temperature_status(
        temperature,
        profile,
    )

    humidity_status_value = humidity_status(
        humidity,
        profile,
    )

    env_status = environment_status(
        temperature,
        humidity,
        profile,
    )

    decision = "Maintain environment"
    action = "No actuator change"
    reason = (
        f"Temperature and humidity are within the "
        f"{profile.name.lower()} target range."
    )

    alert = None

    # ------------------------------------------
    # RESOURCE GUARDIAN
    # ------------------------------------------

    if pump_on and pump_runtime >= MAX_PUMP_RUNTIME:

        return ControlDecision(
            stage=stage,
            temperature=temperature,
            humidity=humidity,
            temperature_status=temp_status,
            humidity_status=humidity_status_value,
            environment_status=env_status,
            decision="Pump safety timeout",
            action="STOP PUMP",
            reason=(
                "Pump runtime exceeded the safety limit. "
                "Water delivery must be checked."
            ),
            fan_on=fan_on,
            pump_on=False,
            alert="Pump safety timeout",
        )

    if fan_on and fan_runtime >= MAX_FAN_RUNTIME:

        return ControlDecision(
            stage=stage,
            temperature=temperature,
            humidity=humidity,
            temperature_status=temp_status,
            humidity_status=humidity_status_value,
            environment_status=env_status,
            decision="Fan safety timeout",
            action="STOP FAN",
            reason=(
                "Fan runtime exceeded the safety limit. "
                "Ventilation system must be checked."
            ),
            fan_on=False,
            pump_on=pump_on,
            alert="Fan safety timeout",
        )

    # ------------------------------------------
    # HIGH TEMPERATURE
    # ------------------------------------------

    if temperature > profile.temp_max:

        decision = "Temperature is above target"
        action = "START FAN"
        reason = (
            f"Temperature {temperature:.1f}°C is above the "
            f"{profile.temp_max:.1f}°C maximum for {profile.name.lower()}."
        )

        return ControlDecision(
            stage=stage,
            temperature=temperature,
            humidity=humidity,
            temperature_status=temp_status,
            humidity_status=humidity_status_value,
            environment_status=env_status,
            decision=decision,
            action=action,
            reason=reason,
            fan_on=True,
            pump_on=False if humidity >= profile.humidity_min else pump_on,
            alert=None,
        )

    # ------------------------------------------
    # LOW TEMPERATURE
    # ------------------------------------------

    if temperature < profile.temp_min:

        decision = "Temperature is below target"
        action = "Monitor temperature"
        reason = (
            f"Temperature {temperature:.1f}°C is below the "
            f"{profile.temp_min:.1f}°C minimum for {profile.name.lower()}. "
            "No heater actuator is configured in this prototype."
        )

        return ControlDecision(
            stage=stage,
            temperature=temperature,
            humidity=humidity,
            temperature_status=temp_status,
            humidity_status=humidity_status_value,
            environment_status=env_status,
            decision=decision,
            action=action,
            reason=reason,
            fan_on=False,
            pump_on=pump_on,
            alert="Low temperature",
        )

    # ------------------------------------------
    # LOW HUMIDITY
    # ------------------------------------------

    if humidity < profile.humidity_min:

        decision = "Humidity is below target"
        action = "START PUMP"

        reason = (
            f"Humidity {humidity:.1f}% is below the "
            f"{profile.humidity_min:.1f}% minimum for {profile.name.lower()}."
        )

        return ControlDecision(
            stage=stage,
            temperature=temperature,
            humidity=humidity,
            temperature_status=temp_status,
            humidity_status=humidity_status_value,
            environment_status=env_status,
            decision=decision,
            action=action,
            reason=reason,
            fan_on=False,
            pump_on=True,
            alert=None,
        )

    # ------------------------------------------
    # HIGH HUMIDITY
    # ------------------------------------------

    if humidity > profile.humidity_max:

        decision = "Humidity is above target"
        action = "START FAN"

        reason = (
            f"Humidity {humidity:.1f}% is above the "
            f"{profile.humidity_max:.1f}% maximum for {profile.name.lower()}."
        )

        return ControlDecision(
            stage=stage,
            temperature=temperature,
            humidity=humidity,
            temperature_status=temp_status,
            humidity_status=humidity_status_value,
            environment_status=env_status,
            decision=decision,
            action=action,
            reason=reason,
            fan_on=True,
            pump_on=False,
            alert="High humidity",
        )

    # ------------------------------------------
    # STABLE
    # ------------------------------------------

    if fan_on and temperature <= profile.temp_max - 0.5:
        fan_on = False
        action = "STOP FAN"
        decision = "Temperature returned to target"
        reason = "Ventilation is no longer required."

    elif pump_on and humidity >= profile.humidity_min + 2:
        pump_on = False
        action = "STOP PUMP"
        decision = "Humidity returned to target"
        reason = "Watering is no longer required."

    return ControlDecision(
        stage=stage,
        temperature=temperature,
        humidity=humidity,
        temperature_status=temp_status,
        humidity_status=humidity_status_value,
        environment_status=env_status,
        decision=decision,
        action=action,
        reason=reason,
        fan_on=fan_on,
        pump_on=pump_on,
        alert=alert,
    )