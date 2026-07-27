/* =========================================================
   THE SPACE — EGE SPEAKING ENGINE
   NEW Speaking 1–4 trainers
   ========================================================= */


/* =========================================================
   FAVICON
   ========================================================= */

if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/png";
    favicon.href =
        "https://thespace-english.github.io/EGE/favicon.png";
    document.head.appendChild(favicon);
}


/* =========================================================
   TASK CHECK
   ========================================================= */

if (
    typeof SPEAKING_TASK === "undefined" ||
    !SPEAKING_TASK.id ||
    !SPEAKING_TASK.type
) {
    throw new Error(
        "SPEAKING_TASK is incomplete"
    );
}


const TASK_TYPE =
    String(SPEAKING_TASK.type)
        .toUpperCase();

if (
    !["S1", "S2", "S3", "S4"]
        .includes(TASK_TYPE)
) {
    throw new Error(
        "Unknown Speaking task type"
    );
}


/* =========================================================
   STUDENT
   ========================================================= */

const speakingParams =
    new URLSearchParams(
        window.location.search
    );

let speakingStudent =
    speakingParams.get("student") ||
    localStorage.getItem(
        "theSpaceStudent"
    ) ||
    "";

if (speakingStudent) {
    localStorage.setItem(
        "theSpaceStudent",
        speakingStudent
    );
}


/* =========================================================
   GENERAL STATE
   ========================================================= */

let speakingPhase = "ready";

let speakingTimerInterval = null;

let speakingStream = null;
let speakingRecorder = null;
let speakingChunks = [];

let speakingCurrentPart = 0;

let speakingChosenMode = "";

const speakingRecordings = [];
const speakingTextAnswers = [];


/* =========================================================
   APP
   ========================================================= */

const speakingApp =
    document.getElementById(
        "speakingApp"
    );

if (!speakingApp) {
    throw new Error(
        'Element #speakingApp not found'
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

function speakingEscape(text) {

    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}


function speakingFormatTime(
    seconds
) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const secs =
        seconds % 60;

    return (
        String(minutes)
            .padStart(2, "0") +
        ":" +
        String(secs)
            .padStart(2, "0")
    );
}


function speakingGetPreparationTime() {

    return Number(
        SPEAKING_TASK.preparationTime ??
        90
    );
}


function speakingGetAnswerTime() {

    return Number(
        SPEAKING_TASK.answerTime ??
        90
    );
}


function speakingGetPartTime() {

    return Number(
        SPEAKING_TASK.partTime ??
        20
    );
}


function speakingIsPractice() {

    return (
        SPEAKING_TASK.mode !==
        "exam"
    );
}


/* =========================================================
   BACK
   ========================================================= */

function speakingBack() {

    if (
        window.history.length > 1
    ) {
        window.history.back();
        return;
    }

    if (SPEAKING_TASK.backUrl) {

        let url =
            SPEAKING_TASK.backUrl;

        if (speakingStudent) {

            url +=
                (
                    url.includes("?")
                        ? "&"
                        : "?"
                ) +
                "student=" +
                encodeURIComponent(
                    speakingStudent
                );
        }

        window.location.href =
            url;

        return;
    }

    window.location.href =
        "https://thespace-english.github.io/The-Space-Trainer/";
}


/* =========================================================
   BASIC PAGE
   ========================================================= */

function speakingBuildShell() {

    const title =
        SPEAKING_TASK.title ||
        "Speaking Practice";

    speakingApp.innerHTML = `

    <div class="space-decor space-decor-medium"></div>
<div class="space-decor space-decor-small"></div>

<img
    class="speaking-logo"
    src="https://thespace-english.github.io/EGE/logo.png"
    alt="The Space"
>


        <button
            class="speaking-back"
            type="button"
            id="speakingBack"
        >
            ← BACK
        </button>

        <div class="speaking-page">

            <div class="speaking-top">

                <div class="speaking-label">
                    EGE · ${TASK_TYPE} ·
                    ${speakingEscape(
                        SPEAKING_TASK.id
                    )}
                </div>

                <h1 class="speaking-title">
                    ${speakingEscape(title)}
                </h1>

                <div
                    id="speakingStudent"
                    class="speaking-student"
                ></div>

            </div>

            <div
                id="speakingInstruction"
                class="speaking-instruction"
            ></div>

            <div
                id="speakingWorkspace"
            ></div>

            <div
                id="speakingResult"
                class="speaking-result"
            ></div>

        </div>
    `;

    document.getElementById(
        "speakingBack"
    ).addEventListener(
        "click",
        speakingBack
    );

    document.getElementById(
        "speakingStudent"
    ).textContent =
        speakingStudent
            ? "Student: " +
              speakingStudent
            : "Student not selected";
}


/* =========================================================
   TIMER
   ========================================================= */

function speakingTimerHTML(
    label,
    seconds
) {

    return `

        <div
            id="speakingTimerCard"
            class="speaking-timer-card"
        >

            <div
                id="speakingTimerLabel"
                class="speaking-timer-label"
            >
                ${speakingEscape(label)}
            </div>

            <div
                id="speakingTimer"
                class="speaking-timer"
            >
                ${speakingFormatTime(
                    seconds
                )}
            </div>

            <div
                id="speakingTimerStatus"
                class="speaking-timer-status"
            ></div>

            <div
                class="speaking-progress"
            >
                <div
                    id="speakingProgressBar"
                    class="speaking-progress-bar"
                ></div>
            </div>

        </div>
    `;
}


function speakingStopTimer() {

    if (speakingTimerInterval) {

        clearInterval(
            speakingTimerInterval
        );

        speakingTimerInterval =
            null;
    }
}


function speakingStartTimer(
    totalSeconds,
    label,
    onFinish
) {

    speakingStopTimer();

    const timer =
        document.getElementById(
            "speakingTimer"
        );

    const timerLabel =
        document.getElementById(
            "speakingTimerLabel"
        );

    const card =
        document.getElementById(
            "speakingTimerCard"
        );

    const bar =
        document.getElementById(
            "speakingProgressBar"
        );

    if (
        !timer ||
        !timerLabel ||
        !card ||
        !bar
    ) {
        return;
    }

    const durationMs =
    Number(totalSeconds) * 1000;

const startTime =
    Date.now();

timerLabel.textContent =
    label;

timer.textContent =
    speakingFormatTime(
        Number(totalSeconds)
    );

bar.style.transition =
    "width 0.08s linear";

bar.style.width =
    "100%";


speakingTimerInterval =
    setInterval(
        () => {

            const elapsed =
                Date.now() - startTime;

            const leftMs =
                Math.max(
                    0,
                    durationMs - elapsed
                );

            const remaining =
                Math.ceil(
                    leftMs / 1000
                );


            timer.textContent =
                speakingFormatTime(
                    remaining
                );


            const percent =
                durationMs > 0
                    ? (
                        leftMs /
                        durationMs
                    ) * 100
                    : 0;


            bar.style.width =
                percent + "%";


            if (leftMs <= 0) {

                speakingStopTimer();

                timer.textContent =
                    "00:00";

                bar.style.width =
                    "0%";


                if (
                    typeof onFinish ===
                    "function"
                ) {
                    onFinish();
                }
            }

        },
        50
    );
}


/* =========================================================
   MICROPHONE
   ========================================================= */

async function speakingGetMicrophone() {

    if (speakingStream) {
        return speakingStream;
    }

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
            .getUserMedia
    ) {

        throw new Error(
            "Microphone recording is not supported by this browser."
        );
    }


    speakingStream =
        await navigator
            .mediaDevices
            .getUserMedia({
                audio: true
            });


    return speakingStream;
}


