/* =========================================================
   MYCOLOOP
   Intelligent Closed-Loop Mushroom Cultivation System
   app.js
   ========================================================= */

"use strict";

const API_BASE_URL =
    window.MYCOLOOP_API_URL ||
    "http://127.0.0.1:8000/api";

let backendAvailable = false;


async function apiRequest(path, options = {}) {

    try {

        const response = await fetch(
            `${API_BASE_URL}${path}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                },
                ...options
            }
        );

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        backendAvailable = true;
        return await response.json();

    } catch (error) {

        backendAvailable = false;
        console.warn("MycoLoop backend unavailable:", error.message);
        return null;

    }

}


function postSensorReading() {

    apiRequest(
        "/sensor",
        {
            method: "POST",
            body: JSON.stringify({
                temperature,
                humidity
            })
        }
    );

}


function postEquipmentState(equipment, state) {

    apiRequest(
        "/equipment",
        {
            method: "POST",
            body: JSON.stringify({
                equipment,
                state: state ? "ON" : "OFF",
                runtime_seconds: equipment === "fan"
                    ? fanSeconds
                    : pumpSeconds
            })
        }
    );

}


async function loadBackendState() {

    const dashboard = await apiRequest("/dashboard");

    if (!dashboard) {
        initializeHistory();
        return;
    }

    applyBackendDashboard(dashboard);

    const sensorHistory = await apiRequest("/sensor?limit=35");

    if (sensorHistory && sensorHistory.data.length) {
        temperatureHistory = sensorHistory.data
            .slice()
            .reverse()
            .map(reading => Number(reading.temperature));

        humidityHistory = sensorHistory.data
            .slice()
            .reverse()
            .map(reading => Number(reading.humidity));
    } else {
        initializeHistory();
    }

    stageButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.stage === currentStage
        );
    });

}


function applyBackendDashboard(dashboard) {

    const latestSensor = dashboard.latest_sensor;
    const latestStage = dashboard.latest_stage;

    if (latestSensor) {
        temperature = Number(latestSensor.temperature);
        humidity = Number(latestSensor.humidity);
    }

    if (latestStage && stages[latestStage.stage.toLowerCase()]) {
        currentStage = latestStage.stage.toLowerCase();
    }

    const equipmentLogs = dashboard.equipment || [];
    const latestFan = equipmentLogs.find(log => log.equipment === "fan");
    const latestPump = equipmentLogs.find(log => log.equipment === "pump");

    if (latestFan) {
        fanOn = latestFan.state === "ON";
        fanSeconds = Number(latestFan.runtime_seconds || 0);
    }

    if (latestPump) {
        pumpOn = latestPump.state === "ON";
        pumpSeconds = Number(latestPump.runtime_seconds || 0);
    }

    stageButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.stage === currentStage
        );
    });

}


async function refreshBackendState() {

    const dashboard = await apiRequest("/dashboard");

    if (!dashboard) {
        return;
    }

    applyBackendDashboard(dashboard);
    addHistoryPoint();
    updateDashboard();

}


/* =========================================================
   1. ELEMENTS
   ========================================================= */

const temperatureValue = document.getElementById("temperatureValue");
const humidityValue = document.getElementById("humidityValue");

const temperatureBadge = document.getElementById("temperatureBadge");
const humidityBadge = document.getElementById("humidityBadge");

const temperatureTarget = document.getElementById("temperatureTarget");
const humidityTarget = document.getElementById("humidityTarget");

const environmentState = document.getElementById("environmentState");
const environmentMessage = document.getElementById("environmentMessage");

const heroStage = document.getElementById("heroStage");
const heroEnvironment = document.getElementById("heroEnvironment");
const heroAutomation = document.getElementById("heroAutomation");

const fanState = document.getElementById("fanState");
const pumpState = document.getElementById("pumpState");

const fanRuntime = document.getElementById("fanRuntime");
const pumpRuntime = document.getElementById("pumpRuntime");

const resourceFanRuntime = document.getElementById("resourceFanRuntime");
const resourcePumpRuntime = document.getElementById("resourcePumpRuntime");
const resourceSystemState = document.getElementById("resourceSystemState");

const guardianStatus = document.getElementById("guardianStatus");

const chartTemperature = document.getElementById("chartTemperature");
const chartHumidity = document.getElementById("chartHumidity");

const lastUpdated = document.getElementById("lastUpdated");
const systemStatusText = document.getElementById("systemStatusText");

const activityList = document.getElementById("activityList");

const normalTest = document.getElementById("normalTest");
const temperatureTest = document.getElementById("temperatureTest");
const humidityTest = document.getElementById("humidityTest");
const failureTest = document.getElementById("failureTest");

const demoResult = document.getElementById("demoResult");
const demoResultTitle = document.getElementById("demoResultTitle");
const demoResultMessage = document.getElementById("demoResultMessage");

const temperatureCanvas = document.getElementById("temperatureChart");
const humidityCanvas = document.getElementById("humidityChart");

const stageButtons = document.querySelectorAll(".stage-card");
const navItems = document.querySelectorAll(".nav-item");


/* =========================================================
   2. CULTIVATION STAGES
   ========================================================= */

const stages = {

    incubation: {
        name: "Incubation",

        minTemperature: 22,
        maxTemperature: 27,

        minHumidity: 70,
        maxHumidity: 80,

        defaultTemperature: 24.5,
        defaultHumidity: 75
    },

    fruiting: {
        name: "Fruiting",

        minTemperature: 20,
        maxTemperature: 26,

        minHumidity: 80,
        maxHumidity: 90,

        defaultTemperature: 25.8,
        defaultHumidity: 84
    },

    harvest: {
        name: "Harvest",

        minTemperature: 18,
        maxTemperature: 24,

        minHumidity: 75,
        maxHumidity: 85,

        defaultTemperature: 22.5,
        defaultHumidity: 80
    }

};


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

let currentStage = "fruiting";

let temperature = stages[currentStage].defaultTemperature;
let humidity = stages[currentStage].defaultHumidity;

let fanOn = false;
let pumpOn = false;

let fanSeconds = 0;
let pumpSeconds = 0;

let guardianTriggered = false;

let temperatureHistory = [];
let humidityHistory = [];

const HISTORY_LENGTH = 35;


/* =========================================================
   4. UTILITY FUNCTIONS
   ========================================================= */

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}


function formatTime(seconds) {

    const hrs = Math.floor(seconds / 3600);

    const mins = Math.floor(
        (seconds % 3600) / 60
    );

    const secs = seconds % 60;

    return (
        String(hrs).padStart(2, "0") +
        ":" +
        String(mins).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}


function formatShortTime(seconds) {

    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return (
        String(mins).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}


function getCurrentTime() {

    return new Date().toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

}


function getActivityTime() {

    return new Date().toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   5. BADGE HELPER
   ========================================================= */

function setBadge(element, text, type) {

    if (!element) return;

    element.textContent = text;

    element.classList.remove(
        "normal",
        "warning",
        "danger"
    );

    element.classList.add(type);
}


/* =========================================================
   6. ACTIVITY LOG
   ========================================================= */

function addActivity(title, description) {

    if (!activityList) return;

    const activity = document.createElement("div");

    activity.className = "activity-item";

    activity.innerHTML = `
        <span class="activity-time">
            ${getActivityTime()}
        </span>

        <span class="activity-dot"></span>

        <div>
            <strong>${title}</strong>
            <p>${description}</p>
        </div>
    `;

    activityList.prepend(activity);


    /* Keep the activity list clean */

    const activities =
        activityList.querySelectorAll(".activity-item");

    if (activities.length > 7) {
        activities[activities.length - 1].remove();
    }

}


/* =========================================================
   7. ENVIRONMENT ANALYSIS
   ========================================================= */

function analyzeEnvironment() {

    const stage = stages[currentStage];

    const temperatureLow =
        temperature < stage.minTemperature;

    const temperatureHigh =
        temperature > stage.maxTemperature;

    const humidityLow =
        humidity < stage.minHumidity;

    const humidityHigh =
        humidity > stage.maxHumidity;


    /* TEMPERATURE */

    if (temperatureHigh) {

        setBadge(
            temperatureBadge,
            "High",
            "danger"
        );

    } else if (temperatureLow) {

        setBadge(
            temperatureBadge,
            "Low",
            "warning"
        );

    } else {

        setBadge(
            temperatureBadge,
            "Normal",
            "normal"
        );

    }


    /* HUMIDITY */

    if (humidityLow) {

        setBadge(
            humidityBadge,
            "Low",
            "warning"
        );

    } else if (humidityHigh) {

        setBadge(
            humidityBadge,
            "High",
            "warning"
        );

    } else {

        setBadge(
            humidityBadge,
            "Normal",
            "normal"
        );

    }


    /* OVERALL ENVIRONMENT */

    if (
        temperatureHigh ||
        temperatureLow ||
        humidityLow ||
        humidityHigh
    ) {

        environmentState.textContent =
            "ADJUSTING";

        environmentState.style.color =
            "var(--warning)";

        heroEnvironment.textContent =
            "Adjusting";

        resourceSystemState.textContent =
            "Adjusting";

        environmentMessage.textContent =
            "MycoLoop detected conditions outside the target range and is applying automatic correction.";

    } else {

        environmentState.textContent =
            "STABLE";

        environmentState.style.color =
            "var(--success)";

        heroEnvironment.textContent =
            "Stable";

        resourceSystemState.textContent =
            "Stable";

        environmentMessage.textContent =
            "Conditions are within the target range for the selected cultivation stage.";

    }

}


/* =========================================================
   8. CLOSED-LOOP CONTROL
   ========================================================= */

function automaticControl() {

    const stage = stages[currentStage];

    let nextFanState = fanOn;
    let nextPumpState = pumpOn;


    /* FAN CONTROL
       Turn ON when too hot.
       Turn OFF after returning comfortably
       inside the required range.
    */

    if (temperature > stage.maxTemperature) {

        nextFanState = true;

    } else if (
        temperature <
        stage.maxTemperature - 1
    ) {

        nextFanState = false;

    }


    /* PUMP CONTROL
       Turn ON when humidity is too low.
       Turn OFF after sufficient recovery.
    */

    if (humidity < stage.minHumidity) {

        nextPumpState = true;

    } else if (
        humidity >
        stage.minHumidity + 3
    ) {

        nextPumpState = false;

    }


    /* FAN STATE CHANGE */

    if (nextFanState !== fanOn) {

        fanOn = nextFanState;
        postEquipmentState("fan", fanOn);

        if (fanOn) {

            addActivity(
                "Ventilation fan activated",
                "Temperature exceeded the target range."
            );

        } else {

            addActivity(
                "Ventilation fan stopped",
                "Temperature returned to the acceptable range."
            );

        }

    }


    /* PUMP STATE CHANGE */

    if (nextPumpState !== pumpOn) {

        pumpOn = nextPumpState;
        postEquipmentState("pump", pumpOn);

        if (pumpOn) {

            addActivity(
                "Water pump activated",
                "Humidity dropped below the target range."
            );

        } else {

            addActivity(
                "Water pump stopped",
                "Humidity recovered to the required level."
            );

        }

    }

}


/* =========================================================
   9. EQUIPMENT DISPLAY
   ========================================================= */

function updateEquipmentDisplay() {

    if (fanOn) {

        fanState.textContent = "ON";

        fanState.classList.remove("off");
        fanState.classList.add("on");

    } else {

        fanState.textContent = "OFF";

        fanState.classList.remove("on");
        fanState.classList.add("off");

    }


    if (pumpOn) {

        pumpState.textContent = "ON";

        pumpState.classList.remove("off");
        pumpState.classList.add("on");

    } else {

        pumpState.textContent = "OFF";

        pumpState.classList.remove("on");
        pumpState.classList.add("off");

    }

}


/* =========================================================
   10. RUNTIME COUNTER
   ========================================================= */

function updateRuntime() {

    if (fanOn) {
        fanSeconds++;
    }

    if (pumpOn) {
        pumpSeconds++;
    }


    fanRuntime.textContent =
        formatTime(fanSeconds);

    pumpRuntime.textContent =
        formatTime(pumpSeconds);


    resourceFanRuntime.textContent =
        formatShortTime(fanSeconds);

    resourcePumpRuntime.textContent =
        formatShortTime(pumpSeconds);

}


/* =========================================================
   11. SENSOR HISTORY
   ========================================================= */

function initializeHistory() {

    temperatureHistory = [];
    humidityHistory = [];

    for (
        let index = 0;
        index < HISTORY_LENGTH;
        index++
    ) {

        temperatureHistory.push(
            temperature
        );

        humidityHistory.push(
            humidity
        );

    }

}


function addHistoryPoint() {

    temperatureHistory.push(temperature);
    humidityHistory.push(humidity);

    if (
        temperatureHistory.length >
        HISTORY_LENGTH
    ) {

        temperatureHistory.shift();

    }

    if (
        humidityHistory.length >
        HISTORY_LENGTH
    ) {

        humidityHistory.shift();

    }

}


/* =========================================================
   12. CANVAS CHART
   ========================================================= */

function drawChart(
    canvas,
    values,
    minimum,
    maximum
) {

    if (!canvas) return;

    const context =
        canvas.getContext("2d");

    if (!context) return;


    const rect =
        canvas.getBoundingClientRect();

    const pixelRatio =
        window.devicePixelRatio || 1;


    canvas.width =
        Math.max(
            1,
            Math.floor(
                rect.width * pixelRatio
            )
        );

    canvas.height =
        Math.max(
            1,
            Math.floor(
                rect.height * pixelRatio
            )
        );


    context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
    );


    const width = rect.width;
    const height = rect.height;

    const paddingX = 8;
    const paddingY = 15;

    context.clearRect(
        0,
        0,
        width,
        height
    );


    if (values.length < 2) {
        return;
    }


    const usableWidth =
        width - paddingX * 2;

    const usableHeight =
        height - paddingY * 2;


    const range =
        maximum - minimum;


    /* AREA */

    const areaGradient =
        context.createLinearGradient(
            0,
            paddingY,
            0,
            height
        );

    areaGradient.addColorStop(
        0,
        "rgba(109, 76, 65, 0.16)"
    );

    areaGradient.addColorStop(
        1,
        "rgba(109, 76, 65, 0)"
    );


    context.beginPath();


    values.forEach(
        (value, index) => {

            const x =
                paddingX +
                (
                    index /
                    (values.length - 1)
                ) *
                usableWidth;

            const normalized =
                clamp(
                    (value - minimum) /
                    range,
                    0,
                    1
                );

            const y =
                paddingY +
                (1 - normalized) *
                usableHeight;


            if (index === 0) {

                context.moveTo(x, y);

            } else {

                context.lineTo(x, y);

            }

        }
    );


    context.lineTo(
        width - paddingX,
        height - paddingY
    );

    context.lineTo(
        paddingX,
        height - paddingY
    );

    context.closePath();

    context.fillStyle =
        areaGradient;

    context.fill();


    /* LINE */

    context.beginPath();


    values.forEach(
        (value, index) => {

            const x =
                paddingX +
                (
                    index /
                    (values.length - 1)
                ) *
                usableWidth;

            const normalized =
                clamp(
                    (value - minimum) /
                    range,
                    0,
                    1
                );

            const y =
                paddingY +
                (1 - normalized) *
                usableHeight;


            if (index === 0) {

                context.moveTo(x, y);

            } else {

                context.lineTo(x, y);

            }

        }
    );


    context.strokeStyle =
        "#6D4C41";

    context.lineWidth = 2;

    context.lineJoin = "round";
    context.lineCap = "round";

    context.stroke();


    /* CURRENT POINT */

    const latestValue =
        values[values.length - 1];

    const latestNormalized =
        clamp(
            (latestValue - minimum) /
            range,
            0,
            1
        );

    const latestX =
        width - paddingX;

    const latestY =
        paddingY +
        (1 - latestNormalized) *
        usableHeight;


    context.beginPath();

    context.arc(
        latestX,
        latestY,
        3.5,
        0,
        Math.PI * 2
    );

    context.fillStyle =
        "#4E342E";

    context.fill();

}


/* =========================================================
   13. UPDATE CHARTS
   ========================================================= */

function updateCharts() {

    const stage =
        stages[currentStage];


    drawChart(
        temperatureCanvas,
        temperatureHistory,
        stage.minTemperature - 5,
        stage.maxTemperature + 5
    );


    drawChart(
        humidityCanvas,
        humidityHistory,
        stage.minHumidity - 15,
        stage.maxHumidity + 15
    );

}


/* =========================================================
   14. MAIN DASHBOARD UPDATE
   ========================================================= */

function updateDashboard() {

    const stage =
        stages[currentStage];


    temperatureValue.textContent =
        temperature.toFixed(1);

    humidityValue.textContent =
        Math.round(humidity);


    chartTemperature.textContent =
        temperature.toFixed(1) + "°C";

    chartHumidity.textContent =
        Math.round(humidity) + "%";


    temperatureTarget.textContent =
        `${stage.minTemperature}–${stage.maxTemperature}°C`;

    humidityTarget.textContent =
        `${stage.minHumidity}–${stage.maxHumidity}%`;


    heroStage.textContent =
        stage.name;

    heroAutomation.textContent =
        "Active";


    lastUpdated.textContent =
        getCurrentTime();

    systemStatusText.textContent = backendAvailable
        ? "Backend Connected"
        : "Backend Offline";


    analyzeEnvironment();

    updateEquipmentDisplay();

    updateCharts();

}


/* =========================================================
   15. NATURAL SENSOR MOVEMENT
   ========================================================= */

function updateSensorValues() {

    return refreshBackendState();

}


/* =========================================================
   16. CULTIVATION STAGE CHANGE
   ========================================================= */

function selectStage(stageKey) {

    if (!stages[stageKey]) {
        return;
    }


    currentStage = stageKey;

    apiRequest(
        "/stage",
        {
            method: "POST",
            body: JSON.stringify({ stage: stageKey })
        }
    );

    const stage =
        stages[currentStage];


    stageButtons.forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.stage ===
                stageKey
            );

        }
    );


    /*
       Start new stage around suitable conditions.
    */

    temperature =
        stage.defaultTemperature;

    humidity =
        stage.defaultHumidity;


    fanOn = false;
    pumpOn = false;

    guardianTriggered = false;


    guardianStatus.textContent =
        "PROTECTED";

    guardianStatus.classList.remove(
        "alert"
    );

    guardianStatus.classList.add(
        "protected"
    );


    initializeHistory();


    addActivity(
        `${stage.name} stage selected`,
        `Environmental targets were updated for ${stage.name.toLowerCase()} conditions.`
    );


    showTestResult(
        "Stage Updated",
        `${stage.name} environmental targets are now active.`,
        "normal"
    );


    automaticControl();

    updateDashboard();

}


/* =========================================================
   17. TEST RESULT
   ========================================================= */

function showTestResult(
    title,
    message,
    type = "normal"
) {

    if (
        !demoResult ||
        !demoResultTitle ||
        !demoResultMessage
    ) {
        return;
    }


    demoResultTitle.textContent =
        title;

    demoResultMessage.textContent =
        message;


    demoResult.classList.remove(
        "warning",
        "danger"
    );


    if (type === "warning") {

        demoResult.classList.add(
            "warning"
        );

    }


    if (type === "danger") {

        demoResult.classList.add(
            "danger"
        );

    }

}


/* =========================================================
   18. NORMAL ENVIRONMENT TEST
   ========================================================= */

function runNormalTest() {

    const stage =
        stages[currentStage];


    guardianTriggered = false;


    temperature =
        stage.defaultTemperature;

    humidity =
        stage.defaultHumidity;


    fanOn = false;
    pumpOn = false;


    guardianStatus.textContent =
        "PROTECTED";

    guardianStatus.classList.remove(
        "alert"
    );

    guardianStatus.classList.add(
        "protected"
    );


    addActivity(
        "Normal environment test",
        "Environmental values restored to the selected stage target."
    );


    showTestResult(
        "Environment Stable",
        "Temperature and humidity are inside the required cultivation range.",
        "normal"
    );


    addHistoryPoint();

    postSensorReading();

    updateDashboard();

}


/* =========================================================
   19. HIGH TEMPERATURE TEST
   ========================================================= */

function runTemperatureTest() {

    const stage =
        stages[currentStage];


    guardianTriggered = false;


    temperature =
        stage.maxTemperature + 4.2;


    /*
       Keep humidity normal so the fan response
       is easy to demonstrate.
    */

    humidity =
        stage.defaultHumidity;


    automaticControl();


    addActivity(
        "High temperature detected",
        "MycoLoop activated ventilation to reduce chamber temperature."
    );


    showTestResult(
        "Cooling Response Activated",
        "Temperature exceeded the stage limit. The ventilation fan has been activated automatically.",
        "warning"
    );


    addHistoryPoint();

    postSensorReading();

    updateDashboard();

}


/* =========================================================
   20. LOW HUMIDITY TEST
   ========================================================= */

function runHumidityTest() {

    const stage =
        stages[currentStage];


    guardianTriggered = false;


    temperature =
        stage.defaultTemperature;


    humidity =
        stage.minHumidity - 12;


    automaticControl();


    addActivity(
        "Low humidity detected",
        "MycoLoop activated the water pump to restore humidity."
    );


    showTestResult(
        "Humidity Recovery Activated",
        "Humidity dropped below the stage limit. The water pump has been activated automatically.",
        "warning"
    );


    addHistoryPoint();

    postSensorReading();

    updateDashboard();

}


/* =========================================================
   21. RESOURCE GUARDIAN
   ========================================================= */

function resourceGuardian() {

    guardianTriggered = true;


    /*
       Simulated failure condition:
       Pump is running but humidity does not improve.
       MycoLoop stops the equipment to prevent
       unnecessary resource consumption.
    */

    const stage =
        stages[currentStage];


    temperature =
        stage.defaultTemperature;

    humidity =
        stage.minHumidity - 14;


    fanOn = false;
    pumpOn = true;

    postEquipmentState("fan", fanOn);
    postEquipmentState("pump", pumpOn);
    postSensorReading();


    updateDashboard();


    showTestResult(
        "Checking Equipment Response",
        "The pump is active. MycoLoop is checking whether humidity responds correctly.",
        "warning"
    );


    addActivity(
        "Resource Guardian monitoring",
        "Pump response is being checked against environmental feedback."
    );


    setTimeout(
        () => {

            if (!guardianTriggered) {
                return;
            }


            /*
               No environmental response detected.
               Stop pump.
            */

            pumpOn = false;

            postEquipmentState("pump", pumpOn);


            guardianStatus.textContent =
                "INTERVENTION";

            guardianStatus.classList.remove(
                "protected"
            );

            guardianStatus.classList.add(
                "alert"
            );


            resourceSystemState.textContent =
                "Protected";


            showTestResult(
                "Resource Guardian Intervention",
                "Humidity did not respond as expected. The pump was stopped to prevent unnecessary water and energy usage.",
                "danger"
            );


            addActivity(
                "Resource Guardian intervened",
                "Pump stopped after environmental response was not detected."
            );


            updateEquipmentDisplay();

            updateDashboard();

        },
        2600
    );

}


/* =========================================================
   22. NAVIGATION
   ========================================================= */

function setupNavigation() {

    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    const targetId =
                        item.dataset.target;

                    const target =
                        document.getElementById(
                            targetId
                        );


                    if (!target) {
                        return;
                    }


                    navItems.forEach(
                        nav =>
                            nav.classList.remove(
                                "active"
                            )
                    );


                    item.classList.add(
                        "active"
                    );


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        }
    );

}


/* =========================================================
   23. STAGE BUTTON EVENTS
   ========================================================= */

stageButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                selectStage(
                    button.dataset.stage
                );

            }
        );

    }
);


/* =========================================================
   24. SYSTEM TEST EVENTS
   ========================================================= */

if (normalTest) {

    normalTest.addEventListener(
        "click",
        runNormalTest
    );

}


if (temperatureTest) {

    temperatureTest.addEventListener(
        "click",
        runTemperatureTest
    );

}


if (humidityTest) {

    humidityTest.addEventListener(
        "click",
        runHumidityTest
    );

}


if (failureTest) {

    failureTest.addEventListener(
        "click",
        resourceGuardian
    );

}


/* =========================================================
   25. WINDOW RESIZE
   ========================================================= */

let resizeTimer = null;


window.addEventListener(
    "resize",
    () => {

        clearTimeout(
            resizeTimer
        );


        resizeTimer =
            setTimeout(
                updateCharts,
                100
            );

    }
);


/* =========================================================
   26. CLOCK
   ========================================================= */

function updateClock() {

    if (lastUpdated) {

        lastUpdated.textContent =
            getCurrentTime();

    }

}


/* =========================================================
   27. INITIALIZATION
   ========================================================= */

function initializeMycoLoop() {

    setupNavigation();

    loadBackendState().then(() => {

        automaticControl();

        updateDashboard();

        updateRuntime();

        systemStatusText.textContent = backendAvailable
            ? "Backend Connected"
            : "Demo Mode";

    });


    addActivity(
        "MycoLoop ready",
        "Environmental monitoring and closed-loop automation initialized."
    );


    /*
       Sensor refresh
    */

    setInterval(
        refreshBackendState,
        3000
    );


    /*
       Equipment runtime counter
    */

    setInterval(
        updateRuntime,
        1000
    );


    /*
       Clock
    */

    setInterval(
        updateClock,
        1000
    );

}


/* =========================================================
   28. START MYCOLOOP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeMycoLoop
);