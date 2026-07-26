/* =========================================================
   THE SPACE — EGE READING 2 ENGINE
   For NEW R2 trainers only
   ========================================================= */


/* ---------- PLATFORM ---------- */

const R2_API_URL =
    "https://script.google.com/macros/s/AKfycbxxTEqdc_eAgBYhxPlAxGdD4ufwliTjwp3Rvc_leSns3wG6tnS1KKlCQABN2OYHZP1nTQ/exec";

const R2_COURSE = "EGE";
const R2_SECTION = "R2";

const R2_PAGE_URL =
    "https://thespace-english.github.io/The-Space-Trainer/ege-r2.html";


/* ---------- STUDENT ---------- */

const r2Params =
    new URLSearchParams(
        window.location.search
    );

let r2Student =
    r2Params.get("student") || "";

if (!r2Student) {

    r2Student =
        localStorage.getItem(
            "theSpaceStudent"
        ) || "";
}

if (r2Student) {

    localStorage.setItem(
        "theSpaceStudent",
        r2Student
    );
}

const r2StudentElement =
    document.getElementById(
        "readingStudent"
    );

if (r2StudentElement) {

    r2StudentElement.textContent =
        r2Student
            ? "Student: " + r2Student
            : "Student not selected";
}


/* ---------- BACK ---------- */

function readingBack() {

    if (window.history.length > 1) {

        window.history.back();
        return;
    }

    let url =
        R2_PAGE_URL;

    if (r2Student) {

        url +=
            "?student=" +
            encodeURIComponent(
                r2Student
            );
    }

    window.location.href =
        url;
}


/* ---------- HELPERS ---------- */

function r2Gaps() {

    return document.querySelectorAll(
        ".reading-gap"
    );
}


function r2ClearStates() {

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
        .forEach(key => {

            key.remove();
        });
}


function r2GetAnswer(gap) {

    const select =
        gap.querySelector(
            ".reading-select"
        );

    if (!select) {
        return "";
    }

    return select.value || "";
}


function r2SetDisabled(value) {

    document
        .querySelectorAll(
            ".reading-select"
        )
        .forEach(select => {

            select.disabled =
                value;
        });
}


/* ---------- PARSE OLD + NEW ANSWERS ---------- */

function r2ParseAnswers(text) {

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
                    .slice(
                        0,
                        separator
                    )
                    .trim()
                    .toUpperCase()
                    .replace(
                        /^Q/i,
                        ""
                    );

            const answer =
                part
                    .slice(
                        separator + 1
                    )
                    .trim();

            answers[key] =
                answer === "-"
                    ? ""
                    : answer;
        });

    return answers;
}


/* ---------- SHOW SAVED ATTEMPT ---------- */

function r2ShowSaved(
    gap,
    userAnswer
) {

    const correct =
        gap.dataset.answer;

    const select =
        gap.querySelector(
            ".reading-select"
        );

    if (!select) {
        return;
    }

    select.value =
        userAnswer || "";

    if (
        userAnswer ===
        correct
    ) {

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
            "Correct: " +
            correct;

        gap.appendChild(
            key
        );
    }
}


/* ---------- LOAD LAST ATTEMPT ---------- */

async function r2LoadLastAttempt() {

    if (
        !r2Student ||
        typeof TASK_ID ===
            "undefined"
    ) {
        return;
    }

    try {

        const url =
            R2_API_URL +
            "?action=lastattempt" +
            "&student=" +
            encodeURIComponent(
                r2Student
            ) +
            "&course=" +
            R2_COURSE +
            "&section=" +
            R2_SECTION +
            "&taskId=" +
            encodeURIComponent(
                TASK_ID
            );

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (
            data.status !==
                "success" ||
            !data.found ||
            !data.lastAttempt
        ) {
            return;
        }

        const last =
            data.lastAttempt;

        const answers =
            r2ParseAnswers(
                last.answers
            );

        r2ClearStates();

        r2Gaps()
            .forEach(gap => {

                const letter =
                    gap.dataset.question;

                r2ShowSaved(
                    gap,
                    answers[letter] || ""
                );
            });

        r2SetDisabled(true);

        const checkButton =
            document.getElementById(
                "readingCheck"
            );

        if (checkButton) {

            checkButton.style.display =
                "none";
        }

        const review =
            document.getElementById(
                "readingReview"
            );

        const details =
            document.getElementById(
                "readingReviewDetails"
            );

        if (
            review &&
            details
        ) {

            details.textContent =
                "Attempt " +
                last.attempt +
                " · " +
                last.result;

            review.style.display =
                "block";
        }

    } catch (error) {

        console.error(
            "Could not load last attempt",
            error
        );
    }
}