function speakingBestMimeType() {

    const types = [

        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus"

    ];

    for (
        const type of types
    ) {

        if (
            window.MediaRecorder &&
            MediaRecorder
                .isTypeSupported(type)
        ) {
            return type;
        }
    }

    return "";
}


/* =========================================================
   RECORDING
   ========================================================= */

async function speakingStartRecording() {

    const stream =
        await speakingGetMicrophone();

    speakingChunks = [];

    const mimeType =
        speakingBestMimeType();

    const options =
        mimeType
            ? { mimeType }
            : undefined;

    speakingRecorder =
        new MediaRecorder(
            stream,
            options
        );


    speakingRecorder.addEventListener(
        "dataavailable",
        event => {

            if (
                event.data &&
                event.data.size > 0
            ) {
                speakingChunks.push(
                    event.data
                );
            }
        }
    );


    speakingRecorder.start();


    const recordingBox =
        document.getElementById(
            "speakingRecording"
        );

    if (recordingBox) {
        recordingBox.classList.add(
            "active"
        );
    }
}


function speakingStopRecording() {

    return new Promise(
        resolve => {

            if (
                !speakingRecorder ||
                speakingRecorder.state ===
                    "inactive"
            ) {

                resolve(null);
                return;
            }


            speakingRecorder
                .addEventListener(
                    "stop",
                    () => {

                        const mime =
                            speakingRecorder
                                .mimeType ||
                            "audio/webm";

                        const blob =
                            new Blob(
                                speakingChunks,
                                {
                                    type: mime
                                }
                            );

                        const url =
                            URL.createObjectURL(
                                blob
                            );

                        resolve({
                            blob,
                            url,
                            mimeType: mime
                        });

                    },
                    {
                        once: true
                    }
                );


            speakingRecorder.stop();


            const recordingBox =
                document.getElementById(
                    "speakingRecording"
                );

            if (recordingBox) {
                recordingBox.classList.remove(
                    "active"
                );
            }
        }
    );
}


/* =========================================================
   RECORDING UI
   ========================================================= */

function speakingRecordingHTML() {

    return `

        <div
            id="speakingRecording"
            class="speaking-recording"
        >

            <div
                class="speaking-recording-status"
            >

                <span
                    class="speaking-recording-dot"
                ></span>

                <span>
                    RECORDING
                </span>

            </div>

        </div>
    `;
}

