/* =========================================================
   THE SPACE — EGE READING 1 ENGINE
   Builds NEW R1 trainers from READING_TASK
   ========================================================= */


/* FAVICON */

if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/png";
    favicon.href = "https://thespace-english.github.io/EGE/favicon.png";
    document.head.appendChild(favicon);
}


/* PLATFORM */

const R1_API_URL =
    "https://script.google.com/macros/s/AKfycbxxTEqdc_eAgBYhxPlAxGdD4ufwliTjwp3Rvc_leSns3wG6tnS1KKlCQABN2OYHZP1nTQ/exec";

const R1_PAGE_URL =
    "https://thespace-english.github.io/The-Space-Trainer/ege-r1.html";


/* CHECK DATA */

if (
    typeof READING_TASK === "undefined" ||
    !READING_TASK.id ||
    !READING_TASK.title ||
    !Array.isArray(READING_TASK.headings) ||
    !Array.isArray(READING_TASK.texts)
) {
    throw new Error("READING_TASK is incomplete");
}


/* STUDENT */

const params =
    new URLSearchParams(window.location.search);

let student =
    params.get("student") ||
    localStorage.getItem("theSpaceStudent") ||
    "";

if (student) {
    localStorage.setItem(
        "theSpaceStudent",
        student
    );
}


/* PAGE */

const app =
    document.getElementById("readingApp");

app.innerHTML = `

    <div class="space-decor space-decor-medium"></div>
    <div class="space-decor space-decor-small"></div>

    <button
        id="readingBack"
        class="reading-back"
        type="button"
    >
        ← BACK TO R1
    </button>

    <div class="reading-page">

        <div class="reading-top">

            <div class="reading-label">
                EGE · R1 · ${READING_TASK.id}
            </div>

            <h1 class="reading-title">
                ${READING_TASK.title}
            </h1>

            <div
                id="readingStudent"
                class="reading-student"
            ></div>

        </div>


        <div
            id="readingReview"
            class="reading-review"
        >
            <div class="reading-review-title">
                LAST ATTEMPT
            </div>

            <div
                id="readingReviewDetails"
                class="reading-review-details"
            ></div>

            <button
                id="readingRetryTop"
                class="reading-button secondary"
                type="button"
            >
                TRY AGAIN
            </button>
        </div>


        <div class="reading-layout">

            <section class="reading-main">

                <div
                    id="readingTexts"
                    class="reading-text"
                ></div>

            </section>


            <section class="reading-side">

                <div class="reading-side-title">
                    HEADINGS
                </div>

                <div id="readingHeadings"></div>

                <button
                    id="readingCheck"
                    class="reading-button"
                    type="button"
                >
                    CHECK ANSWERS
                </button>

            </section>

        </div>


        <div
            id="readingResult"
            class="reading-result"
        >
            <div
                id="readingScore"
                class="reading-score"
            ></div>

            <div
                id="readingMistakes"
                class="reading-mistakes"
            ></div>

            <div
                id="readingSaved"
                class="reading-saved"
            ></div>

            <button
                id="readingRetryBottom"
                class="reading-button secondary"
                type="button"
            >
                TRY AGAIN
            </button>
        </div>

    </div>
`;


/* STUDENT */

document.getElementById(
    "readingStudent"
).textContent =
    student
        ? "Student: " + student
        : "Student not selected";


/* HEADINGS */

const headingsBox =
    document.getElementById(
        "readingHeadings"
    );

READING_TASK.headings.forEach(
    (heading, index) => {

        const item =
            document.createElement("div");

        item.className =
            "reading-question";

        item.innerHTML = `
            <span class="reading-question-title">
                ${index + 1}. ${heading}
            </span>
        `;

        headingsBox.appendChild(item);
    }
);


/* TEXTS */

const textsBox =
    document.getElementById(
        "readingTexts"
    );

READING_TASK.texts.forEach(
    (item, index) => {

        const number =
            item.number ?? index + 1;

        const label =
            item.label ?? String.fromCharCode(65 + index);

        const passage =
            document.createElement("div");

        passage.className =
            "reading-passage";

        passage.dataset.question =
            String(number);

        passage.dataset.answer =
            String(item.answer);

        let options =
            `<option value="">—</option>`;

        READING_TASK.headings.forEach(
            (_, headingIndex) => {

                const value =
                    headingIndex + 1;

                options += `
                    <option value="${value}">
                        ${value}
                    </option>
                `;
            }
        );

        passage.innerHTML = `

            <div class="reading-passage-label">
                ${label}
            </div>

            <div>
                ${item.text}
            </div>

            <div style="margin-top:12px;">
                <select class="reading-select">
                    ${options}
                </select>
            </div>
        `;

        textsBox.appendChild(passage);
    }
);


/* BACK */

document.getElementById(
    "readingBack"
).addEventListener(
    "click",
    function () {

        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        let url = R1_PAGE_URL;

        if (student) {
            url +=
                "?student=" +
                encodeURIComponent(student);
        }

        window.location.href = url;
    }
);


/* HELPERS */

function getItems() {
    return document.querySelectorAll(
        ".reading-passage[data-question]"
    );
}


function clearStates() {

    document
        .querySelectorAll(".reading-select")
        .forEach(select => {

            select.classList.remove(
                "correct",
                "wrong"
            );
        });

    document
        .querySelectorAll(".reading-key")
        .forEach(key => key.remove());
}


