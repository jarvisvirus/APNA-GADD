"use strict";

/* =========================================================
   MOUNTAIN RUSH
   VERSION 2
   Endless Cartoon Hill Racing
   ========================================================= */


/* =========================================================
   1. GAME CONFIGURATION
   ========================================================= */

const CONFIG = {

    canvasWidth: 1200,
    canvasHeight: 650,

    gravity: 1500,

    maxForwardSpeed: 780,
    maxReverseSpeed: -280,

    acceleration: 680,
    reverseAcceleration: 500,

    airRotationSpeed: 4.4,

    groundFriction: 0.985,

    rollingResistance: 0.992,

    suspensionStrength: 0.18,

    suspensionDamping: 0.75,

    fuelConsumption: 0.20,

    accelerationFuelConsumption: 1.8,

    nitroFuelConsumption: 5,

    nitroAcceleration: 1050,

    nitroMaxSpeed: 1150,

    nitroDuration: 1.8,

    checkpointDistance: 1000,

    stageDistance: 5000,

    terrainSample: 8,

    terrainBase: 470,

    objectSpacing: 90,

    maxParticles: 300,

    cameraSmoothness: 5.5,

    shakeDecay: 8

};


/* =========================================================
   2. GAME STATES
   ========================================================= */

const GAME_STATE = {

    MENU: "MENU",

    PLAYING: "PLAYING",

    PAUSED: "PAUSED",

    CRASHED: "CRASHED",

    STAGE_COMPLETE: "STAGE_COMPLETE"

};


let gameState = GAME_STATE.MENU;


/* =========================================================
   3. CANVAS
   ========================================================= */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d", {
        alpha: false
    });


canvas.width =
    CONFIG.canvasWidth;

canvas.height =
    CONFIG.canvasHeight;


/* =========================================================
   4. DOM
   ========================================================= */

const UI = {

    distance:
        document.getElementById("distance"),

    score:
        document.getElementById("score"),

    coins:
        document.getElementById("coins"),

    fuelBar:
        document.getElementById("fuelBar"),

    nitroBar:
        document.getElementById("nitroBar"),

    nitroText:
        document.getElementById("nitroText"),

    checkpointText:
        document.getElementById("checkpointText"),

    stageText:
        document.getElementById("stageText"),

    bestText:
        document.getElementById("bestText"),

    startScreen:
        document.getElementById("startScreen"),

    crashScreen:
        document.getElementById("crashScreen"),

    pauseScreen:
        document.getElementById("pauseScreen"),

    startButton:
        document.getElementById("startButton"),

    restartButton:
        document.getElementById("restartButton"),

    resumeButton:
        document.getElementById("resumeButton"),

    pauseButton:
        document.getElementById("pauseButton"),

    finalDistance:
        document.getElementById("finalDistance"),

    finalCoins:
        document.getElementById("finalCoins"),

    finalScore:
        document.getElementById("finalScore"),

    finalStage:
        document.getElementById("finalStage"),

    stageNotification:
        document.getElementById("stageNotification"),

    stageNumber:
        document.getElementById("stageNumber")

};


/* =========================================================
   5. INPUT
   ========================================================= */

const input = {

    left: false,

    right: false,

    rotateLeft: false,

    rotateRight: false,

    nitro: false

};


const keyMap = {

    ArrowLeft: "left",
    a: "left",
    A: "left",

    ArrowRight: "right",
    d: "right",
    D: "right",

    ArrowUp: "rotateLeft",
    w: "rotateLeft",
    W: "rotateLeft",

    ArrowDown: "rotateRight",
    s: "rotateRight",
    S: "rotateRight",

    " ": "nitro"

};


window.addEventListener(
    "keydown",
    event => {

        if (keyMap[event.key] !== undefined) {

            event.preventDefault();

            input[
                keyMap[event.key]
            ] = true;

        }


        if (
            event.key === "p" ||
            event.key === "P" ||
            event.key === "Escape"
        ) {

            event.preventDefault();

            togglePause();

        }

    },
    {
        passive: false
    }
);


window.addEventListener(
    "keyup",
    event => {

        if (keyMap[event.key] !== undefined) {

            event.preventDefault();

            input[
                keyMap[event.key]
            ] = false;

        }

    },
    {
        passive: false
    }
);


/* =========================================================
   6. MOBILE TOUCH
   ========================================================= */

function bindTouchButton(
    element,
    property
) {

    const button =
        document.getElementById(element);


    if (!button) {
        return;
    }


    const start = event => {

        event.preventDefault();

        input[property] = true;

        try {

            button.setPointerCapture(
                event.pointerId
            );

        } catch (_) {}

    };


    const end = event => {

        event.preventDefault();

        input[property] = false;

    };


    button.addEventListener(
        "pointerdown",
        start,
        {
            passive: false
        }
    );


    button.addEventListener(
        "pointerup",
        end,
        {
            passive: false
        }
    );


    button.addEventListener(
        "pointercancel",
        end,
        {
            passive: false
        }
    );


    button.addEventListener(
        "pointerleave",
        end,
        {
            passive: false
        }
    );

}


bindTouchButton(
    "leftTouch",
    "left"
);


bindTouchButton(
    "rightTouch",
    "right"
);


bindTouchButton(
    "nitroTouch",
    "nitro"
);


/* =========================================================
   7. AUDIO SYSTEM
   No external assets required.
   ========================================================= */

let audioContext = null;