function speakingBeep() {

    try {

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        const context =
            new AudioContextClass();

        const oscillator =
            context.createOscillator();

        const gain =
            context.createGain();

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.frequency.value = 880;
        gain.gain.value = 0.15;

        oscillator.start();

        oscillator.stop(
            context.currentTime + 0.3
        );

    } catch (error) {

        console.log(
            "Sound signal unavailable"
        );
    }
}

/* =========================================================
   S1
   ========================================================= */

function speakingBuildS1() {

    document.getElementById(
        "speakingInstruction"
    ).textContent =
        SPEAKING_TASK.instruction ||
        "Read the text aloud.";

    const workspace =
        document.getElementById(
            "speakingWorkspace"
        );

    workspace.innerHTML = `

        <div class="speaking-layout">

            <section
                class="speaking-main"
            >

                <h2
                    class="speaking-content-title"
                >
                    Task 1
                </h2>

                <div class="speaking-text">
                    ${SPEAKING_TASK.text || ""}
                </div>

            </section>


            <section
                class="speaking-side"
            >

                <div
                    class="speaking-side-title"
                >
                    SPEAKING
                </div>

                ${speakingTimerHTML(
                    "READY",
                    speakingGetPreparationTime()
                )}

                <div
                    id="speakingControls"
                >

                    <button
                        id="speakingStart"
                        class="speaking-button"
                        type="button"
                    >
                        START PREPARATION
                    </button>

                </div>

            </section>

        </div>
    `;


    document.getElementById(
        "speakingStart"
    ).addEventListener(
        "click",
        speakingStartS1Preparation
    );
}


async function speakingStartS1Preparation() {

    try {

        await speakingGetMicrophone();

    } catch (error) {

        alert(
            "Please allow microphone access."
        );

        console.error(error);

        return;
    }


    speakingPhase =
        "preparation";

    const controls =
        document.getElementById(
            "speakingControls"
        );

    controls.innerHTML = `

        <div class="speaking-phase">
            PREPARATION
        </div>

        <button
            id="speakingSkipPrep"
            class="speaking-button secondary"
            type="button"
        >
            START READING NOW
        </button>
    `;


    document.getElementById(
        "speakingSkipPrep"
    ).addEventListener(
        "click",
        speakingStartS1Answer
    );


    speakingStartTimer(
        speakingGetPreparationTime(),
        "PREPARATION",
        speakingStartS1Answer
    );
}


async function speakingStartS1Answer() {

    speakingStopTimer();
        speakingBeep();

    speakingPhase =
        "recording";


    try {

        await speakingStartRecording();

    } catch (error) {

        alert(
            "Microphone access is required."
        );

        console.error(error);

        return;
    }


    const controls =
        document.getElementById(
            "speakingControls"
        );

    controls.innerHTML = `

        <div class="speaking-phase">
            READ ALOUD
        </div>

        ${speakingRecordingHTML()}

        <button
            id="speakingFinish"
            class="speaking-button"
            type="button"
        >
            FINISH
        </button>
    `;


    const recordingBox =
        document.getElementById(
            "speakingRecording"
        );

    recordingBox.classList.add(
        "active"
    );


    document.getElementById(
        "speakingFinish"
    ).addEventListener(
        "click",
        speakingFinishS1
    );


    speakingStartTimer(
        speakingGetAnswerTime(),
        "READING",
        speakingFinishS1
    );
}


async function speakingFinishS1() {

    if (
        speakingPhase ===
        "review"
    ) {
        return;
    }

    speakingPhase = "review";

    speakingStopTimer();

    const recording =
        await speakingStopRecording();

    if (recording) {

        speakingRecordings[0] = {
            part: 1,
            prompt:
                "Reading aloud",
            ...recording
        };
    }


    speakingShowSingleReview();
}


/* =========================================================
   S2
   ========================================================= */

