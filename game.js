/* ============================================================
   MOUNTAIN RUSH
   ENDLESS HILL RACING
   VERSION 3
   ============================================================ */

"use strict";


/* ============================================================
   CANVAS
   ============================================================ */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d", {
        alpha: false
    });


/* ============================================================
   UI ELEMENTS
   ============================================================ */

const UI = {

    distance:
        document.getElementById("distance"),

    score:
        document.getElementById("score"),

    coins:
        document.getElementById("coins"),

    fuelBar:
        document.getElementById("fuelBar"),

    fuelText:
        document.getElementById("fuelText"),

    nitroBar:
        document.getElementById("nitroBar"),

    nitroText:
        document.getElementById("nitroText"),

    rpmValue:
        document.getElementById("rpmValue"),

    rpmNeedle:
        document.getElementById("rpmNeedle"),

    speedValue:
        document.getElementById("speedValue"),

    checkpointText:
        document.getElementById("checkpointText"),

    stageText:
        document.getElementById("stageText"),

    bestText:
        document.getElementById("bestText"),

    stageNotification:
        document.getElementById("stageNotification"),

    stageNumber:
        document.getElementById("stageNumber"),

    startScreen:
        document.getElementById("startScreen"),

    pauseScreen:
        document.getElementById("pauseScreen"),

    crashScreen:
        document.getElementById("crashScreen"),

    finalDistance:
        document.getElementById("finalDistance"),

    finalCoins:
        document.getElementById("finalCoins"),

    finalScore:
        document.getElementById("finalScore"),

    finalStage:
        document.getElementById("finalStage"),

    endTitle:
        document.getElementById("endTitle"),

    crashMessage:
        document.getElementById("crashMessage"),

    endIcon:
        document.getElementById("endIcon")

};


/* ============================================================
   GAME CONFIGURATION
   ============================================================ */

const CONFIG = {

    DESIGN_WIDTH:
        1280,

    DESIGN_HEIGHT:
        720,

    PIXELS_PER_METER:
        5,

    GRAVITY:
        0.48,

    ENGINE_POWER:
        0.105,

    BRAKE_POWER:
        0.16,

    MAX_FORWARD_SPEED:
        13,

    MAX_REVERSE_SPEED:
        5,

    NITRO_MAX_SPEED:
        18,

    NITRO_ACCELERATION:
        0.19,

    NITRO_DRAIN:
        0.50,

    NITRO_RECHARGE:
        0.012,

    FUEL_DRAIN:
        0.0035,

    FUEL_PICKUP:
        35,

    AIR_ROTATION:
        0.0058,

    GROUND_ROTATION:
        0.0024,

    MAX_ANGULAR_SPEED:
        0.09,

    SUSPENSION_STRENGTH:
        0.34,

    SUSPENSION_DAMPING:
        0.72,

    TERRAIN_STEP:
        24,

    WORLD_KEEP_AHEAD:
        5000,

    PARTICLE_LIMIT:
        280,

    CHECKPOINT_DISTANCE:
        1000

};


/* ============================================================
   CANVAS SIZE
   ============================================================ */

let WIDTH =
    CONFIG.DESIGN_WIDTH;

let HEIGHT =
    CONFIG.DESIGN_HEIGHT;

let DPR =
    1;


function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    WIDTH =
        Math.max(
            320,
            rect.width
        );

    HEIGHT =
        Math.max(
            430,
            rect.height
        );

    DPR =
        Math.min(
            2,
            window.devicePixelRatio || 1
        );

    canvas.width =
        Math.floor(
            WIDTH * DPR
        );

    canvas.height =
        Math.floor(
            HEIGHT * DPR
        );

    ctx.setTransform(
        DPR,
        0,
        0,
        DPR,
        0,
        0
    );

}


window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* ============================================================
   GAME STATE
   ============================================================ */

const STATES = {

    MENU:
        "MENU",

    PLAYING:
        "PLAYING",

    PAUSED:
        "PAUSED",

    CRASHED:
        "CRASHED",

    FINISHED:
        "FINISHED"

};


let gameState =
    STATES.MENU;


/* ============================================================
   INPUT
   ============================================================ */

const input = {

    gas:
        false,

    brake:
        false,

    rotateLeft:
        false,

    rotateRight:
        false,

    nitro:
        false

};


/* ============================================================
   WORLD
   ============================================================ */

const world = {

    seed:
        Math.random() * 99999,

    objects:
        [],

    particles:
        [],

    nextObjectX:
        100,

    lastGeneratedX:
        -1000

};


/* ============================================================
   CAMERA
   ============================================================ */

let cameraX =
    0;

let cameraY =
    0;

let cameraShake =
    0;


/* ============================================================
   TIME
   ============================================================ */

let gameTime =
    0;

let previousTime =
    performance.now();


/* ============================================================
   PLAYER
   ============================================================ */

const car = {

    x:
        180,

    y:
        300,

    vx:
        0,

    vy:
        0,

    angle:
        0,

    angularVelocity:
        0,

    width:
        86,

    height:
        40,

    wheelRadius:
        14,

    wheelSpin:
        0,

    fuel:
        100,

    nitro:
        100,

    coins:
        0,

    score:
        0,

    distance:
        0,

    stage:
        1,

    nextCheckpoint:
        CONFIG.CHECKPOINT,

    grounded:
        false,

    previousGrounded:
        false,

    suspensionVelocity:
        0,

    combo:
        0,

    comboTimer:
        0,

    crashReason:
        ""

};


/* ============================================================
   BEST SCORE
   ============================================================ */

let bestDistance =
    Number(
        localStorage.getItem(
            "mountainRushBestDistance"
        ) || 0
    );


/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


function lerp(
    a,
    b,
    t
) {

    return a +
        (b - a) * t;

}


function smoothstep(
    t
) {

    return (
        t * t *
        (3 - 2 * t)
    );

}


function randomRange(
    min,
    max
) {

    return min +
        Math.random() *
        (max - min);

}