function setDisabled(value) {

    document
        .querySelectorAll(".reading-select")
        .forEach(select => {
            select.disabled = value;
        });
}


function parseAnswers(text) {

    const answers = {};

    if (!text) {
        return answers;
    }

    String(text)
        .split(",")
        .forEach(part => {

            const separator =
                part.indexOf(":");

            if (separator === -1) {
                return;
            }

            const key =
                part
                    .slice(0, separator)
                    .trim()
                    .replace(/^q/i, "");

            const value =
                part
                    .slice(separator + 1)
                    .trim();

            answers[key] =
                value === "-"
                    ? ""
                    : value;
        });

    return answers;
}


/* LAST ATTEMPT */

async function loadLastAttempt() {

    if (!student) {
        return;
    }

    try {

        const url =
            R1_API_URL +
            "?action=lastattempt" +
            "&student=" +
            encodeURIComponent(student) +
            "&course=EGE" +
            "&section=R1" +
            "&taskId=" +
            encodeURIComponent(
                READING_TASK.id
            );

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (
            data.status !== "success" ||
            !data.found ||
            !data.lastAttempt
        ) {
            return;
        }

        const last =
            data.lastAttempt;

        const answers =
            parseAnswers(last.answers);

        getItems().forEach(item => {

            const number =
                item.dataset.question;

            const correct =
                item.dataset.answer;

            const answer =
                answers[number] || "";

            const select =
                item.querySelector(
                    ".reading-select"
                );

            select.value = answer;

            if (answer === correct) {

                select.classList.add(
                    "correct"
                );

            } else {

                select.classList.add(
                    "wrong"
                );

                const key =
                    document.createElement(
                        "div"
                    );

                key.className =
                    "reading-key";

                key.textContent =
                    "Correct: " + correct;

                item.appendChild(key);
            }
        });

        setDisabled(true);

        document.getElementById(
            "readingCheck"
        ).style.display = "none";

        document.getElementById(
            "readingReviewDetails"
        ).textContent =
            "Attempt " +
            last.attempt +
            " · " +
            last.result;

        document.getElementById(
            "readingReview"
        ).style.display = "block";

    } catch (error) {

        console.error(
            "Could not load last attempt",
            error
        );
    }
}


/* TRY AGAIN */

function tryAgain() {

    clearStates();

    document
        .querySelectorAll(".reading-select")
        .forEach(select => {

            select.value = "";
            select.disabled = false;
        });

    document.getElementById(
        "readingReview"
    ).style.display = "none";

    document.getElementById(
        "readingResult"
    ).style.display = "none";

    document.getElementById(
        "readingCheck"
    ).style.display = "block";
}


document.getElementById(
    "readingRetryTop"
).addEventListener(
    "click",
    tryAgain
);

document.getElementById(
    "readingRetryBottom"
).addEventListener(
    "click",
    tryAgain
);


/* CHECK */

document.getElementById(
    "readingCheck"
).addEventListener(
    "click",
    async function () {

        if (!student) {

            alert(
                "Please return to R1 and choose your name."
            );

            return;
        }

        clearStates();

        let score = 0;

        const mistakes = [];
        const answers = [];

        const items = getItems();

        items.forEach(item => {

            const number =
                item.dataset.question;

            const correct =
                item.dataset.answer;

            const select =
                item.querySelector(
                    ".reading-select"
                );

            const answer =
                select.value || "";

            answers.push(
                number +
                ":" +
                (answer || "-")
            );

            if (answer === correct) {

                score++;

                select.classList.add(
                    "correct"
                );

            } else {

                mistakes.push(number);

                select.classList.add(
                    "wrong"
                );

                const key =
                    document.createElement(
                        "div"
                    );

                key.className =
                    "reading-key";

                key.textContent =
                    "Correct: " + correct;

                item.appendChild(key);
            }
        });

        setDisabled(true);

        const result =
            score + "/" + items.length;

        const mistakesText =
            mistakes.length
                ? mistakes.join(", ")
                : "—";

        document.getElementById(
            "readingScore"
        ).textContent = result;

        document.getElementById(
            "readingMistakes"
        ).textContent =
            mistakes.length
                ? "Mistakes: " +
                  mistakes.join(", ")
                : "No mistakes";

        document.getElementById(
            "readingSaved"
        ).textContent =
            "Saving result...";

        document.getElementById(
            "readingResult"
        ).style.display = "block";

        document.getElementById(
            "readingCheck"
        ).style.display = "none";

        try {

            const response =
                await fetch(
                    R1_API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "text/plain;charset=utf-8"
                        },

                        body:
                            JSON.stringify({

                                student,
                                course: "EGE",
                                section: "R1",

                                taskId:
                                    READING_TASK.id,

                                result,

                                mistakes:
                                    mistakesText,

                                answers:
                                    answers.join(", ")
                            })
                    }
                );

            const data =
                await response.json();

            document.getElementById(
                "readingSaved"
            ).textContent =
                data.status === "success"
                    ? "Result saved · Attempt " +
                      data.attempt
                    : "Could not save result";

        } catch (error) {

            console.error(error);

            document.getElementById(
                "readingSaved"
            ).textContent =
                "Could not save result";
        }
    }
);


loadLastAttempt();