function speakingBuildS2() {

    const instruction =
    document.getElementById(
        "speakingInstruction"
    );

instruction.textContent = "";
instruction.style.display = "none";

    const workspace =
        document.getElementById(
            "speakingWorkspace"
        );

    const prompts =
        Array.isArray(
            SPEAKING_TASK.prompts
        )
            ? SPEAKING_TASK.prompts
            : [];

    const imageHTML =
        SPEAKING_TASK.image
            ? `
                <div class="speaking-s2-image-card">
                    <img
                        class="speaking-s2-image"
                        src="${speakingEscape(
                            SPEAKING_TASK.image
                        )}"
                        alt="${speakingEscape(
                            SPEAKING_TASK.imageTitle ||
                            ""
                        )}"
                    >
                </div>
            `
            : "";

    const promptsHTML =
        prompts.map(
            (prompt, index) => {

                const text =
                    typeof prompt ===
                        "string"
                        ? prompt
                        : prompt.text;

                return `
                    <div class="speaking-s2-prompt">
                        <span class="speaking-s2-number">
                            ${index + 1}
                        </span>

                        <span>
                            ${speakingEscape(text)}
                        </span>
                    </div>
                `;
            }
        ).join("");

    workspace.innerHTML = `

        <div class="speaking-layout">

            <section
                class="speaking-main speaking-s2-main"
            >

                <h2 class="speaking-content-title">
                    Task 2
                </h2>

                <div class="speaking-s2-content">

                    <div class="speaking-s2-task">

                        <div class="speaking-s2-task-text">
                            ${SPEAKING_TASK.taskText || ""}
                        </div>

                        <div class="speaking-s2-prompts">
                            ${promptsHTML}
                        </div>

                        <div class="speaking-s2-final-line">
                            ${speakingEscape(
                                SPEAKING_TASK.finalLine ||
                                "You have 20 seconds to ask each question."
                            )}
                        </div>

                    </div>

                    ${imageHTML}

                </div>

            </section>


            <section class="speaking-side">

                <div class="speaking-side-title">
                    SPEAKING
                </div>

                ${speakingTimerHTML(
                    "READY",
                    speakingGetPreparationTime()
                )}

                <div id="speakingControls">

                    <div class="speaking-mode-grid">

                        <button
                            id="speakingModeAudio"
                            class="speaking-mode-card"
                            type="button"
                        >
                            <div class="speaking-mode-name">
                                SPEAK
                            </div>

                            <div class="speaking-mode-text">
                                Record four questions
                            </div>
                        </button>

                        <button
                            id="speakingModeText"
                            class="speaking-mode-card"
                            type="button"
                        >
                            <div class="speaking-mode-name">
                                TYPE
                            </div>

                            <div class="speaking-mode-text">
                                Write four questions
                            </div>
                        </button>

                    </div>

                </div>

            </section>

        </div>
    `;


    document.getElementById(
        "speakingModeAudio"
    ).addEventListener(
        "click",
        async () => {

            speakingChosenMode =
                "audio";

            try {
                await speakingGetMicrophone();
            } catch (error) {

                alert(
                    "Microphone access is required."
                );

                console.error(error);

                return;
            }

            speakingStartS2Preparation();
        }
    );


    document.getElementById(
        "speakingModeText"
    ).addEventListener(
        "click",
        () => {

            speakingChosenMode =
                "text";

            speakingStartS2Text();
        }
    );
}


/* ---------------------------------------------------------
   S2 AUDIO — PREPARATION
--------------------------------------------------------- */

function speakingStartS2Preparation() {

    speakingCurrentPart = 0;

    speakingPhase =
        "preparation";

    const controls =
        document.getElementById(
            "speakingControls"
        );

    controls.innerHTML = `

        <div class="speaking-phase">
            PREPARATION
        </div>

        <button
            id="speakingSkipS2Prep"
            class="speaking-button secondary"
            type="button"
        >
            START QUESTIONS NOW
        </button>
    `;


    document.getElementById(
        "speakingSkipS2Prep"
    ).addEventListener(
        "click",
        speakingStartS2Ready
    );


    speakingStartTimer(
        speakingGetPreparationTime(),
        "PREPARATION",
        speakingStartS2Ready
    );
}


/* ---------------------------------------------------------
   S2 — 3 SECOND READY
--------------------------------------------------------- */

function speakingStartS2Ready() {

    speakingStopTimer();

    const prompts =
        SPEAKING_TASK.prompts || [];


    if (
        speakingCurrentPart >=
        prompts.length
    ) {

        speakingPhase =
            "review";

        speakingShowMultiReview();

        return;
    }


    const prompt =
        prompts[
            speakingCurrentPart
        ];

    const promptText =
        typeof prompt ===
            "string"
            ? prompt
            : prompt.text;


    speakingShowS2CurrentPrompt(
        promptText
    );


    const controls =
        document.getElementById(
            "speakingControls"
        );


    controls.innerHTML = `

        <div class="speaking-phase">
            QUESTION ${speakingCurrentPart + 1}
        </div>

        <div class="speaking-s2-current-question">
            ${speakingEscape(
                promptText
            )}
        </div>
    `;


   setTimeout(
    speakingStartS2Recording,
    3000
);
}


/* ---------------------------------------------------------
   S2 — RECORD 20 SEC
--------------------------------------------------------- */

async function speakingStartS2Recording() {

    speakingStopTimer();

    speakingBeep();

    const prompts =
        SPEAKING_TASK.prompts || [];

    const prompt =
        prompts[
            speakingCurrentPart
        ];

    const promptText =
        typeof prompt ===
            "string"
            ? prompt
            : prompt.text;


    const controls =
        document.getElementById(
            "speakingControls"
        );


    controls.innerHTML = `

        <div class="speaking-phase">
            QUESTION ${speakingCurrentPart + 1}
        </div>

        <div class="speaking-s2-current-question">
            ${speakingEscape(
                promptText
            )}
        </div>

        ${speakingRecordingHTML()}
    `;


    try {

        await speakingStartRecording();

    } catch (error) {

        alert(
            "Microphone access is required."
        );

        console.error(error);

        return;
    }


    const recordingBox =
        document.getElementById(
            "speakingRecording"
        );

    if (recordingBox) {
        recordingBox.classList.add(
            "active"
        );
    }


    speakingStartTimer(
        speakingGetPartTime(),
        `QUESTION ${speakingCurrentPart + 1}`,
        speakingFinishS2Part
    );
}