function distance(
    x1,
    y1,
    x2,
    y2
) {

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


function normalizeAngle(
    angle
) {

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


/* ============================================================
   SEEDED TERRAIN NOISE
   ============================================================ */

function hash(
    value
) {

    const x =
        Math.sin(
            value * 12.9898 +
            world.seed * 78.233
        ) *
        43758.5453;

    return x -
        Math.floor(x);

}


function noise(
    x
) {

    const i =
        Math.floor(x);

    const f =
        x - i;

    const a =
        hash(i);

    const b =
        hash(i + 1);

    const t =
        smoothstep(f);

    return lerp(
        a,
        b,
        t
    );

}


/* ============================================================
   PROCEDURAL TERRAIN
   ============================================================ */

function terrainHeight(
    x
) {

    const difficulty =
        1 +
        Math.min(
            1.6,
            Math.max(
                0,
                car.distance / 15000
            )
        );

    const base =
        HEIGHT * 0.72;

    const longWave =
        Math.sin(
            x * 0.00115
        ) *
        30;

    const hill =
        Math.sin(
            x * 0.0030
        ) *
        35 *
        difficulty;

    const smallHill =
        Math.sin(
            x * 0.007
        ) *
        14 *
        difficulty;

    const randomWave =
        (
            noise(
                x * 0.0045
            ) -
            0.5
        ) *
        35 *
        difficulty;

    return (
        base +
        longWave +
        hill +
        smallHill +
        randomWave
    );

}


function terrainSlope(
    x
) {

    const left =
        terrainHeight(
            x - 5
        );

    const right =
        terrainHeight(
            x + 5
        );

    return (
        right - left
    ) / 10;

}


/* ============================================================
   TERRAIN OBJECT GENERATION
   ============================================================ */

function generateWorld(
    untilX
) {

    while (
        world.lastGeneratedX <
        untilX
    ) {

        world.lastGeneratedX +=
            CONFIG.TERRAIN_STEP;

        const x =
            world.lastGeneratedX;

        const y =
            terrainHeight(x);

        const random =
            hash(
                Math.floor(
                    x / 10
                )
            );


        /* -----------------------------------------------
           TREES
        ------------------------------------------------ */

        if (
            x > 300 &&
            random > 0.58
        ) {

            world.objects.push({

                type:
                    "tree",

                x:
                    x + randomRange(
                        -8,
                        8
                    ),

                y:
                    y,

                size:
                    randomRange(
                        .8,
                        1.25
                    )

            });

        }


        /* -----------------------------------------------
           ROCKS
        ------------------------------------------------ */

        if (
            random > 0.38 &&
            random < 0.48
        ) {

            world.objects.push({

                type:
                    "rock",

                x:
                    x,

                y:
                    y,

                size:
                    randomRange(
                        .7,
                        1.35
                    )

            });

        }


        /* -----------------------------------------------
           COINS
        ------------------------------------------------ */

        if (
            x > 350 &&
            Math.floor(
                x / 170
            ) % 2 === 0 &&
            random > 0.20
        ) {

            world.objects.push({

                type:
                    "coin",

                x:
                    x,

                y:
                    y - randomRange(
                        48,
                        80
                    ),

                phase:
                    randomRange(
                        0,
                        Math.PI * 2
                    ),

                collected:
                    false

            });

        }


        /* -----------------------------------------------
           FUEL
        ------------------------------------------------ */

        if (
            x > 800 &&
            Math.floor(
                x / 900
            ) % 2 === 1 &&
            random > 0.50
        ) {

            world.objects.push({

                type:
                    "fuel",

                x:
                    x,

                y:
                    y - 70,

                phase:
                    randomRange(
                        0,
                        Math.PI * 2
                    ),

                collected:
                    false

            });

        }

    }


    /* -----------------------------------------------
       CLEAN OLD OBJECTS
    ------------------------------------------------ */

    const minimumX =
        cameraX - 900;

    world.objects =
        world.objects.filter(
            object =>
                object.x >
                minimumX
        );

}


/* ============================================================
   PARTICLES
   ============================================================ */

function createParticle(
    x,
    y,
    options = {}
) {

    if (
        world.particles.length >=
        CONFIG.PARTICLE_LIMIT
    ) {

        return;

    }

    const life =
        options.life ??
        randomRange(
            .3,
            .8
        );

    world.particles.push({

        x:
            x,

        y:
            y,

        vx:
            options.vx ??
            randomRange(
                -2,
                2
            ),

        vy:
            options.vy ??
            randomRange(
                -3,
                0
            ),

        gravity:
            options.gravity ??
            .12,

        size:
            options.size ??
            randomRange(
                2,
                5
            ),

        life:
            life,

        maxLife:
            life,

        type:
            options.type ??
            "dust"

    });

}


function particleBurst(
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

        createParticle(
            x,
            y,
            {

                type:
                    type,

                vx:
                    randomRange(
                        -4,
                        4
                    ),

                vy:
                    randomRange(
                        -5,
                        1
                    ),

                size:
                    randomRange(
                        2,
                        6
                    ),

                life:
                    randomRange(
                        .3,
                        .9
                    )

            }
        );

    }

}


function updateParticles(
    dt
) {

    for (
        const particle of
        world.particles
    ) {

        particle.life -=
            dt;

        particle.x +=
            particle.vx;

        particle.y +=
            particle.vy;

        particle.vy +=
            particle.gravity;

        particle.vx *=
            0.985;

    }


    world.particles =
        world.particles.filter(
            particle =>
                particle.life > 0
        );

}


/* ============================================================
   RESET GAME
   ============================================================ */

function resetGame() {

    world.objects = [];

    world.particles = [];

    world.lastGeneratedX =
        -1000;

    cameraX =
        0;

    cameraY =
        0;

    cameraShake =
        0;


    car.x =
        180;

    car.y =
        terrainHeight(
            car.x
        ) -
        65;

    car.vx =
        0;

    car.vy =
        0;

    car.angle =
        0;

    car.angularVelocity =
        0;

    car.wheelSpin =
        0;

    car.fuel =
        100;

    car.nitro =
        100;

    car.coins =
        0;

    car.score =
        0;

    car.distance =
        0;

    car.stage =
        1;

    car.nextCheckpoint =
        CONFIG.CHECKPOINT;

    car.grounded =
        false;

    car.previousGrounded =
        false;

    car.suspensionVelocity =
        0;

    car.combo =
        0;

    car.comboTimer =
        0;

    car.crashReason =
        "";


    generateWorld(
        7000
    );


    updateUI();

}


/* ============================================================
   START GAME
   ============================================================ */

function startGame() {

    resetGame();

    gameState =
        STATES.PLAYING;

    UI.startScreen
        .classList
        .add("hidden");

    UI.pauseScreen
        .classList
        .add("hidden");

    UI.crashScreen
        .classList
        .add("hidden");

    previousTime =
        performance.now();

}


/* ============================================================
   PAUSE
   ============================================================ */

function pauseGame() {

    if (
        gameState ===
        STATES.PLAYING
    ) {

        gameState =
            STATES.PAUSED;

        UI.pauseScreen
            .classList
            .remove("hidden");

        return;

    }


    if (
        gameState ===
        STATES.PAUSED
    ) {

        resumeGame();

    }

}


/* ============================================================
   RESUME
   ============================================================ */

function resumeGame() {

    gameState =
        STATES.PLAYING;

    UI.pauseScreen
        .classList
        .add("hidden");

    previousTime =
        performance.now();

}


/* ============================================================
   CRASH
   ============================================================ */

function crashGame(
    reason
) {

    if (
        gameState !==
        STATES.PLAYING
    ) {

        return;

    }


    gameState =
        STATES.CRASHED;

    car.crashReason =
        reason;


    input.gas =
        false;

    input.brake =
        false;

    input.rotateLeft =
        false;

    input.rotateRight =
        false;

    input.nitro =
        false;


    particleBurst(
        car.x,
        car.y,
        35,
        "crash"
    );


    cameraShake =
        12;


    UI.endIcon.textContent =
        "💥";

    UI.endTitle.textContent =
        "CRASH!";

    UI.crashMessage.textContent =
        reason;


    showFinalResults();


}


/* ============================================================
   FINAL RESULTS
   ============================================================ */

function showFinalResults() {

    const finalDistance =
        Math.floor(
            car.distance
        );


    UI.finalDistance.textContent =
        finalDistance;

    UI.finalCoins.textContent =
        car.coins;

    UI.finalScore.textContent =
        Math.floor(
            car.score
        );

    UI.finalStage.textContent =
        car.stage;


    if (
        finalDistance >
        bestDistance
    ) {

        bestDistance =
            finalDistance;

        localStorage.setItem(
            "mountainRushBestDistance",
            bestDistance
        );

    }


    UI.crashScreen
        .classList
        .remove("hidden");


    updateUI();

}


/* ============================================================
   CHECKPOINT
   ============================================================ */

function checkpointReached() {

    car.stage++;

    car.score +=
        1000 *
        car.stage;

    car.nextCheckpoint +=
        CONFIG.CHECKPOINT;


    showCheckpointMessage();


    particleBurst(
        car.x,
        car.y - 30,
        25,
        "checkpoint"
    );

}


/* ============================================================
   CHECKPOINT MESSAGE
   ============================================================ */

function showCheckpointMessage() {

    UI.stageNumber.textContent =
        "STAGE " +
        car.stage;

    UI.stageNotification
        .classList
        .remove("hidden");


    clearTimeout(
        showCheckpointMessage.timer
    );


    showCheckpointMessage.timer =
        setTimeout(
            () => {

                UI.stageNotification
                    .classList
                    .add("hidden");

            },
            1800
        );

}


/* ============================================================
   UPDATE CAR PHYSICS
   ============================================================ */

function updateCar(
    dt
) {

    const stageDifficulty =
        1 +
        Math.min(
            1.7,
            car.stage * .08
        );


    /* --------------------------------------------------------
       ENGINE
    --------------------------------------------------------- */

    if (
        input.gas &&
        car.fuel > 0
    ) {

        car.vx +=
            CONFIG.ENGINE_POWER *
            dt *
            60;

        car.fuel -=
            CONFIG.FUEL_DRAIN *
            dt *
            60;

    }


    /* --------------------------------------------------------
       BRAKE
    --------------------------------------------------------- */

    if (
        input.brake
    ) {

        if (
            car.vx > 0
        ) {

            car.vx -=
                CONFIG.BRAKE_POWER *
                dt *
                60;

        } else {

            car.vx -=
                .08 *
                dt *
                60;

        }

    }


    /* --------------------------------------------------------
       NATURAL ROLLING RESISTANCE
    --------------------------------------------------------- */

    if (
        !input.gas &&
        !input.brake
    ) {

        car.vx *=
            Math.pow(
                .993,
                dt * 60
            );

    }


    /* --------------------------------------------------------
       NITRO
    --------------------------------------------------------- */

    const nitroActive =
        input.nitro &&
        car.nitro > 0 &&
        car.fuel > 0;


    if (
        nitroActive
    ) {

        car.vx +=
            CONFIG.NITRO_ACCELERATION *
            dt *
            60;

        car.nitro -=
            CONFIG.NITRO_DRAIN *
            dt *
            60;

        car.fuel -=
            .0015 *
            dt *
            60;


        if (
            Math.random() <
            .65
        ) {

            createParticle(
                car.x - 45,
                car.y + 8,
                {

                    type:
                        "nitro",

                    vx:
                        randomRange(
                            -6,
                            -2
                        ),

                    vy:
                        randomRange(
                            -.8,
                            .8
                        ),

                    gravity:
                        0,

                    size:
                        randomRange(
                            2,
                            5
                        ),

                    life:
                        .35

                }
            );

        }

    } else {

        car.nitro =
            clamp(
                car.nitro +
                CONFIG.NITRO_RECHARGE *
                dt *
                60,
                0,
                100
            );

    }


    /* --------------------------------------------------------
       LIMIT SPEED
    --------------------------------------------------------- */

    car.vx =
        clamp(
            car.vx,
            -CONFIG.MAX_REVERSE_SPEED,
            CONFIG.MAX_FORWARD_SPEED +
            (
                nitroActive
                    ? CONFIG.NITRO_MAX_SPEED
                    : 0
            )
        );


    /* --------------------------------------------------------
       GRAVITY
    --------------------------------------------------------- */

    car.vy +=
        CONFIG.GRAVITY *
        dt *
        60;


    /* --------------------------------------------------------
       MOVE
    --------------------------------------------------------- */

    car.x +=
        car.vx *
        dt *
        60;

    car.y +=
        car.vy *
        dt *
        60;


    /* --------------------------------------------------------
       WHEEL ROTATION
    --------------------------------------------------------- */

    car.wheelSpin +=
        car.vx *
        dt *
        60 /
        car.wheelRadius;


    /* --------------------------------------------------------
       GROUND CALCULATION
    --------------------------------------------------------- */

    const leftWheelX =
        car.x - 27;

    const rightWheelX =
        car.x + 27;


    const leftGround =
        terrainHeight(
            leftWheelX
        );

    const rightGround =
        terrainHeight(
            rightWheelX
        );


    const groundAverage =
        (
            leftGround +
            rightGround
        ) / 2;


    const carBottom =
        car.y +
        car.height / 2;


    const targetAngle =
        Math.atan2(
            rightGround -
            leftGround,
            54
        );


    car.previousGrounded =
        car.grounded;


    car.grounded =
        carBottom >=
            groundAverage - 8 &&
        carBottom <=
            groundAverage + 18 &&
        Math.abs(car.vy) < 10;


    /* --------------------------------------------------------
       LANDING DETECTION
    --------------------------------------------------------- */

    if (
        !car.previousGrounded &&
        car.grounded
    ) {

        const landingSpeed =
            Math.abs(
                car.vy
            );


        particleBurst(
            car.x,
            groundAverage,
            12,
            "landing"
        );


        cameraShake =
            Math.min(
                5 +
                landingSpeed,
                9
            );


        if (
            landingSpeed >
            10
        ) {

            crashGame(
                "HARD LANDING"
            );

            return;

        }


        car.vy *=
            -.15;

    }


    /* --------------------------------------------------------
       GROUND SUSPENSION
    --------------------------------------------------------- */

    if (
        car.grounded
    ) {

        const angleDifference =
            normalizeAngle(
                targetAngle -
                car.angle
            );


        car.angularVelocity +=
            angleDifference *
            CONFIG.SUSPENSION_STRENGTH *
            dt *
            60;


        car.angularVelocity *=
            Math.pow(
                .78,
                dt * 60
            );


        if (
            input.rotateLeft
        ) {

            car.angularVelocity -=
                CONFIG.GROUND_ROTATION *
                dt *
                60;

        }


        if (
            input.rotateRight
        ) {

            car.angularVelocity +=
                CONFIG.GROUND_ROTATION *
                dt *
                60;

        }


        const penetration =
            groundAverage -
            carBottom;


        car.y +=
            penetration *
            CONFIG.SUSPENSION_STRENGTH;


        if (
            car.vy > 0
        ) {

            car.vy *=
                .12;

        }

    }


    /* --------------------------------------------------------
       AIR CONTROL
    --------------------------------------------------------- */

    else {

        if (
            input.rotateLeft
        ) {

            car.angularVelocity -=
                CONFIG.AIR_ROTATION *
                dt *
                60;

        }


        if (
            input.rotateRight
        ) {

            car.angularVelocity +=
                CONFIG.AIR_ROTATION *
                dt *
                60;

        }


        car.angularVelocity *=
            Math.pow(
                .996,
                dt * 60
            );

    }


    /* --------------------------------------------------------
       LIMIT ROTATION
    --------------------------------------------------------- */

    car.angularVelocity =
        clamp(
            car.angularVelocity,
            -CONFIG.MAX_ANGULAR_SPEED,
            CONFIG.MAX_ANGULAR_SPEED
        );


    car.angle +=
        car.angularVelocity *
        dt *
        60;


    car.angle =
        normalizeAngle(
            car.angle
        );


    /* --------------------------------------------------------
       CRASH BALANCE
    --------------------------------------------------------- */

    const absoluteAngle =
        Math.abs(
            normalizeAngle(
                car.angle
            )
        );


    if (
        car.grounded &&
        absoluteAngle >
        1.18
    ) {

        crashGame(
            "THE CAR ROLLED OVER"
        );

        return;

    }


    if (
        !car.grounded &&
        absoluteAngle >
        2.20 &&
        Math.abs(car.vy) >
        3
    ) {

        crashGame(
            "THE CAR FLIPPED"
        );

        return;

    }


    /* --------------------------------------------------------
       VERY HARD TERRAIN COLLISION
    --------------------------------------------------------- */

    const wheelLeftY =
        car.y + 16;

    const wheelRightY =
        car.y + 16;


    if (
        wheelLeftY >
        leftGround + 15 ||
        wheelRightY >
        rightGround + 15
    ) {

        crashGame(
            "HARD TERRAIN COLLISION"
        );

        return;

    }


    /* --------------------------------------------------------
       FUEL EMPTY
    --------------------------------------------------------- */

    if (
        car.fuel <= 0
    ) {

        car.fuel =
            0;

        car.vx *=
            Math.pow(
                .97,
                dt * 60
            );


        if (
            Math.abs(car.vx) <
            .12 &&
            car.grounded
        ) {

            crashGame(
                "OUT OF FUEL"
            );

            return;

        }

    }


    /* --------------------------------------------------------
       DISTANCE
    --------------------------------------------------------- */

    car.distance =
        Math.max(
            0,
            (
                car.x -
                180
            ) /
            CONFIG.PIXELS_PER_METER
        );


    /* --------------------------------------------------------
       SCORE
    --------------------------------------------------------- */

    car.score +=
        Math.max(
            0,
            car.vx
        ) *
        dt *
        15;


    /* --------------------------------------------------------
       COMBO TIMER
    --------------------------------------------------------- */

    if (
        car.comboTimer >
        0
    ) {

        car.comboTimer -=
            dt;

    } else {

        car.combo =
            0;

    }


    /* --------------------------------------------------------
       CHECKPOINT
    --------------------------------------------------------- */

    if (
        car.distance >=
        car.nextCheckpoint
    ) {

        checkpointReached();

    }


    /* --------------------------------------------------------
       CAMERA
    --------------------------------------------------------- */

    const targetCameraX =
        car.x -
        WIDTH * .30;


    cameraX +=
        (
            targetCameraX -
            cameraX
        ) *
        .09;


    cameraX =
        Math.max(
            0,
            cameraX
        );


    /* --------------------------------------------------------
       FUEL / PICKUP COLLISION
    --------------------------------------------------------- */

    checkPickups(
        stageDifficulty
    );


    /* --------------------------------------------------------
       DUST
    --------------------------------------------------------- */

    if (
        car.grounded &&
        Math.abs(car.vx) >
        2 &&
        Math.random() <
        .15
    ) {

        createParticle(
            car.x - 28,
            car.y + 19,
            {

                type:
                    "dust",

                vx:
                    randomRange(
                        -2.5,
                        -.5
                    ),

                vy:
                    randomRange(
                        -1.5,
                        -.3
                    ),

                gravity:
                    .03,

                size:
                    randomRange(
                        3,
                        7
                    ),

                life:
                    randomRange(
                        .4,
                        .8
                    )

            }
        );

    }


    if (
        cameraShake >
        0
    ) {

        cameraShake =
            Math.max(
                0,
                cameraShake -
                25 * dt
            );

    }

}


/* ============================================================
   PICKUPS
   ============================================================ */

function checkPickups() {

    for (
        const object of
        world.objects
    ) {

        if (
            object.collected
        ) {

            continue;

        }


        if (
            object.type !==
            "coin" &&
            object.type !==
            "fuel"
        ) {

            continue;

        }


        const bob =
            Math.sin(
                gameTime * 3 +
                object.phase
            ) *
            5;


        const objectY =
            object.y +
            bob;


        const d =
            distance(
                car.x,
                car.y,
                object.x,
                objectY
            );


        if (
            d <
            48
        ) {

            object.collected =
                true;


            if (
                object.type ===
                "coin"
            ) {

                car.coins++;

                car.combo++;

                car.comboTimer =
                    2.2;

                car.score +=
                    100 +
                    car.combo * 25;


                particleBurst(
                    object.x,
                    objectY,
                    14,
                    "coin"
                );

            }


            if (
                object.type ===
                "fuel"
            ) {

                car.fuel =
                    clamp(
                        car.fuel +
                        CONFIG.FUEL_PICKUP,
                        0,
                        100
                    );

                car.score +=
                    250;


                particleBurst(
                    object.x,
                    objectY,
                    18,
                    "fuel"
                );

            }

        }

    }

}


/* ============================================================
   UPDATE PARTICLES
   ============================================================ */

function updateGame(
    dt
) {

    gameTime +=
        dt;


    if (
        gameState ===
        STATES.PLAYING
    ) {

        generateWorld(
            cameraX +
            WIDTH +
            CONFIG.WORLD_KEEP_AHEAD
        );


        updateCar(
            dt
        );

    }


    updateParticles(
        dt
    );


    updateUI();

}


/* ============================================================
   UI UPDATE
   ============================================================ */

function updateUI() {

    UI.distance.textContent =
        Math.floor(
            car.distance
        );


    UI.score.textContent =
        Math.floor(
            car.score
        );


    UI.coins.textContent =
        car.coins;


    UI.fuelBar.style.width =
        clamp(
            car.fuel,
            0,
            100
        ) +
        "%";


    UI.fuelText.textContent =
        Math.floor(
            car.fuel
        ) +
        "%";


    UI.nitroBar.style.width =
        clamp(
            car.nitro,
            0,
            100
        ) +
        "%";


    UI.nitroText.textContent =
        input.nitro &&
        car.nitro > 0
            ? "BOOST"
            : "READY";


    const rpm =
        clamp(
            Math.abs(
                car.vx
            ) /
            CONFIG.MAX_FORWARD_SPEED *
            9000 +
            (
                input.gas
                    ? 800
                    : 0
            ),
            0,
            9500
        );


    UI.rpmValue.textContent =
        Math.floor(
            rpm
        );


    UI.speedValue.textContent =
        Math.floor(
            Math.abs(
                car.vx
            ) *
            8
        );


    const needleAngle =
        -75 +
        (
            rpm /
            9500
        ) *
        150;


    UI.rpmNeedle.style.transform =
        `rotate(${needleAngle}deg)`;


    UI.checkpointText.textContent =
        Math.max(
            0,
            Math.floor(
                car.nextCheckpoint -
                car.distance
            )
        ) +
        " m";


    UI.stageText.textContent =
        car.stage;


    UI.bestText.textContent =
        bestDistance +
        " m";

}


/* ============================================================
   DRAW SKY
   ============================================================ */

function drawSky() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            HEIGHT
        );


    gradient.addColorStop(
        0,
        "#55bde8"
    );

    gradient.addColorStop(
        .55,
        "#b9e7f4"
    );

    gradient.addColorStop(
        1,
        "#e5eedc"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

}


