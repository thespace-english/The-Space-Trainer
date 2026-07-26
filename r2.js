/* =========================================================
   THE SPACE — EGE READING 2 ENGINE
   Builds NEW R2 trainers from READING_TASK
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

const R2_API_URL =
    "https://script.google.com/macros/s/AKfycbxxTEqdc_eAgBYhxPlAxGdD4ufwliTjwp3Rvc_leSns3wG6tnS1KKlCQABN2OYHZP1nTQ/exec";

const R2_PAGE_URL =
    "https://thespace-english.github.io/The-Space-Trainer/ege-r2.html";


/* CHECK DATA */

if (
    typeof READING_TASK === "undefined" ||
    !READING_TASK.id ||
    !READING_TASK.title ||
    !READING_TASK.text ||
    !Array.isArray(READING_TASK.options) ||
    !READING_TASK.answers
) {
    throw new Error(
        "READING_TASK is incomplete"
    );
}


/* STUDENT */

const params =
    new URLSearchParams(
        window.location.search
    );

let student =
    params.get("student") ||
    localStorage.getItem(
        "theSpaceStudent"
    ) ||
    "";

if (student) {
    localStorage.setItem(
        "theSpaceStudent",
        student
    );
}


/* CREATE PAGE */

const app =
    document.getElementById(
        "readingApp"
    );

app.innerHTML = `

    <div class="space-decor space-decor-medium"></div>
    <div class="space-decor space-decor-small"></div>

    <button
        id="readingBack"
        class="reading-back"
        type="button"
    >
        ← BACK TO R2
    </button>


    <div class="reading-page">

        <div class="reading-top">

            <div class="reading-label">
                EGE · R2 · ${READING_TASK.id}
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

                <h2 class="reading-text-title">
                    ${READING_TASK.title}
                </h2>

                <div
                    id="readingText"
                    class="reading-text"
                ></div>

            </section>


            <section class="reading-side">

                <div class="reading-side-title">
                    SENTENCE PARTS
                </div>

                <div id="readingOptions"></div>

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


/* OPTIONS */

const optionsBox =
    document.getElementById(
        "readingOptions"
    );

READING_TASK.options.forEach(
    (option, index) => {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "reading-question";

        item.innerHTML = `
            <span class="reading-question-title">
                ${index + 1}. ${option}
            </span>
        `;

        optionsBox.appendChild(item);
    }
);


/* CREATE GAP */

function createGap(letter) {

    const correct =
        String(
            READING_TASK.answers[letter]
        );

    let options =
        `<option value="">—</option>`;

    READING_TASK.options.forEach(
        (_, index) => {

            const value =
                index + 1;

            options += `
                <option value="${value}">
                    ${value}
                </option>
            `;
        }
    );

    return `
        <span
            class="reading-gap"
            data-question="${letter}"
            data-answer="${correct}"
        >
            <span class="reading-gap-letter">
                ${letter}
            </span>

            <select class="reading-select">
                ${options}
            </select>
        </span>
    `;
}


/* TEXT
   Use {{A}}, {{B}}, {{C}} etc.
*/

let preparedText =
    READING_TASK.text;

Object.keys(
    READING_TASK.answers
).forEach(letter => {

    preparedText =
        preparedText.replaceAll(
            "{{" + letter + "}}",
            createGap(letter)
        );
});

document.getElementById(
    "readingText"
).innerHTML =
    preparedText;


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

        let url =
            R2_PAGE_URL;

        if (student) {

            url +=
                "?student=" +
                encodeURIComponent(student);
        }

        window.location.href = url;
    }
);


/* HELPERS */

function getGaps() {

    return document.querySelectorAll(
        ".reading-gap[data-question]"
    );
}


function clearStates() {

    document
        .querySelectorAll(
            ".reading-select"
        )
        .forEach(select => {

            select.classList.remove(
                "correct",
                "wrong"
            );
        });

    document
        .querySelectorAll(
            ".reading-key"
        )
        .forEach(key => key.remove());
}


function setDisabled(value) {

    document
        .querySelectorAll(
            ".reading-select"
        )
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
                    .toUpperCase()
                    .replace(/^Q/i, "");

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
            R2_API_URL +
            "?action=lastattempt" +
            "&student=" +
            encodeURIComponent(student) +
            "&course=EGE" +
            "&section=R2" +
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
            parseAnswers(
                last.answers
            );

        getGaps().forEach(gap => {

            const letter =
                gap.dataset.question;

            const correct =
                gap.dataset.answer;

            const answer =
                answers[letter] || "";

            const select =
                gap.querySelector(
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
                        "span"
                    );

                key.className =
                    "reading-key";

                key.textContent =
                    "Correct: " + correct;

                gap.appendChild(key);
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
        ).style.display =
            "block";

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
        .querySelectorAll(
            ".reading-select"
        )
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
                "Please return to R2 and choose your name."
            );

            return;
        }

        clearStates();

        let score = 0;

        const mistakes = [];
        const answers = [];

        const gaps = getGaps();

        gaps.forEach(gap => {

            const letter =
                gap.dataset.question;

            const correct =
                gap.dataset.answer;

            const select =
                gap.querySelector(
                    ".reading-select"
                );

            const answer =
                select.value || "";

            answers.push(
                letter +
                ":" +
                (answer || "-")
            );

            if (answer === correct) {

                score++;

                select.classList.add(
                    "correct"
                );

            } else {

                mistakes.push(letter);

                select.classList.add(
                    "wrong"
                );

                const key =
                    document.createElement(
                        "span"
                    );

                key.className =
                    "reading-key";

                key.textContent =
                    "Correct: " + correct;

                gap.appendChild(key);
            }
        });

        setDisabled(true);

        const result =
            score + "/" + gaps.length;

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
                    R2_API_URL,
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
                                section: "R2",

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