/* ---------------------------------------------------------
   S2 — SAVE PART AND GO NEXT
--------------------------------------------------------- */

async function speakingFinishS2Part() {

    speakingStopTimer();

    const prompts =
        SPEAKING_TASK.prompts || [];

    const prompt =
        prompts[
            speakingCurrentPart
        ];

    const promptText =
        typeof prompt ===
            "string"
            ? prompt
            : prompt.text;


    const recording =
        await speakingStopRecording();


    if (recording) {

        speakingRecordings[
            speakingCurrentPart
        ] = {

            part:
                speakingCurrentPart + 1,

            prompt:
                promptText,

            ...recording
        };
    }


    speakingCurrentPart++;


    if (
        speakingCurrentPart >=
        prompts.length
    ) {

        speakingPhase =
            "review";

        speakingShowMultiReview();

        return;
    }


    speakingStartS2Ready();
}


/* ---------------------------------------------------------
   S2 — SHOW ONLY CURRENT PROMPT
   IMAGE STAYS
--------------------------------------------------------- */

function speakingShowS2CurrentPrompt(
    promptText
) {

    const main =
        document.querySelector(
            ".speaking-s2-main"
        );

    if (!main) {
        return;
    }


    const imageHTML =
        SPEAKING_TASK.image
            ? `
                <div class="speaking-s2-image-card">
                    <img
                        class="speaking-s2-image"
                        src="${speakingEscape(
                            SPEAKING_TASK.image
                        )}"
                        alt=""
                    >
                </div>
            `
            : "";


    main.innerHTML = `

    <h2 class="speaking-content-title">
        Task 2
    </h2>

    <div class="speaking-s2-content">

        <div class="speaking-s2-task">

            <div class="speaking-s2-task-text">
                ${SPEAKING_TASK.taskText || ""}
            </div>

            <div class="speaking-s2-prompts">

                <div class="speaking-s2-prompt">

                    <span class="speaking-s2-number">
                        ${speakingCurrentPart + 1}
                    </span>

                    <span>
                        ${speakingEscape(
                            promptText
                        )}
                    </span>

                </div>

            </div>

            <div class="speaking-s2-final-line">
                ${speakingEscape(
                    SPEAKING_TASK.finalLine ||
                    "You have 20 seconds to ask each question."
                )}
            </div>

        </div>

        ${imageHTML}

    </div>
`;
}


/* ---------------------------------------------------------
   S2 TEXT MODE — NO TIMER
--------------------------------------------------------- */

function speakingStartS2Text() {

    speakingStopTimer();

    const prompts =
        SPEAKING_TASK.prompts || [];

    const controls =
        document.getElementById(
            "speakingControls"
        );


    controls.innerHTML = `

        <div class="speaking-phase">
            TYPE YOUR QUESTIONS
        </div>

        ${prompts.map(
            (prompt, index) => {

                const promptText =
                    typeof prompt ===
                        "string"
                        ? prompt
                        : prompt.text;

                return `

                    <div class="speaking-prompt">

                        <div class="speaking-prompt-number">
                            QUESTION ${index + 1}
                        </div>

                        <div class="speaking-prompt-text">
                            ${speakingEscape(
                                promptText
                            )}
                        </div>

                        <textarea
                            class="speaking-textarea"
                            data-part="${index + 1}"
                            placeholder="Write your question..."
                        ></textarea>

                    </div>
                `;
            }
        ).join("")}

        <button
            id="speakingSubmitText"
            class="speaking-button"
            type="button"
        >
            SUBMIT ANSWERS
        </button>
    `;


    document.getElementById(
        "speakingSubmitText"
    ).addEventListener(
        "click",
        speakingCollectS2Text
    );
}


function speakingCollectS2Text() {

    speakingTextAnswers.length = 0;

    document
        .querySelectorAll(
            ".speaking-textarea"
        )
        .forEach(
            textarea => {

                const part =
                    Number(
                        textarea.dataset.part
                    );

                const prompt =
                    SPEAKING_TASK.prompts[
                        part - 1
                    ];

                const promptText =
                    typeof prompt ===
                        "string"
                        ? prompt
                        : prompt.text;


                speakingTextAnswers.push({

                    part,

                    prompt:
                        promptText,

                    answer:
                        textarea.value.trim()
                });
            }
        );


    speakingShowTextReview();
}


/* =========================================================
   S3
   ========================================================= */