/* ============================================================
   DRAW PARALLAX MOUNTAINS
   ============================================================ */

function drawMountainLayer(
    parallax,
    baseY,
    peakHeight,
    fill
) {

    ctx.save();


    const offset =
        (
            cameraX *
            parallax
        ) %
        420;


    ctx.fillStyle =
        fill;


    ctx.beginPath();

    ctx.moveTo(
        -500,
        HEIGHT
    );


    for (
        let x = -500;
        x <
            WIDTH + 500;
        x += 140
    ) {

        const sx =
            x -
            offset;


        const peak =
            baseY -
            peakHeight -
            hash(
                Math.floor(
                    x / 140
                )
            ) *
            80;


        ctx.lineTo(
            sx,
            baseY
        );

        ctx.lineTo(
            sx + 70,
            peak
        );

        ctx.lineTo(
            sx + 140,
            baseY
        );

    }


    ctx.lineTo(
        WIDTH + 500,
        HEIGHT
    );

    ctx.closePath();

    ctx.fill();

    ctx.restore();

}


/* ============================================================
   DRAW CLOUDS
   ============================================================ */

function drawClouds() {

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        let x =
            (
                i * 250 +
                gameTime * 8 -
                cameraX * .035
            ) %
            (WIDTH + 350);


        if (
            x < 0
        ) {

            x +=
                WIDTH + 350;

        }


        x -= 120;


        const y =
            70 +
            (
                i % 3
            ) *
            65;


        ctx.fillStyle =
            "rgba(255,255,255,.68)";


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            25,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x + 30,
            y - 12,
            32,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x + 65,
            y,
            24,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

}