const AudioSystem = {

    init() {

        if (!audioContext) {

            const AudioCtx =
                window.AudioContext ||
                window.webkitAudioContext;

            if (AudioCtx) {

                audioContext =
                    new AudioCtx();

            }

        }


        if (
            audioContext &&
            audioContext.state === "suspended"
        ) {

            audioContext.resume();

        }

    },


    tone(
        frequency,
        duration,
        type = "sine",
        volume = 0.04
    ) {

        if (!audioContext) {
            return;
        }


        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();


        oscillator.type =
            type;

        oscillator.frequency.value =
            frequency;


        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            volume,
            audioContext.currentTime + 0.01
        );


        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + duration
        );


        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + duration + 0.02
        );

    },


    coin() {

        this.tone(
            900,
            0.08,
            "square",
            0.035
        );

        setTimeout(
            () => {
                this.tone(
                    1300,
                    0.09,
                    "square",
                    0.03
                );
            },
            45
        );

    },


    fuel() {

        this.tone(
            500,
            0.1,
            "sine",
            0.035
        );

        setTimeout(
            () => {
                this.tone(
                    750,
                    0.12,
                    "sine",
                    0.03
                );
            },
            70
        );

    },


    nitro() {

        this.tone(
            110,
            0.35,
            "sawtooth",
            0.035
        );

    },


    checkpoint() {

        this.tone(
            650,
            0.1,
            "triangle",
            0.04
        );

        setTimeout(
            () => {
                this.tone(
                    1000,
                    0.18,
                    "triangle",
                    0.04
                );
            },
            100
        );

    },


    crash() {

        this.tone(
            90,
            0.35,
            "sawtooth",
            0.07
        );

    },


    finish() {

        this.tone(
            700,
            0.12,
            "triangle",
            0.04
        );

        setTimeout(
            () => {
                this.tone(
                    900,
                    0.12,
                    "triangle",
                    0.04
                );
            },
            100
        );

        setTimeout(
            () => {
                this.tone(
                    1200,
                    0.2,
                    "triangle",
                    0.04
                );
            },
            200
        );

    }

};


/* =========================================================
   8. GAME VARIABLES
   ========================================================= */

let distance = 0;

let score = 0;

let coins = 0;

let fuel = 100;

let nitro = 100;

let stage = 1;

let nextCheckpoint = CONFIG.checkpointDistance;

let lastCheckpoint = 0;

let cameraX = 0;

let cameraY = 0;

let targetCameraX = 0;

let targetCameraY = 0;

let screenShake = 0;

let worldTime = 0;

let lastTime = 0;

let animationFrame = 0;

let bestDistance =
    Number(
        localStorage.getItem(
            "mountainRushBestDistance"
        ) || 0
    );


/* =========================================================
   9. CAR
   ========================================================= */

const car = {

    x: 220,

    y: 350,

    width: 100,

    height: 46,

    vx: 0,

    vy: 0,

    rotation: 0,

    angularVelocity: 0,

    wheelRotation: 0,

    grounded: false,

    suspensionVelocity: 0,

    previousGroundY: 0,

    wasGrounded: false,

    nitroActive: false,

    wheelBase: 62,

    wheelRadius: 17

};


/* =========================================================
   10. TERRAIN
   ========================================================= */

function terrainHeight(x) {

    const stageFactor =
        1 +
        Math.min(
            stage * 0.025,
            0.35
        );


    const broad =
        Math.sin(
            x * 0.0032
        ) * 62 * stageFactor;


    const medium =
        Math.sin(
            x * 0.007
        ) * 28 * stageFactor;


    const rolling =
        Math.sin(
            x * 0.014
        ) * 12;


    const gentle =
        Math.sin(
            x * 0.0011
        ) * 42;


    return (
        CONFIG.terrainBase
        - broad
        - medium
        - rolling
        - gentle
    );

}


function terrainSlope(x) {

    const dx = 4;


    return (
        terrainHeight(x + dx)
        -
        terrainHeight(x - dx)
    ) / (dx * 2);

}


function terrainAngle(x) {

    return Math.atan(
        terrainSlope(x)
    );

}


/* =========================================================
   11. WORLD OBJECTS
   ========================================================= */

const coinsList = [];

const fuelList = [];

const sceneryList = [];

const checkpoints = [];


let generatedUntil = 0;


function seededRandom(seed) {

    const value =
        Math.sin(seed * 12.9898)
        * 43758.5453;

    return value -
        Math.floor(value);

}


function ensureWorldGenerated() {

    const required =
        car.x +
        CONFIG.canvasWidth * 2;


    while (
        generatedUntil <
        required
    ) {

        generateWorldChunk(
            generatedUntil
        );

        generatedUntil +=
            CONFIG.objectSpacing;

    }

}


function generateWorldChunk(startX) {

    if (startX < 400) {
        return;
    }


    const random =
        seededRandom(
            Math.floor(startX / 10)
        );


    const terrainY =
        terrainHeight(startX);


    /* ==========================
       COINS
       ========================== */

    if (
        random > 0.15 &&
        random < 0.72
    ) {

        const wave =
            Math.sin(
                startX * 0.08
            ) * 8;


        coinsList.push({

            x: startX,

            y:
                terrainY
                - 70
                - wave,

            radius: 13,

            phase:
                random * Math.PI * 2,

            collected: false

        });

    }


    /* ==========================
       FUEL
       ========================== */

    if (
        Math.floor(startX) % 1700 <
        CONFIG.objectSpacing
    ) {

        fuelList.push({

            x: startX,

            y: terrainY - 55,

            phase:
                random * Math.PI * 2,

            collected: false

        });

    }


    /* ==========================
       TREES
       ========================== */

    if (random > 0.80) {

        sceneryList.push({

            type: "tree",

            x: startX,

            y: terrainY,

            scale:
                0.75 +
                random * 0.7

        });

    }


    /* ==========================
       ROCKS
       ========================== */

    if (
        random > 0.68 &&
        random <= 0.80
    ) {

        sceneryList.push({

            type: "rock",

            x: startX,

            y: terrainY,

            scale:
                0.55 +
                random * 0.75

        });

    }


    /* ==========================
       CHECKPOINTS
       ========================== */

    const distanceFromStart =
        Math.floor(
            (startX - 200) / 10
        );


    if (
        distanceFromStart > 0 &&
        distanceFromStart %
            CONFIG.checkpointDistance === 0
    ) {

        checkpoints.push({

            x: startX,

            triggered: false

        });

    }

}


/* =========================================================
   12. PARTICLE SYSTEM
   ========================================================= */

const particles = [];


function spawnParticle(options) {

    if (
        particles.length >=
        CONFIG.maxParticles
    ) {

        return;

    }


    particles.push({

        x:
            options.x || 0,

        y:
            options.y || 0,

        vx:
            options.vx || 0,

        vy:
            options.vy || 0,

        life:
            options.life || 0.5,

        maxLife:
            options.life || 0.5,

        size:
            options.size || 5,

        gravity:
            options.gravity || 0,

        type:
            options.type || "dust",

        rotation:
            options.rotation || 0,

        rotationSpeed:
            options.rotationSpeed || 0

    });

}