function speakingBuildS3() {

    document.getElementById(
        "speakingInstruction"
    ).textContent =
        SPEAKING_TASK.instruction ||
        "Answer the interviewer’s questions.";

    speakingCurrentPart = 0;

    const workspace =
        document.getElementById(
            "speakingWorkspace"
        );


    workspace.innerHTML = `

        <div class="speaking-layout">

            <section
                class="speaking-main"
            >

                <h2
                    class="speaking-content-title"
                >
                    Task 3
                </h2>

                <div
                    id="speakingInterviewQuestion"
                    class="speaking-text"
                >
                    Press START when you are ready.
                </div>

            </section>


            <section
                class="speaking-side"
            >

                ${speakingTimerHTML(
                    "READY",
                    speakingGetPreparationTime()
                )}

                <div
                    id="speakingControls"
                >

                    <button
                        id="speakingStart"
                        class="speaking-button"
                        type="button"
                    >
                        START
                    </button>

                </div>

            </section>

        </div>
    `;


    document.getElementById(
        "speakingStart"
    ).addEventListener(
        "click",
        speakingStartS3Preparation
    );
}


function speakingStartS3Preparation() {

    const controls =
        document.getElementById(
            "speakingControls"
        );

    controls.innerHTML = `

        <div class="speaking-phase">
            PREPARATION
        </div>
    `;


    speakingStartTimer(
        speakingGetPreparationTime(),
        "PREPARATION",
        speakingStartNextS3Part
    );
}


async function speakingStartNextS3Part() {

    speakingStopTimer();

    const questions =
        SPEAKING_TASK.questions || [];


    if (
        speakingCurrentPart >=
        questions.length
    ) {

        speakingShowMultiReview();
        return;
    }


    const question =
        questions[
            speakingCurrentPart
        ];


    const questionBox =
        document.getElementById(
            "speakingInterviewQuestion"
        );


    const showText =
        speakingIsPractice() ||
        SPEAKING_TASK.showQuestionText ===
            true;


    questionBox.innerHTML =
        showText
            ? `
                <strong>
                    Question
                    ${speakingCurrentPart + 1}
                </strong>
                <br><br>
                ${speakingEscape(
                    question.text || ""
                )}
            `
            : `
                <strong>
                    Question
                    ${speakingCurrentPart + 1}
                </strong>
                <br><br>
                Listen carefully.
            `;


    if (question.audio) {

        const audio =
            new Audio(
                question.audio
            );

        try {
            await audio.play();
        } catch (error) {
            console.error(error);
        }

        await new Promise(
            resolve => {

                audio.addEventListener(
                    "ended",
                    resolve,
                    { once: true }
                );

                audio.addEventListener(
                    "error",
                    resolve,
                    { once: true }
                );
            }
        );
    }


    try {

        await speakingStartRecording();

    } catch (error) {

        alert(
            "Microphone access is required."
        );

        console.error(error);

        return;
    }


    const controls =
        document.getElementById(
            "speakingControls"
        );


    controls.innerHTML = `

        <div class="speaking-phase">
            ANSWER
            ${speakingCurrentPart + 1}
            OF ${questions.length}
        </div>

        ${speakingRecordingHTML()}

        <button
            id="speakingFinishPart"
            class="speaking-button"
            type="button"
        >
            NEXT
        </button>
    `;


    document.getElementById(
        "speakingRecording"
    ).classList.add(
        "active"
    );


    document.getElementById(
        "speakingFinishPart"
    ).addEventListener(
        "click",
        speakingFinishS3Part
    );


    speakingStartTimer(
        speakingGetPartTime(),
        `ANSWER ${speakingCurrentPart + 1}`,
        speakingFinishS3Part
    );
}


async function speakingFinishS3Part() {

    speakingStopTimer();

    const question =
        SPEAKING_TASK.questions[
            speakingCurrentPart
        ];


    const recording =
        await speakingStopRecording();


    if (recording) {

        speakingRecordings[
            speakingCurrentPart
        ] = {

            part:
                speakingCurrentPart + 1,

            prompt:
                question.text ||
                `Question ${speakingCurrentPart + 1}`,

            ...recording
        };
    }


    speakingCurrentPart++;

    speakingStartNextS3Part();
}


/* =========================================================
   S4
   ========================================================= */