/* ============================================================
   DRAW TERRAIN
   ============================================================ */

function drawTerrain() {

    ctx.save();


    ctx.translate(
        -cameraX,
        0
    );


    const start =
        cameraX - 500;

    const end =
        cameraX +
        WIDTH +
        600;


    /* --------------------------------------------------------
       SOIL
    --------------------------------------------------------- */

    ctx.beginPath();

    ctx.moveTo(
        start,
        HEIGHT
    );


    for (
        let x = start;
        x <= end;
        x += 12
    ) {

        ctx.lineTo(
            x,
            terrainHeight(x)
        );

    }


    ctx.lineTo(
        end,
        HEIGHT
    );

    ctx.closePath();


    const groundGradient =
        ctx.createLinearGradient(
            0,
            HEIGHT * .55,
            0,
            HEIGHT
        );


    groundGradient.addColorStop(
        0,
        "#65a646"
    );

    groundGradient.addColorStop(
        .12,
        "#4c8b37"
    );

    groundGradient.addColorStop(
        1,
        "#294f2b"
    );


    ctx.fillStyle =
        groundGradient;


    ctx.fill();


    /* --------------------------------------------------------
       ROAD / TRACK EDGE
    --------------------------------------------------------- */

    ctx.beginPath();


    for (
        let x = start;
        x <= end;
        x += 8
    ) {

        const y =
            terrainHeight(x);


        if (
            x === start
        ) {

            ctx.moveTo(
                x,
                y
            );

        } else {

            ctx.lineTo(
                x,
                y
            );

        }

    }


    ctx.lineWidth =
        11;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";

    ctx.strokeStyle =
        "#c49b52";

    ctx.stroke();


    /* --------------------------------------------------------
       LIGHT ROAD LINE
    --------------------------------------------------------- */

    ctx.beginPath();


    for (
        let x = start;
        x <= end;
        x += 8
    ) {

        const y =
            terrainHeight(x) -
            4;


        if (
            x === start
        ) {

            ctx.moveTo(
                x,
                y
            );

        } else {

            ctx.lineTo(
                x,
                y
            );

        }

    }


    ctx.lineWidth =
        3;

    ctx.strokeStyle =
        "#f0d982";

    ctx.stroke();


    /* --------------------------------------------------------
       GRASS DETAILS
    --------------------------------------------------------- */

    ctx.lineWidth =
        2;

    ctx.strokeStyle =
        "rgba(40,100,35,.5)";


    for (
        let x = start;
        x < end;
        x += 45
    ) {

        const y =
            terrainHeight(x);


        ctx.beginPath();

        ctx.moveTo(
            x,
            y - 3
        );

        ctx.lineTo(
            x + 3,
            y - 11
        );

        ctx.moveTo(
            x + 4,
            y - 3
        );

        ctx.lineTo(
            x + 8,
            y - 9
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* ============================================================
   DRAW TREE
   ============================================================ */

function drawTree(
    x,
    y,
    size
) {

    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.scale(
        size,
        size
    );


    /* trunk */

    ctx.fillStyle =
        "#65442c";


    ctx.fillRect(
        -6,
        -54,
        12,
        54
    );


    /* shadow */

    ctx.fillStyle =
        "rgba(0,0,0,.13)";


    ctx.beginPath();

    ctx.ellipse(
        0,
        1,
        32,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* leaves */

    ctx.fillStyle =
        "#2e743b";


    ctx.beginPath();

    ctx.arc(
        0,
        -70,
        27,
        0,
        Math.PI * 2
    );

    ctx.arc(
        -18,
        -52,
        23,
        0,
        Math.PI * 2
    );

    ctx.arc(
        18,
        -52,
        23,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#45924b";


    ctx.beginPath();

    ctx.arc(
        -9,
        -72,
        18,
        0,
        Math.PI * 2
    );

    ctx.arc(
        15,
        -57,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


/* ============================================================
   DRAW ROCK
   ============================================================ */

function drawRock(
    x,
    y,
    size
) {

    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.scale(
        size,
        size
    );


    ctx.fillStyle =
        "#5f6c72";


    ctx.beginPath();

    ctx.moveTo(
        -27,
        0
    );

    ctx.lineTo(
        -21,
        -19
    );

    ctx.lineTo(
        -4,
        -28
    );

    ctx.lineTo(
        17,
        -21
    );

    ctx.lineTo(
        27,
        -6
    );

    ctx.lineTo(
        20,
        0
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "#8d989d";


    ctx.beginPath();

    ctx.moveTo(
        -18,
        -19
    );

    ctx.lineTo(
        -4,
        -26
    );

    ctx.lineTo(
        7,
        -19
    );

    ctx.lineTo(
        2,
        -10
    );

    ctx.closePath();

    ctx.fill();


    ctx.restore();

}


/* ============================================================
   DRAW COIN
   ============================================================ */

function drawCoin(
    x,
    y,
    phase
) {

    const scale =
        .55 +
        Math.abs(
            Math.cos(
                gameTime * 5 +
                phase
            )
        ) *
        .45;


    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.scale(
        scale,
        1
    );


    ctx.shadowBlur =
        12;

    ctx.shadowColor =
        "rgba(255,210,50,.8)";


    ctx.fillStyle =
        "#ffd447";

    ctx.strokeStyle =
        "#9b6715";

    ctx.lineWidth =
        3;


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        17,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.stroke();


    ctx.shadowBlur =
        0;


    ctx.fillStyle =
        "#fff1a3";


    ctx.font =
        "bold 16px Arial";

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


/* ============================================================
   DRAW FUEL
   ============================================================ */

function drawFuel(
    x,
    y
) {

    ctx.save();


    ctx.translate(
        x,
        y
    );


    const bob =
        Math.sin(
            gameTime * 3
        ) *
        4;


    ctx.translate(
        0,
        bob
    );


    ctx.shadowBlur =
        14;

    ctx.shadowColor =
        "rgba(90,255,120,.75)";


    ctx.fillStyle =
        "#4fd46c";

    ctx.strokeStyle =
        "#1e5a30";

    ctx.lineWidth =
        3;


    ctx.fillRect(
        -13,
        -22,
        26,
        38
    );

    ctx.strokeRect(
        -13,
        -22,
        26,
        38
    );


    ctx.shadowBlur =
        0;


    ctx.fillStyle =
        "#eaffef";


    ctx.fillRect(
        -8,
        -15,
        16,
        7
    );


    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        "bold 15px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "F",
        0,
        4
    );


    ctx.restore();

}


/* ============================================================
   DRAW WORLD OBJECTS
   ============================================================ */

function drawObjects() {

    ctx.save();

    ctx.translate(
        -cameraX,
        0
    );


    for (
        const object of
        world.objects
    ) {

        if (
            object.x <
            cameraX - 150 ||
            object.x >
            cameraX +
            WIDTH +
            150
        ) {

            continue;

        }


        if (
            object.collected
        ) {

            continue;

        }


        if (
            object.type ===
            "tree"
        ) {

            drawTree(
                object.x,
                object.y,
                object.size
            );

        }


        if (
            object.type ===
            "rock"
        ) {

            drawRock(
                object.x,
                object.y,
                object.size
            );

        }


        if (
            object.type ===
            "coin"
        ) {

            const bob =
                Math.sin(
                    gameTime * 3 +
                    object.phase
                ) *
                5;


            drawCoin(
                object.x,
                object.y +
                bob,
                object.phase
            );

        }


        if (
            object.type ===
            "fuel"
        ) {

            drawFuel(
                object.x,
                object.y
            );

        }

    }


    ctx.restore();

}


/* ============================================================
   DRAW PARTICLES
   ============================================================ */

function drawParticles() {

    ctx.save();


    ctx.translate(
        -cameraX,
        0
    );


    for (
        const particle of
        world.particles
    ) {

        const alpha =
            clamp(
                particle.life /
                particle.maxLife,
                0,
                1
            );


        ctx.globalAlpha =
            alpha;


        if (
            particle.type ===
            "dust"
        ) {

            ctx.fillStyle =
                "#d4c29a";

        }

        else if (
            particle.type ===
            "landing"
        ) {

            ctx.fillStyle =
                "#d9c9a4";

        }

        else if (
            particle.type ===
            "coin"
        ) {

            ctx.fillStyle =
                "#ffe269";

        }

        else if (
            particle.type ===
            "fuel"
        ) {

            ctx.fillStyle =
                "#75ff8e";

        }

        else if (
            particle.type ===
            "nitro"
        ) {

            ctx.fillStyle =
                "#67d9ff";

        }

        else if (
            particle.type ===
            "crash"
        ) {

            ctx.fillStyle =
                "#ffcf58";

        }

        else {

            ctx.fillStyle =
                "#ffffff";

        }


        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size *
            alpha,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    ctx.globalAlpha =
        1;

    ctx.restore();

}


/* ============================================================
   DRAW CAR
   ============================================================ */

function drawCar() {

    ctx.save();


    ctx.translate(
        car.x -
        cameraX,
        car.y
    );


    ctx.rotate(
        car.angle
    );


    /* --------------------------------------------------------
       SHADOW
    --------------------------------------------------------- */

    ctx.save();


    ctx.translate(
        0,
        25
    );


    ctx.scale(
        1,
        .35
    );


    ctx.fillStyle =
        "rgba(0,0,0,.25)";


    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        48,
        13,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();


    /* --------------------------------------------------------
       CAR BODY
    --------------------------------------------------------- */

    ctx.shadowBlur =
        9;

    ctx.shadowColor =
        "rgba(0,0,0,.35)";


    ctx.fillStyle =
        "#df3d36";


    ctx.beginPath();

    ctx.roundRect(
        -43,
        -18,
        86,
        36,
        9
    );

    ctx.fill();


    ctx.shadowBlur =
        0;


    /* --------------------------------------------------------
       LOWER BODY
    --------------------------------------------------------- */

    ctx.fillStyle =
        "#ad2528";


    ctx.fillRect(
        -36,
        6,
        72,
        9
    );


    /* --------------------------------------------------------
       ROOF / CABIN
    --------------------------------------------------------- */

    ctx.fillStyle =
        "#83d8ed";

    ctx.strokeStyle =
        "#173b4b";

    ctx.lineWidth =
        3;


    ctx.beginPath();

    ctx.moveTo(
        -27,
        -18
    );

    ctx.lineTo(
        -10,
        -36
    );

    ctx.lineTo(
        21,
        -36
    );

    ctx.lineTo(
        34,
        -18
    );

    ctx.closePath();

    ctx.fill();

    ctx.stroke();


    /* --------------------------------------------------------
       WINDOW DIVIDER
    --------------------------------------------------------- */

    ctx.beginPath();

    ctx.moveTo(
        7,
        -34
    );

    ctx.lineTo(
        7,
        -19
    );

    ctx.stroke();


    /* --------------------------------------------------------
       LIGHTS
    --------------------------------------------------------- */

    ctx.fillStyle =
        "#fff1a9";


    ctx.fillRect(
        29,
        -8,
        9,
        7
    );


    ctx.fillStyle =
        "#ff6a55";


    ctx.fillRect(
        -38,
        -8,
        7,
        7
    );


    /* --------------------------------------------------------
       BUMPER
    --------------------------------------------------------- */

    ctx.fillStyle =
        "#333c42";


    ctx.fillRect(
        36,
        9,
        10,
        5
    );


    ctx.fillRect(
        -46,
        9,
        10,
        5
    );


    /* --------------------------------------------------------
       WHEELS
    --------------------------------------------------------- */

    drawWheel(
        -27,
        18
    );

    drawWheel(
        27,
        18
    );


    ctx.restore();

}


/* ============================================================
   DRAW WHEEL
   ============================================================ */

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
        car.wheelSpin
    );


    /* tire */

    ctx.fillStyle =
        "#151a1e";


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        car.wheelRadius + 4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* rim */

    ctx.fillStyle =
        "#4c565e";


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        car.wheelRadius - 4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* spokes */

    ctx.strokeStyle =
        "#c3cbd0";

    ctx.lineWidth =
        2;


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const angle =
            i *
            Math.PI /
            3;


        ctx.beginPath();

        ctx.moveTo(
            Math.cos(angle) * 3,
            Math.sin(angle) * 3
        );

        ctx.lineTo(
            Math.cos(angle) *
            (car.wheelRadius - 5),

            Math.sin(angle) *
            (car.wheelRadius - 5)
        );

        ctx.stroke();

    }


    /* hub */

    ctx.fillStyle =
        "#d9e0e3";


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


/* ============================================================
   RENDER
   ============================================================ */

function render() {

    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    drawSky();


    drawMountainLayer(
        .08,
        HEIGHT * .61,
        120,
        "#91bfc7"
    );


    drawMountainLayer(
        .16,
        HEIGHT * .67,
        95,
        "#6da6af"
    );


    drawClouds();


    if (
        cameraShake >
        0
    ) {

        ctx.save();

        ctx.translate(
            randomRange(
                -cameraShake,
                cameraShake
            ),
            randomRange(
                -cameraShake,
                cameraShake
            )
        );

    }


    drawTerrain();

    drawObjects();

    drawParticles();


    /* --------------------------------------------------------
       NITRO FLAME
    --------------------------------------------------------- */

    if (
        gameState ===
        STATES.PLAYING &&
        input.nitro &&
        car.nitro > 0
    ) {

        ctx.save();


        ctx.translate(
            car.x -
            cameraX -
            45,
            car.y + 8
        );


        ctx.fillStyle =
            "#6de0ff";


        ctx.beginPath();

        ctx.moveTo(
            0,
            -6
        );

        ctx.lineTo(
            -36,
            0
        );

        ctx.lineTo(
            0,
            6
        );

        ctx.closePath();

        ctx.fill();


        ctx.restore();

    }


    drawCar();


    if (
        cameraShake >
        0
    ) {

        ctx.restore();

    }

}


/* ============================================================
   TOUCH CONTROLS
   ============================================================ */

function bindTouchButton(
    element,
    inputName
) {

    const press =
        event => {

            event.preventDefault();

            input[inputName] =
                true;

            element
                .classList
                .add("pressed");

        };


    const release =
        event => {

            event.preventDefault();

            input[inputName] =
                false;

            element
                .classList
                .remove("pressed");

        };


    element.addEventListener(
        "pointerdown",
        press
    );


    element.addEventListener(
        "pointerup",
        release
    );


    element.addEventListener(
        "pointercancel",
        release
    );


    element.addEventListener(
        "pointerleave",
        release
    );

}


bindTouchButton(
    document.getElementById(
        "gasTouch"
    ),
    "gas"
);


bindTouchButton(
    document.getElementById(
        "brakeTouch"
    ),
    "brake"
);


bindTouchButton(
    document.getElementById(
        "nitroTouch"
    ),
    "nitro"
);


/* ============================================================
   KEYBOARD CONTROLS
   ============================================================ */

window.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();


        if (
            [
                "arrowright",
                "arrowleft",
                "arrowup",
                "arrowdown",
                " ",
                "w",
                "a",
                "s",
                "d"
            ].includes(key)
        ) {

            event.preventDefault();

        }


        if (
            key === "d" ||
            key === "arrowright"
        ) {

            input.gas =
                true;

        }


        if (
            key === "a" ||
            key === "arrowleft"
        ) {

            input.brake =
                true;

        }


        if (
            key === "w" ||
            key === "arrowup"
        ) {

            input.rotateLeft =
                true;

        }


        if (
            key === "s" ||
            key === "arrowdown"
        ) {

            input.rotateRight =
                true;

        }


        if (
            key === " "
        ) {

            input.nitro =
                true;

        }


        if (
            key === "p" ||
            key === "escape"
        ) {

            pauseGame();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        const key =
            event.key.toLowerCase();


        if (
            key === "d" ||
            key === "arrowright"
        ) {

            input.gas =
                false;

        }


        if (
            key === "a" ||
            key === "arrowleft"
        ) {

            input.brake =
                false;

        }


        if (
            key === "w" ||
            key === "arrowup"
        ) {

            input.rotateLeft =
                false;

        }


        if (
            key === "s" ||
            key === "arrowdown"
        ) {

            input.rotateRight =
                false;

        }


        if (
            key === " "
        ) {

            input.nitro =
                false;

        }

    }
);


/* ============================================================
   BUTTONS
   ============================================================ */

document
    .getElementById("startButton")
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById("restartButton")
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById("pauseButton")
    .addEventListener(
        "click",
        pauseGame
    );


document
    .getElementById("resumeButton")
    .addEventListener(
        "click",
        resumeGame
    );


/* ============================================================
   GAME LOOP
   ============================================================ */

function gameLoop(
    currentTime
) {

    const rawDelta =
        (
            currentTime -
            previousTime
        ) /
        1000;


    previousTime =
        currentTime;


    const dt =
        Math.min(
            rawDelta,
            .033
        );


    updateGame(
        dt
    );


    render();


    requestAnimationFrame(
        gameLoop
    );

}


/* ============================================================
   INITIALIZATION
   ============================================================ */

resetGame();

updateUI();

requestAnimationFrame(
    gameLoop
);