function burstParticles(
    x,
    y,
    amount,
    type
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const angle =
            Math.random()
            * Math.PI
            * 2;


        const speed =
            50 +
            Math.random() * 180;


        spawnParticle({

            x,
            y,

            vx:
                Math.cos(angle)
                * speed,

            vy:
                Math.sin(angle)
                * speed,

            life:
                0.35 +
                Math.random() * 0.5,

            size:
                3 +
                Math.random() * 6,

            gravity:
                type === "dust"
                    ? 120
                    : 300,

            type

        });

    }

}


function updateParticles(delta) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];


        p.life -= delta;


        if (p.life <= 0) {

            particles.splice(
                i,
                1
            );

            continue;

        }


        p.x +=
            p.vx * delta;

        p.y +=
            p.vy * delta;

        p.vy +=
            p.gravity * delta;

        p.rotation +=
            p.rotationSpeed * delta;

    }

}


function drawParticles() {

    for (const p of particles) {

        const alpha =
            Math.max(
                0,
                p.life / p.maxLife
            );


        const screenX =
            p.x - cameraX;

        const screenY =
            p.y - cameraY;


        if (
            screenX < -50 ||
            screenX > canvas.width + 50 ||
            screenY < -50 ||
            screenY > canvas.height + 50
        ) {

            continue;

        }


        ctx.save();

        ctx.globalAlpha =
            alpha;


        if (
            p.type === "dust"
        ) {

            ctx.fillStyle =
                "#c8a777";

            ctx.beginPath();

            ctx.arc(
                screenX,
                screenY,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }


        else if (
            p.type === "coin"
        ) {

            ctx.fillStyle =
                "#ffd84d";

            ctx.fillRect(
                screenX,
                screenY,
                p.size,
                p.size
            );

        }


        else if (
            p.type === "fuel"
        ) {

            ctx.fillStyle =
                "#63e879";

            ctx.beginPath();

            ctx.arc(
                screenX,
                screenY,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }


        else if (
            p.type === "spark"
        ) {

            ctx.strokeStyle =
                "#ffd45a";

            ctx.lineWidth =
                3;

            ctx.beginPath();

            ctx.moveTo(
                screenX,
                screenY
            );

            ctx.lineTo(
                screenX - p.vx * 0.04,
                screenY - p.vy * 0.04
            );

            ctx.stroke();

        }


        else if (
            p.type === "nitro"
        ) {

            ctx.fillStyle =
                "#67d9ff";

            ctx.beginPath();

            ctx.arc(
                screenX,
                screenY,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }


        ctx.restore();

    }

}


/* =========================================================
   13. CAR PHYSICS
   ========================================================= */

function updateCar(delta) {

    const previousX =
        car.x;


    const wasGrounded =
        car.grounded;


    /* ==========================
       INPUT ACCELERATION
       ========================== */

    if (input.right) {

        car.vx +=
            CONFIG.acceleration
            * delta;

        fuel -=
            CONFIG.accelerationFuelConsumption
            * delta;

    }


    if (input.left) {

        car.vx -=
            CONFIG.reverseAcceleration
            * delta;

        fuel -=
            0.8 * delta;

    }


    /* ==========================
       NITRO
       ========================== */

    car.nitroActive =
        input.nitro &&
        nitro > 0 &&
        car.vx > 30;


    if (car.nitroActive) {

        car.vx +=
            CONFIG.nitroAcceleration
            * delta;

        nitro -=
            CONFIG.nitroFuelConsumption
            * delta;


        spawnNitroTrail();

    }


    else {

        nitro +=
            3.2 * delta;

    }


    nitro =
        Math.max(
            0,
            Math.min(
                100,
                nitro
            )
        );


    /* ==========================
       SPEED LIMIT
       ========================== */

    const maxSpeed =
        car.nitroActive
            ? CONFIG.nitroMaxSpeed
            : CONFIG.maxForwardSpeed;


    car.vx =
        Math.max(
            CONFIG.maxReverseSpeed,
            Math.min(
                maxSpeed,
                car.vx
            )
        );


    /* ==========================
       GRAVITY
       ========================== */

    car.vy +=
        CONFIG.gravity
        * delta;


    /* ==========================
       POSITION
       ========================== */

    car.x +=
        car.vx * delta;

    car.y +=
        car.vy * delta;


    /* ==========================
       TERRAIN COLLISION
       ========================== */

    const groundY =
        terrainHeight(
            car.x
        );


    const wheelBottom =
        car.y + 37;


    const penetration =
        wheelBottom - groundY;


    if (penetration >= 0) {

        car.grounded = true;


        car.y -=
            penetration
            * CONFIG.suspensionStrength;


        const slopeAngle =
            terrainAngle(
                car.x
            );


        /* Smooth suspension */

        const angleDifference =
            normalizeAngle(
                slopeAngle
                - car.rotation
            );


        car.angularVelocity +=
            angleDifference
            * 16
            * delta;


        car.angularVelocity *=
            Math.pow(
                0.45,
                delta
            );


        car.rotation +=
            car.angularVelocity
            * delta;


        car.vy *=
            -CONFIG.suspensionDamping;


        if (
            Math.abs(car.vy) < 20
        ) {

            car.vy = 0;

        }


        /* Ground friction */

        car.vx *=
            Math.pow(
                CONFIG.groundFriction,
                delta * 60
            );


        /* Wheel rotation */

        car.wheelRotation +=
            (
                car.vx /
                car.wheelRadius
            )
            * delta;


        /* Landing dust */

        if (
            !wasGrounded &&
            Math.abs(car.vy) > 100
        ) {

            spawnLandingDust();

        }

    }


    else {

        car.grounded = false;


        /* Air control */

        if (input.rotateLeft) {

            car.angularVelocity -=
                CONFIG.airRotationSpeed
                * delta;

        }


        if (input.rotateRight) {

            car.angularVelocity +=
                CONFIG.airRotationSpeed
                * delta;

        }


        car.angularVelocity *=
            Math.pow(
                0.96,
                delta * 60
            );


        car.rotation +=
            car.angularVelocity
            * delta;


        car.wheelRotation +=
            (
                car.vx /
                car.wheelRadius
            )
            * delta;

    }


    /* ==========================
       LOW SPEED STABILITY
       ========================== */

    if (
        car.grounded &&
        Math.abs(car.vx) < 25
    ) {

        const angle =
            terrainAngle(
                car.x
            );


        car.rotation +=
            normalizeAngle(
                angle -
                car.rotation
            )
            * 3
            * delta;

    }


    /* ==========================
       FUEL
       ========================== */

    fuel -=
        CONFIG.fuelConsumption
        * delta;


    fuel =
        Math.max(
            0,
            fuel
        );


    if (fuel <= 0) {

        crash(
            "OUT OF FUEL"
        );

        return;

    }


    /* ==========================
       DISTANCE
       ========================== */

    distance =
        Math.max(
            distance,
            (car.x - 200) / 10
        );


    /* ==========================
       SCORE
       ========================== */

    score =
        Math.floor(
            distance * 2
            +
            coins * 100
        );


    /* ==========================
       CRASH ROTATION
       ========================== */

    const normalizedRotation =
        Math.abs(
            normalizeAngle(
                car.rotation
            )
        );


    if (
        !car.grounded &&
        normalizedRotation >
            2.35
    ) {

        crash(
            "CAR FLIPPED"
        );

        return;

    }


    /* ==========================
       WORLD FALL
       ========================== */

    if (
        car.y > 850
    ) {

        crash(
            "FELL OFF TRACK"
        );

        return;

    }


    /* ==========================
       DISTANCE STAGE
       ========================== */

    checkCheckpoint();

    ensureWorldGenerated();


    /* ==========================
       DUST WHILE DRIVING
       ========================== */

    if (
        car.grounded &&
        Math.abs(car.vx) > 120
    ) {

        if (
            Math.random()
            <
            delta * 12
        ) {

            spawnDust();

        }

    }


    /* ==========================
       NITRO SHAKE
       ========================== */

    if (
        car.nitroActive
    ) {

        screenShake =
            Math.max(
                screenShake,
                1.8
            );

    }


    /* ==========================
       MOVEMENT SAFETY
       ========================== */

    if (
        car.x < 100
    ) {

        car.x = 100;

        car.vx = 0;

    }


    if (
        car.x === previousX
    ) {

        car.vx *= 0.98;

    }

}


/* =========================================================
   14. ANGLE NORMALIZATION
   ========================================================= */

function normalizeAngle(angle) {

    while (
        angle > Math.PI
    ) {

        angle -=
            Math.PI * 2;

    }


    while (
        angle < -Math.PI
    ) {

        angle +=
            Math.PI * 2;

    }


    return angle;

}


/* =========================================================
   15. NITRO PARTICLES
   ========================================================= */

function spawnNitroTrail() {

    if (
        Math.random() > 0.75
    ) {

        return;

    }


    spawnParticle({

        x:
            car.x - 50,

        y:
            car.y + 12,

        vx:
            -80 -
            Math.random() * 130,

        vy:
            (Math.random() - 0.5)
            * 60,

        life:
            0.25 +
            Math.random() * 0.2,

        size:
            3 +
            Math.random() * 5,

        type:
            "nitro"

    });

}


/* =========================================================
   16. DUST
   ========================================================= */

function spawnDust() {

    spawnParticle({

        x:
            car.x - 35,

        y:
            terrainHeight(car.x) - 3,

        vx:
            -30 -
            Math.random() * 50,

        vy:
            -20 -
            Math.random() * 35,

        life:
            0.35 +
            Math.random() * 0.3,

        size:
            3 +
            Math.random() * 5,

        gravity:
            -20,

        type:
            "dust"

    });

}


/* =========================================================
   17. LANDING DUST
   ========================================================= */

function spawnLandingDust() {

    burstParticles(
        car.x,
        terrainHeight(car.x) - 3,
        12,
        "dust"
    );

}


/* =========================================================
   18. COIN COLLECTION
   ========================================================= */

function checkCoins() {

    const visibleRange = 160;


    for (const coin of coinsList) {

        if (coin.collected) {
            continue;
        }


        if (
            Math.abs(
                coin.x - car.x
            )
            >
            visibleRange
        ) {

            continue;

        }


        const bob =
            Math.sin(
                worldTime * 4
                +
                coin.phase
            ) * 7;


        const coinY =
            coin.y + bob;


        const dx =
            car.x - coin.x;

        const dy =
            car.y - coinY;


        const hitDistance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            hitDistance < 65
        ) {

            coin.collected = true;

            coins++;

            score += 100;


            burstParticles(
                coin.x,
                coinY,
                10,
                "coin"
            );


            AudioSystem.coin();

        }

    }

}


/* =========================================================
   19. FUEL COLLECTION
   ========================================================= */

function checkFuel() {

    for (const pickup of fuelList) {

        if (pickup.collected) {
            continue;
        }


        if (
            Math.abs(
                pickup.x - car.x
            )
            >
            180
        ) {

            continue;

        }


        const bob =
            Math.sin(
                worldTime * 3
                +
                pickup.phase
            ) * 6;


        const dx =
            car.x -
            pickup.x;


        const dy =
            car.y -
            (
                pickup.y +
                bob
            );


        const hitDistance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            hitDistance < 70
        ) {

            pickup.collected =
                true;


            fuel += 35;


            fuel =
                Math.min(
                    100,
                    fuel
                );


            burstParticles(
                pickup.x,
                pickup.y + bob,
                14,
                "fuel"
            );


            AudioSystem.fuel();

        }

    }

}


/* =========================================================
   20. CHECKPOINT SYSTEM
   ========================================================= */

function checkCheckpoint() {

    const currentDistance =
        Math.floor(
            distance
        );


    if (
        currentDistance >=
        nextCheckpoint
    ) {

        lastCheckpoint =
            nextCheckpoint;


        nextCheckpoint +=
            CONFIG.checkpointDistance;


        fuel =
            Math.min(
                100,
                fuel + 8
            );


        nitro =
            Math.min(
                100,
                nitro + 15
            );


        AudioSystem.checkpoint();


        burstParticles(
            car.x,
            terrainHeight(car.x) - 80,
            18,
            "coin"
        );


        showCheckpoint();


        if (
            currentDistance >=
            stage *
            CONFIG.stageDistance
        ) {

            completeStage();

        }

    }

}


/* =========================================================
   21. CHECKPOINT FEEDBACK
   ========================================================= */

let checkpointMessageTimer = 0;


function showCheckpoint() {

    checkpointMessageTimer =
        2;

    screenShake =
        Math.max(
            screenShake,
            2
        );

}


/* =========================================================
   22. STAGE SYSTEM
   ========================================================= */

let stageNotificationTimer = 0;


function completeStage() {

    stage++;

    gameState =
        GAME_STATE.STAGE_COMPLETE;


    stageNotificationTimer =
        2.5;


    UI.stageNumber.textContent =
        "STAGE " +
        (stage - 1);


    UI.stageNotification
        .classList
        .remove("hidden");


    AudioSystem.finish();


    burstParticles(
        car.x,
        terrainHeight(car.x) - 70,
        35,
        "coin"
    );


    screenShake =
        3;


    setTimeout(
        () => {

            if (
                gameState ===
                GAME_STATE.STAGE_COMPLETE
            ) {

                gameState =
                    GAME_STATE.PLAYING;

            }

            UI.stageNotification
                .classList
                .add("hidden");

        },
        2500
    );

}


/* =========================================================
   23. CRASH
   ========================================================= */

function crash(reason) {

    if (
        gameState ===
        GAME_STATE.CRASHED
    ) {

        return;

    }


    gameState =
        GAME_STATE.CRASHED;


    car.nitroActive =
        false;


    input.nitro =
        false;


    screenShake =
        12;


    burstParticles(
        car.x,
        car.y,
        35,
        "spark"
    );


    burstParticles(
        car.x,
        terrainHeight(car.x),
        25,
        "dust"
    );


    AudioSystem.crash();


    if (
        distance >
        bestDistance
    ) {

        bestDistance =
            Math.floor(distance);


        localStorage.setItem(
            "mountainRushBestDistance",
            String(bestDistance)
        );

    }


    UI.finalDistance.textContent =
        Math.floor(distance);


    UI.finalCoins.textContent =
        coins;


    UI.finalScore.textContent =
        Math.floor(score);


    UI.finalStage.textContent =
        stage;


    setTimeout(
        () => {

            UI.crashScreen
                .classList
                .remove("hidden");

        },
        350
    );

}


/* =========================================================
   24. CAMERA
   ========================================================= */

function updateCamera(delta) {

    targetCameraX =
        car.x - 330;


    const ground =
        terrainHeight(
            car.x
        );


    targetCameraY =
        ground - 390;


    targetCameraX =
        Math.max(
            0,
            targetCameraX
        );


    cameraX +=
        (
            targetCameraX
            - cameraX
        )
        *
        Math.min(
            1,
            CONFIG.cameraSmoothness
            * delta
        );


    cameraY +=
        (
            targetCameraY
            - cameraY
        )
        *
        Math.min(
            1,
            4 * delta
        );


    if (
        screenShake > 0
    ) {

        screenShake *=
            Math.pow(
                0.02,
                delta
            );

    }

}


/* =========================================================
   25. BACKGROUND SKY
   ========================================================= */

function drawSky() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );


    gradient.addColorStop(
        0,
        "#43a9e0"
    );


    gradient.addColorStop(
        0.55,
        "#8bd7ef"
    );


    gradient.addColorStop(
        1,
        "#dff7ff"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /* Sun */

    ctx.globalAlpha =
        0.9;


    ctx.fillStyle =
        "#fff0a8";


    ctx.beginPath();

    ctx.arc(
        1010,
        90,
        48,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.globalAlpha =
        1;

}


/* =========================================================
   26. PARALLAX MOUNTAINS
   ========================================================= */

function drawParallaxMountains(
    depth,
    baseY,
    amplitude,
    frequency,
    alpha
) {

    ctx.save();


    ctx.globalAlpha =
        alpha;


    ctx.fillStyle =
        depth === 0
            ? "#6d9ea8"
            : "#4f8291";


    ctx.beginPath();


    ctx.moveTo(
        0,
        canvas.height
    );


    const offset =
        cameraX * depth;


    for (
        let x = -50;
        x <= canvas.width + 50;
        x += 15
    ) {

        const worldX =
            x + offset;


        const y =
            baseY
            +
            Math.sin(
                worldX * frequency
            )
            * amplitude
            +
            Math.sin(
                worldX * frequency * 0.43
            )
            * amplitude
            * 0.4;


        ctx.lineTo(
            x,
            y - cameraY * depth * 0.15
        );

    }


    ctx.lineTo(
        canvas.width,
        canvas.height
    );


    ctx.lineTo(
        0,
        canvas.height
    );


    ctx.closePath();

    ctx.fill();


    ctx.restore();

}


/* =========================================================
   27. PARALLAX CLOUDS
   ========================================================= */

function drawCloud(
    x,
    y,
    scale
) {

    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.scale(
        scale,
        scale
    );


    ctx.fillStyle =
        "rgba(255,255,255,0.72)";


    ctx.beginPath();

    ctx.arc(
        0,
        10,
        24,
        0,
        Math.PI * 2
    );

    ctx.arc(
        32,
        0,
        34,
        0,
        Math.PI * 2
    );

    ctx.arc(
        68,
        12,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


function drawCloudLayer() {

    const clouds = [

        {
            x: 150,
            y: 105,
            s: 1
        },

        {
            x: 520,
            y: 165,
            s: 0.75
        },

        {
            x: 900,
            y: 80,
            s: 1.2
        },

        {
            x: 1300,
            y: 140,
            s: 0.8
        }

    ];


    for (const cloud of clouds) {

        const parallax =
            0.12;


        let x =
            cloud.x
            -
            cameraX
            * parallax;


        const repeat =
            canvas.width + 350;


        x =
            (
                x % repeat
                + repeat
            )
            % repeat
            - 100;


        drawCloud(
            x,
            cloud.y,
            cloud.s
        );

    }

}


/* =========================================================
   28. TERRAIN
   ========================================================= */

function drawTerrain() {

    ctx.save();


    ctx.translate(
        -cameraX,
        -cameraY
    );


    const startX =
        Math.floor(
            cameraX /
            CONFIG.terrainSample
        )
        *
        CONFIG.terrainSample;


    const endX =
        cameraX
        +
        canvas.width
        +
        CONFIG.terrainSample;


    /* Dirt body */

    ctx.beginPath();


    ctx.moveTo(
        startX,
        canvas.height + cameraY
    );


    for (
        let x = startX;
        x <= endX;
        x += CONFIG.terrainSample
    ) {

        ctx.lineTo(
            x,
            terrainHeight(x)
        );

    }


    ctx.lineTo(
        endX,
        canvas.height + cameraY
    );


    ctx.closePath();


    ctx.fillStyle =
        "#9a6335";

    ctx.fill();


    /* Dirt highlight */

    ctx.globalAlpha =
        0.2;


    ctx.fillStyle =
        "#e2a65d";


    ctx.beginPath();


    ctx.moveTo(
        startX,
        canvas.height + cameraY
    );


    for (
        let x = startX;
        x <= endX;
        x += 20
    ) {

        ctx.lineTo(
            x,
            terrainHeight(x) + 35
        );

    }


    ctx.lineTo(
        endX,
        canvas.height + cameraY
    );


    ctx.closePath();

    ctx.fill();


    ctx.globalAlpha =
        1;


    /* Grass top */

    ctx.beginPath();


    for (
        let x = startX;
        x <= endX;
        x += CONFIG.terrainSample
    ) {

        const y =
            terrainHeight(x);


        if (
            x === startX
        ) {

            ctx.moveTo(
                x,
                y
            );

        }

        else {

            ctx.lineTo(
                x,
                y
            );

        }

    }


    ctx.strokeStyle =
        "#3f963f";

    ctx.lineWidth =
        12;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";

    ctx.stroke();


    /* Grass highlight */

    ctx.strokeStyle =
        "#7acb4c";

    ctx.lineWidth =
        3;

    ctx.stroke();


    ctx.restore();

}


/* =========================================================
   29. TREES
   ========================================================= */

function drawTree(
    object
) {

    const x =
        object.x -
        cameraX;

    const y =
        object.y -
        cameraY;


    if (
        x < -100 ||
        x > canvas.width + 100
    ) {

        return;

    }


    const s =
        object.scale;


    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.scale(
        s,
        s
    );


    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.18)";


    ctx.beginPath();

    ctx.ellipse(
        0,
        2,
        34,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Trunk */

    ctx.fillStyle =
        "#76502f";


    ctx.fillRect(
        -7,
        -75,
        14,
        75
    );


    /* Tree crown */

    ctx.fillStyle =
        "#246c3a";


    ctx.beginPath();

    ctx.arc(
        0,
        -95,
        32,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#318b46";


    ctx.beginPath();

    ctx.arc(
        -18,
        -80,
        27,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#43a854";


    ctx.beginPath();

    ctx.arc(
        18,
        -82,
        27,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


/* =========================================================
   30. ROCKS
   ========================================================= */

function drawRock(
    object
) {

    const x =
        object.x -
        cameraX;

    const y =
        object.y -
        cameraY;


    if (
        x < -100 ||
        x > canvas.width + 100
    ) {

        return;

    }


    const s =
        object.scale;


    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.scale(
        s,
        s
    );


    ctx.fillStyle =
        "#6e7277";


    ctx.beginPath();

    ctx.moveTo(
        -28,
        0
    );

    ctx.lineTo(
        -18,
        -22
    );

    ctx.lineTo(
        5,
        -31
    );

    ctx.lineTo(
        28,
        -10
    );

    ctx.lineTo(
        20,
        0
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "#858a8f";


    ctx.beginPath();

    ctx.moveTo(
        -17,
        -21
    );

    ctx.lineTo(
        5,
        -30
    );

    ctx.lineTo(
        12,
        -13
    );

    ctx.closePath();

    ctx.fill();


    ctx.restore();

}


/* =========================================================
   31. SCENERY
   ========================================================= */

function drawScenery() {

    for (const object of sceneryList) {

        if (
            Math.abs(
                object.x - car.x
            )
            >
            canvas.width * 0.8
        ) {

            continue;

        }


        if (
            object.type === "tree"
        ) {

            drawTree(
                object
            );

        }

        else {

            drawRock(
                object
            );

        }

    }

}


/* =========================================================
   32. COINS
   ========================================================= */

function drawCoins() {

    for (const coin of coinsList) {

        if (
            coin.collected
        ) {

            continue;

        }


        if (
            Math.abs(
                coin.x - car.x
            )
            >
            canvas.width * 0.8
        ) {

            continue;

        }


        const bob =
            Math.sin(
                worldTime * 4
                +
                coin.phase
            ) * 7;


        const x =
            coin.x -
            cameraX;

        const y =
            coin.y +
            bob -
            cameraY;


        const spin =
            Math.abs(
                Math.cos(
                    worldTime * 5
                    +
                    coin.phase
                )
            );


        ctx.save();

        ctx.translate(
            x,
            y
        );

        ctx.scale(
            0.45 + spin * 0.55,
            1
        );


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            coin.radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#ffd447";

        ctx.fill();


        ctx.strokeStyle =
            "#b77b10";

        ctx.lineWidth =
            3;

        ctx.stroke();


        ctx.fillStyle =
            "#a56c0a";

        ctx.font =
            "bold 14px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            "$",
            0,
            1
        );


        ctx.restore();

    }

}


/* =========================================================
   33. FUEL PICKUPS
   ========================================================= */

function drawFuelPickups() {

    for (const pickup of fuelList) {

        if (
            pickup.collected
        ) {

            continue;

        }


        if (
            Math.abs(
                pickup.x - car.x
            )
            >
            canvas.width * 0.8
        ) {

            continue;

        }


        const bob =
            Math.sin(
                worldTime * 3
                +
                pickup.phase
            ) * 6;


        const x =
            pickup.x -
            cameraX;

        const y =
            pickup.y +
            bob -
            cameraY;


        const glow =
            0.5 +
            Math.sin(
                worldTime * 5
            ) * 0.2;


        ctx.save();


        ctx.globalAlpha =
            glow;


        ctx.fillStyle =
            "#5dff88";


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            30,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.globalAlpha =
            1;


        ctx.fillStyle =
            "#e53935";


        ctx.fillRect(
            x - 13,
            y - 19,
            26,
            38
        );


        ctx.fillStyle =
            "#ffffff";


        ctx.font =
            "bold 17px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            "F",
            x,
            y
        );


        ctx.fillStyle =
            "#444";


        ctx.fillRect(
            x - 7,
            y - 27,
            14,
            8
        );


        ctx.restore();

    }

}


/* =========================================================
   34. CHECKPOINT FLAGS
   ========================================================= */

function drawCheckpoints() {

    for (const checkpoint of checkpoints) {

        if (
            Math.abs(
                checkpoint.x - car.x
            )
            >
            canvas.width
        ) {

            continue;

        }


        const x =
            checkpoint.x -
            cameraX;

        const y =
            terrainHeight(
                checkpoint.x
            )
            -
            cameraY;


        ctx.save();


        ctx.strokeStyle =
            "#4b3525";

        ctx.lineWidth =
            5;


        ctx.beginPath();

        ctx.moveTo(
            x,
            y
        );

        ctx.lineTo(
            x,
            y - 95
        );

        ctx.stroke();


        ctx.fillStyle =
            checkpoint.triggered
                ? "#54d66a"
                : "#ffcb45";


        ctx.beginPath();

        ctx.moveTo(
            x,
            y - 95
        );

        ctx.lineTo(
            x + 42,
            y - 80
        );

        ctx.lineTo(
            x,
            y - 65
        );

        ctx.closePath();

        ctx.fill();


        ctx.restore();

    }

}


/* =========================================================
   35. CAR DRAWING
   ========================================================= */

function drawCar() {

    const x =
        car.x -
        cameraX;

    const y =
        car.y -
        cameraY;


    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.rotate(
        car.rotation
    );


    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.2)";


    ctx.beginPath();

    ctx.ellipse(
        0,
        34,
        58,
        10,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Nitro trail */

    if (
        car.nitroActive
    ) {

        ctx.globalAlpha =
            0.65;


        ctx.fillStyle =
            "#56d8ff";


        ctx.beginPath();

        ctx.moveTo(
            -50,
            2
        );

        ctx.lineTo(
            -90,
            -8
        );

        ctx.lineTo(
            -65,
            7
        );

        ctx.lineTo(
            -95,
            18
        );

        ctx.lineTo(
            -45,
            18
        );

        ctx.closePath();

        ctx.fill();


        ctx.globalAlpha =
            1;

    }


    /* Main body */

    ctx.fillStyle =
        "#e84a3c";


    ctx.beginPath();

    ctx.roundRect(
        -52,
        -19,
        104,
        39,
        9
    );

    ctx.fill();


    /* Body highlight */

    ctx.fillStyle =
        "#ff6656";


    ctx.beginPath();

    ctx.roundRect(
        -45,
        -15,
        75,
        10,
        5
    );

    ctx.fill();


    /* Cabin */

    ctx.fillStyle =
        "#d83c34";


    ctx.beginPath();

    ctx.moveTo(
        -31,
        -18
    );

    ctx.lineTo(
        -13,
        -48
    );

    ctx.lineTo(
        23,
        -48
    );

    ctx.lineTo(
        40,
        -18
    );

    ctx.closePath();

    ctx.fill();


    /* Windows */

    ctx.fillStyle =
        "#aee5f4";


    ctx.beginPath();

    ctx.moveTo(
        -9,
        -41
    );

    ctx.lineTo(
        3,
        -41
    );

    ctx.lineTo(
        3,
        -24
    );

    ctx.lineTo(
        -22,
        -24
    );

    ctx.closePath();

    ctx.fill();


    ctx.beginPath();

    ctx.moveTo(
        10,
        -41
    );

    ctx.lineTo(
        21,
        -41
    );

    ctx.lineTo(
        31,
        -24
    );

    ctx.lineTo(
        10,
        -24
    );

    ctx.closePath();

    ctx.fill();


    /* Bumper */

    ctx.fillStyle =
        "#34383d";


    ctx.fillRect(
        43,
        8,
        15,
        7
    );


    /* Headlight */

    ctx.fillStyle =
        "#fff1a8";


    ctx.beginPath();

    ctx.arc(
        48,
        -3,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Wheels */

    drawWheel(
        -34,
        22
    );


    drawWheel(
        34,
        22
    );


    ctx.restore();

}


/* =========================================================
   36. WHEEL
   ========================================================= */

function drawWheel(
    x,
    y
) {

    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.rotate(
        car.wheelRotation
    );


    /* Tire */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        car.wheelRadius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#202326";

    ctx.fill();


    /* Tire edge */

    ctx.strokeStyle =
        "#080909";

    ctx.lineWidth =
        3;

    ctx.stroke();


    /* Rim */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        8,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#b9c1c7";

    ctx.fill();


    /* Spokes */

    ctx.strokeStyle =
        "#727b82";

    ctx.lineWidth =
        2;


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const angle =
            i *
            Math.PI /
            2;


        ctx.beginPath();

        ctx.moveTo(
            0,
            0
        );

        ctx.lineTo(
            Math.cos(angle) * 7,
            Math.sin(angle) * 7
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
   37. DISTANCE MARKERS
   ========================================================= */

function drawDistanceMarkers() {

    const first =
        Math.floor(
            cameraX / 500
        ) * 500;


    ctx.save();

    ctx.translate(
        -cameraX,
        -cameraY
    );


    for (
        let x = first;
        x < cameraX + canvas.width;
        x += 500
    ) {

        if (x < 200) {
            continue;
        }


        const y =
            terrainHeight(x);


        ctx.fillStyle =
            "rgba(255,255,255,0.8)";


        ctx.font =
            "bold 13px Arial";


        ctx.textAlign =
            "center";


        ctx.fillText(
            Math.floor(
                (x - 200) / 10
            )
            +
            "m",
            x,
            y - 12
        );

    }


    ctx.restore();

}


/* =========================================================
   38. SPEED EFFECT
   ========================================================= */

function drawSpeedLines() {

    if (
        Math.abs(car.vx) < 450 &&
        !car.nitroActive
    ) {

        return;

    }


    const intensity =
        Math.min(
            1,
            Math.abs(car.vx) / 1000
        );


    ctx.save();

    ctx.globalAlpha =
        0.15 +
        intensity * 0.25;


    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth =
        2;


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const y =
            100 +
            (
                i * 43
            );


        const length =
            20 +
            intensity * 60;


        const offset =
            (
                worldTime * 400
                +
                i * 120
            )
            %
            120;


        ctx.beginPath();

        ctx.moveTo(
            canvas.width - offset,
            y
        );

        ctx.lineTo(
            canvas.width -
                offset -
                length,
            y
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
   39. FULL DRAW
   ========================================================= */

function draw() {

    ctx.save();


    let shakeX = 0;

    let shakeY = 0;


    if (
        screenShake > 0.1
    ) {

        shakeX =
            (
                Math.random() - 0.5
            )
            *
            screenShake;


        shakeY =
            (
                Math.random() - 0.5
            )
            *
            screenShake;

    }


    ctx.translate(
        shakeX,
        shakeY
    );


    drawSky();

    drawCloudLayer();

    drawParallaxMountains(
        0.15,
        390,
        75,
        0.004,
        0.5
    );

    drawParallaxMountains(
        0.3,
        440,
        65,
        0.005,
        0.7
    );

    drawDistanceMarkers();

    drawTerrain();

    drawScenery();

    drawCheckpoints();

    drawCoins();

    drawFuelPickups();

    drawParticles();

    drawCar();

    drawSpeedLines();


    ctx.restore();

}


/* =========================================================
   40. UI
   ========================================================= */

function updateUI() {

    UI.distance.textContent =
        Math.floor(distance);


    UI.score.textContent =
        Math.floor(score);


    UI.coins.textContent =
        coins;


    UI.fuelBar.style.width =
        `${fuel}%`;


    UI.nitroBar.style.width =
        `${nitro}%`;


    UI.nitroText.textContent =
        car.nitroActive
            ? "BOOST!"
            : nitro >= 99
                ? "READY"
                : "CHARGING";


    UI.checkpointText.textContent =
        `${nextCheckpoint} m`;


    UI.stageText.textContent =
        stage;


    UI.bestText.textContent =
        `${Math.floor(bestDistance)} m`;


    if (
        fuel < 25
    ) {

        UI.fuelBar.style.opacity =
            "0.75";

    }

    else {

        UI.fuelBar.style.opacity =
            "1";

    }

}


/* =========================================================
   41. RESET
   ========================================================= */

function resetGame() {

    distance = 0;

    score = 0;

    coins = 0;

    fuel = 100;

    nitro = 100;

    stage = 1;

    nextCheckpoint =
        CONFIG.checkpointDistance;

    lastCheckpoint = 0;

    cameraX = 0;

    cameraY = 0;

    targetCameraX = 0;

    targetCameraY = 0;

    screenShake = 0;

    worldTime = 0;

    generatedUntil = 0;


    car.x = 220;

    car.y =
        terrainHeight(
            car.x
        ) - 38;

    car.vx = 0;

    car.vy = 0;

    car.rotation = 0;

    car.angularVelocity = 0;

    car.wheelRotation = 0;

    car.grounded = false;

    car.nitroActive = false;


    coinsList.length = 0;

    fuelList.length = 0;

    sceneryList.length = 0;

    checkpoints.length = 0;

    particles.length = 0;


    ensureWorldGenerated();

    updateUI();

    draw();

}


/* =========================================================
   42. START
   ========================================================= */

function startGame() {

    AudioSystem.init();


    resetGame();


    gameState =
        GAME_STATE.PLAYING;


    UI.startScreen
        .classList
        .add("hidden");


    UI.crashScreen
        .classList
        .add("hidden");


    UI.pauseScreen
        .classList
        .add("hidden");


    UI.stageNotification
        .classList
        .add("hidden");


    lastTime =
        performance.now();

}


/* =========================================================
   43. PAUSE
   ========================================================= */

function togglePause() {

    if (
        gameState ===
        GAME_STATE.PLAYING
    ) {

        gameState =
            GAME_STATE.PAUSED;


        UI.pauseScreen
            .classList
            .remove("hidden");

    }

    else if (
        gameState ===
        GAME_STATE.PAUSED
    ) {

        gameState =
            GAME_STATE.PLAYING;


        UI.pauseScreen
            .classList
            .add("hidden");


        lastTime =
            performance.now();

    }

}


/* =========================================================
   44. BUTTON EVENTS
   ========================================================= */

UI.startButton.addEventListener(
    "click",
    startGame
);


UI.restartButton.addEventListener(
    "click",
    startGame
);


UI.resumeButton.addEventListener(
    "click",
    togglePause
);


UI.pauseButton.addEventListener(
    "click",
    togglePause
);


/* =========================================================
   45. GAME UPDATE
   ========================================================= */

function update(delta) {

    worldTime +=
        delta;


    if (
        gameState ===
        GAME_STATE.PLAYING
    ) {

        updateCar(delta);

        checkCoins();

        checkFuel();

        updateCamera(delta);

    }


    updateParticles(delta);


    if (
        checkpointMessageTimer > 0
    ) {

        checkpointMessageTimer -=
            delta;

    }


    updateUI();

}


/* =========================================================
   46. MAIN LOOP
   ========================================================= */

function gameLoop(timestamp) {

    let delta =
        (
            timestamp -
            lastTime
        )
        /
        1000;


    lastTime =
        timestamp;


    if (
        delta > 0.05
    ) {

        delta = 0.05;

    }


    update(delta);

    draw();


    animationFrame =
        requestAnimationFrame(
            gameLoop
        );

}


/* =========================================================
   47. INITIALIZATION
   ========================================================= */

resetGame();


lastTime =
    performance.now();


animationFrame =
    requestAnimationFrame(
        gameLoop
    );


/* =========================================================
   48. VISIBILITY SAFETY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden &&
            gameState ===
            GAME_STATE.PLAYING
        ) {

            togglePause();

        }

    }
);


/* =========================================================
   49. PREVENT MOBILE GESTURES
   ========================================================= */

document.addEventListener(
    "gesturestart",
    event => {
        event.preventDefault();
    },
    {
        passive: false
    }
);


document.addEventListener(
    "touchmove",
    event => {

        if (
            event.target.closest(
                "#gameCanvas"
            )
        ) {

            event.preventDefault();

        }

    },
    {
        passive: false
    }
);
