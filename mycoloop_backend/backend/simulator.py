from typing import Dict


def normal_environment(stage: str = "fruiting") -> Dict[str, float]:
    profiles = {
        "incubation": {
            "temperature": 26.0,
            "humidity": 80.0,
        },
        "fruiting": {
            "temperature": 26.0,
            "humidity": 85.0,
        },
        "harvest": {
            "temperature": 25.0,
            "humidity": 80.0,
        },
    }

    return profiles.get(stage, profiles["fruiting"])


def high_temperature() -> Dict[str, float]:
    return {
        "temperature": 32.0,
        "humidity": 84.0,
    }


def low_humidity() -> Dict[str, float]:
    return {
        "temperature": 26.0,
        "humidity": 60.0,
    }


def high_humidity() -> Dict[str, float]:
    return {
        "temperature": 26.0,
        "humidity": 96.0,
    }


def low_temperature() -> Dict[str, float]:
    return {
        "temperature": 20.0,
        "humidity": 84.0,
    }


def pump_failure() -> Dict[str, float]:
    return {
        "temperature": 26.0,
        "humidity": 60.0,
    }