function speakingBuildS4() {

    document.getElementById(
        "speakingInstruction"
    ).textContent =
        SPEAKING_TASK.instruction ||
        "Give a talk based on the project and the photographs.";

    const workspace =
        document.getElementById(
            "speakingWorkspace"
        );


    const images =
        SPEAKING_TASK.images || [];


    const imageHTML =
        images.length
            ? `
                <div class="speaking-images">
                    ${images.map(
                        src => `
                            <img
                                src="${speakingEscape(src)}"
                                alt=""
                            >
                        `
                    ).join("")}
                </div>
            `
            : "";


    const plan =
        SPEAKING_TASK.plan || [];


    workspace.innerHTML = `

        <div class="speaking-layout">

            <section
                class="speaking-main"
            >

                <h2
                    class="speaking-content-title"
                >
                    ${speakingEscape(
                        SPEAKING_TASK.project ||
                        SPEAKING_TASK.title ||
                        "Task 4"
                    )}
                </h2>

                ${imageHTML}

                <div class="speaking-plan">

                    ${plan.map(
                        (item, index) => `

                            <div
                                class="speaking-plan-item"
                            >
                                ${index + 1}.
                                ${speakingEscape(item)}
                            </div>
                        `
                    ).join("")}

                </div>

            </section>


            <section
                class="speaking-side"
            >

                ${speakingTimerHTML(
                    "READY",
                    speakingGetPreparationTime()
                )}

                <div
                    id="speakingControls"
                >

                    <button
                        id="speakingStart"
                        class="speaking-button"
                        type="button"
                    >
                        START PREPARATION
                    </button>

                </div>

            </section>

        </div>
    `;


    document.getElementById(
        "speakingStart"
    ).addEventListener(
        "click",
        speakingStartS4Preparation
    );
}


function speakingStartS4Preparation() {

    const controls =
        document.getElementById(
            "speakingControls"
        );

    controls.innerHTML = `

        <div class="speaking-phase">
            PREPARATION
        </div>
    `;


    speakingStartTimer(
        speakingGetPreparationTime(),
        "PREPARATION",
        speakingStartS4Answer
    );
}


async function speakingStartS4Answer() {

    speakingStopTimer();

    try {

        await speakingStartRecording();

    } catch (error) {

        alert(
            "Microphone access is required."
        );

        console.error(error);

        return;
    }


    const controls =
        document.getElementById(
            "speakingControls"
        );


    controls.innerHTML = `

        <div class="speaking-phase">
            YOUR TALK
        </div>

        ${speakingRecordingHTML()}

        <button
            id="speakingFinish"
            class="speaking-button"
            type="button"
        >
            FINISH
        </button>
    `;


    document.getElementById(
        "speakingRecording"
    ).classList.add(
        "active"
    );


    document.getElementById(
        "speakingFinish"
    ).addEventListener(
        "click",
        speakingFinishS4
    );


    speakingStartTimer(
        speakingGetAnswerTime(),
        "ANSWER",
        speakingFinishS4
    );
}


async function speakingFinishS4() {

    speakingStopTimer();

    const recording =
        await speakingStopRecording();


    if (recording) {

        speakingRecordings[0] = {

            part: 1,

            prompt:
                SPEAKING_TASK.project ||
                "Monologue",

            ...recording
        };
    }


    speakingShowSingleReview();
}


/* =========================================================
   REVIEW — SINGLE AUDIO
   ========================================================= */

function speakingShowSingleReview() {

    const controls =
        document.getElementById(
            "speakingControls"
        );

    const recording =
        speakingRecordings[0];


    controls.innerHTML = `

        <div class="speaking-phase">
            REVIEW
        </div>

        ${
            recording
                ? `
                    <audio
                        class="speaking-audio"
                        controls
                        src="${recording.url}"
                    ></audio>
                `
                : ""
        }

        <button
            id="speakingSubmit"
            class="speaking-button"
            type="button"
        >
            SUBMIT
        </button>

        ${
            speakingIsPractice()
                ? `
                    <button
                        id="speakingRetry"
                        class="speaking-button secondary"
                        type="button"
                    >
                        RECORD AGAIN
                    </button>
                `
                : ""
        }
    `;


    document.getElementById(
        "speakingSubmit"
    ).addEventListener(
        "click",
        speakingPrepareSubmission
    );


    const retry =
        document.getElementById(
            "speakingRetry"
        );

    if (retry) {

        retry.addEventListener(
            "click",
            () => {
                location.reload();
            }
        );
    }
}


/* =========================================================
   REVIEW — MULTI AUDIO
   ========================================================= */

function speakingShowMultiReview() {

    const controls =
        document.getElementById(
            "speakingControls"
        );


    controls.innerHTML = `

        <div class="speaking-phase">
            REVIEW
        </div>

        ${speakingRecordings.map(
            recording => `

                <div
                    class="speaking-prompt"
                >

                    <div
                        class="speaking-prompt-number"
                    >
                        PART ${recording.part}
                    </div>

                    <div
                        class="speaking-prompt-text"
                    >
                        ${speakingEscape(
                            recording.prompt
                        )}
                    </div>

                    <audio
                        class="speaking-audio"
                        controls
                        src="${recording.url}"
                    ></audio>

                </div>
            `
        ).join("")}

        <button
            id="speakingSubmit"
            class="speaking-button"
            type="button"
        >
            SUBMIT
        </button>

        ${
            speakingIsPractice()
                ? `
                    <button
                        id="speakingRetry"
                        class="speaking-button secondary"
                        type="button"
                    >
                        TRY AGAIN
                    </button>
                `
                : ""
        }
    `;


    document.getElementById(
        "speakingSubmit"
    ).addEventListener(
        "click",
        speakingPrepareSubmission
    );


    const retry =
        document.getElementById(
            "speakingRetry"
        );

    if (retry) {

        retry.addEventListener(
            "click",
            () => {
                location.reload();
            }
        );
    }
}