/* ---------- TRY AGAIN ---------- */

function readingTryAgain() {

    r2ClearStates();

    document
        .querySelectorAll(
            ".reading-select"
        )
        .forEach(select => {

            select.value = "";
            select.disabled = false;
        });

    const review =
        document.getElementById(
            "readingReview"
        );

    const result =
        document.getElementById(
            "readingResult"
        );

    const check =
        document.getElementById(
            "readingCheck"
        );

    if (review) {
        review.style.display =
            "none";
    }

    if (result) {
        result.style.display =
            "none";
    }

    if (check) {
        check.style.display =
            "block";
    }

    const main =
        document.querySelector(
            ".reading-main"
        );

    const side =
        document.querySelector(
            ".reading-side"
        );

    if (main) {
        main.scrollTop = 0;
    }

    if (side) {
        side.scrollTop = 0;
    }
}


/* ---------- CHECK ---------- */

async function r2CheckAnswers() {

    if (!r2Student) {

        alert(
            "Please return to R2 and choose your name."
        );

        return;
    }

    if (
        typeof TASK_ID ===
        "undefined"
    ) {

        console.error(
            "TASK_ID is not defined"
        );

        return;
    }

    r2ClearStates();

    let score = 0;

    const mistakes = [];
    const answers = [];

    const gaps =
        r2Gaps();

    gaps.forEach(gap => {

        const letter =
            gap.dataset.question;

        const correct =
            gap.dataset.answer;

        const answer =
            r2GetAnswer(gap);

        answers.push(
            letter +
            ":" +
            (
                answer ||
                "-"
            )
        );

        const select =
            gap.querySelector(
                ".reading-select"
            );

        if (
            answer ===
            correct
        ) {

            score++;

            if (select) {
                select.classList.add(
                    "correct"
                );
            }

        } else {

            mistakes.push(
                letter
            );

            if (select) {
                select.classList.add(
                    "wrong"
                );
            }

            const key =
                document.createElement(
                    "span"
                );

            key.className =
                "reading-key";

            key.textContent =
                "Correct: " +
                correct;

            gap.appendChild(
                key
            );
        }

    });

    r2SetDisabled(true);

    const resultText =
        score +
        "/" +
        gaps.length;

    const mistakesText =
        mistakes.length
            ? mistakes.join(", ")
            : "—";

    const scoreElement =
        document.getElementById(
            "readingScore"
        );

    const mistakesElement =
        document.getElementById(
            "readingMistakes"
        );

    const savedElement =
        document.getElementById(
            "readingSaved"
        );

    const resultCard =
        document.getElementById(
            "readingResult"
        );

    const checkButton =
        document.getElementById(
            "readingCheck"
        );

    if (scoreElement) {
        scoreElement.textContent =
            resultText;
    }

    if (mistakesElement) {

        mistakesElement.textContent =
            mistakes.length
                ? "Mistakes: " +
                  mistakes.join(", ")
                : "No mistakes";
    }

    if (savedElement) {

        savedElement.textContent =
            "Saving result...";
    }

    if (resultCard) {

        resultCard.style.display =
            "block";
    }

    if (checkButton) {

        checkButton.style.display =
            "none";
    }

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

                            student:
                                r2Student,

                            course:
                                R2_COURSE,

                            section:
                                R2_SECTION,

                            taskId:
                                TASK_ID,

                            result:
                                resultText,

                            mistakes:
                                mistakesText,

                            answers:
                                answers.join(
                                    ", "
                                )
                        })
                }
            );

        const data =
            await response.json();

        if (
            data.status ===
            "success"
        ) {

            if (savedElement) {

                savedElement.textContent =
                    "Result saved · Attempt " +
                    data.attempt;
            }

        } else {

            if (savedElement) {

                savedElement.textContent =
                    "Could not save result";
            }
        }

    } catch (error) {

        console.error(error);

        if (savedElement) {

            savedElement.textContent =
                "Could not save result";
        }
    }
}


/* ---------- FORM ---------- */

const r2Form =
    document.getElementById(
        "readingForm"
    );

if (r2Form) {

    r2Form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            r2CheckAnswers();
        }
    );
}


/* ---------- START ---------- */

r2LoadLastAttempt();