/* =========================================================
   REVIEW — TEXT
   ========================================================= */

function speakingShowTextReview() {

    const controls =
        document.getElementById(
            "speakingControls"
        );


    controls.innerHTML = `

        <div class="speaking-phase">
            REVIEW
        </div>

        ${speakingTextAnswers.map(
            item => `

                <div
                    class="speaking-prompt"
                >

                    <div
                        class="speaking-prompt-number"
                    >
                        QUESTION ${item.part}
                    </div>

                    <div
                        class="speaking-prompt-text"
                    >
                        ${speakingEscape(
                            item.prompt
                        )}
                    </div>

                    <div
                        style="margin-top:8px;"
                    >
                        ${speakingEscape(
                            item.answer ||
                            "—"
                        )}
                    </div>

                </div>
            `
        ).join("")}

        <button
            id="speakingSubmit"
            class="speaking-button"
            type="button"
        >
            SUBMIT
        </button>

        <button
            id="speakingRetry"
            class="speaking-button secondary"
            type="button"
        >
            TRY AGAIN
        </button>
    `;


    document.getElementById(
        "speakingSubmit"
    ).addEventListener(
        "click",
        speakingPrepareSubmission
    );


    document.getElementById(
        "speakingRetry"
    ).addEventListener(
        "click",
        () => {
            location.reload();
        }
    );
}


/* =========================================================
   PREPARE SUBMISSION
   ========================================================= */

async function speakingBlobToBase64(blob) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();

        reader.onloadend =
            () => {

                const result =
                    String(
                        reader.result || ""
                    );

                const comma =
                    result.indexOf(",");

                resolve(
                    comma >= 0
                        ? result.slice(
                            comma + 1
                        )
                        : result
                );
            };

        reader.onerror =
            reject;

        reader.readAsDataURL(blob);
    });
}


async function speakingPrepareSubmission() {

    if (!speakingStudent) {

        alert(
            "Please return to Speaking and choose your name."
        );

        return;
    }


    const result =
        document.getElementById(
            "speakingResult"
        );


    result.innerHTML = `

        <div class="speaking-success">

            <div
                class="speaking-success-title"
            >
                SENDING...
            </div>

            <div
                class="speaking-success-text"
            >
                Please wait while your answer is being saved.
            </div>

        </div>
    `;

    result.style.display =
        "block";


    try {

        const recordings = [];


        for (
            const recording of
            speakingRecordings
        ) {

            if (
                !recording ||
                !recording.blob
            ) {
                continue;
            }


            const base64 =
                await speakingBlobToBase64(
                    recording.blob
                );


            recordings.push({

                part:
                    recording.part,

                prompt:
                    recording.prompt || "",

                mimeType:
                    recording.mimeType ||
                    recording.blob.type ||
                    "audio/webm",

                base64:
                    base64
            });
        }


        const payload = {

            action:
                "submitspeaking",

            student:
                speakingStudent,

            course:
                "EGE",

            section:
                TASK_TYPE,

            taskId:
                SPEAKING_TASK.id,

            mode:
                speakingChosenMode ||
                (
                    speakingTextAnswers.length
                        ? "text"
                        : "audio"
                ),

            recordings:
                recordings,

            textAnswers:
                speakingTextAnswers
        };


        const response =
            await fetch(
                "https://script.google.com/macros/s/AKfycbxxTEqdc_eAgBYhxPlAxGdD4ufwliTjwp3Rvc_leSns3wG6tnS1KKlCQABN2OYHZP1nTQ/exec",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const responseText =
    await response.text();

console.log(
    "Speaking server response:",
    responseText
);

let data;

try {

    data =
        JSON.parse(
            responseText
        );

} catch (error) {

    throw new Error(
        "Server response: " +
        responseText
    );
}


        if (
            data.status !==
            "success"
        ) {

            throw new Error(
                data.message ||
                "Speaking submission failed"
            );
        }


        result.innerHTML = `

            <div class="speaking-success">

                <div
                    class="speaking-success-title"
                >
                    ANSWER SUBMITTED
                </div>

                <div
                    class="speaking-success-text"
                >
                    Attempt ${data.attempt}
                    · Waiting for teacher review
                </div>

            </div>
        `;


    } catch (error) {

        console.error(
            "Speaking submission error:",
            error
        );


        result.innerHTML = `

            <div class="speaking-success">

                <div
                    class="speaking-success-title"
                >
                    COULD NOT SAVE
                </div>

                <div
                    class="speaking-success-text"
                >
                    Please try again.
                </div>

            </div>
        `;
    }
}

/* =========================================================
   START
   ========================================================= */

speakingBuildShell();


switch (TASK_TYPE) {

    case "S1":
        speakingBuildS1();
        break;

    case "S2":
        speakingBuildS2();
        break;

    case "S3":
        speakingBuildS3();
        break;

    case "S4":
        speakingBuildS4();
        break;
}