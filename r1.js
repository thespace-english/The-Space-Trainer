/* =========================================================
   THE SPACE — EGE READING 1 ENGINE
   For NEW R1 trainers only
   ========================================================= */


/* ---------- PLATFORM ---------- */

const R1_API_URL =
    "https://script.google.com/macros/s/AKfycbxxTEqdc_eAgBYhxPlAxGdD4ufwliTjwp3Rvc_leSns3wG6tnS1KKlCQABN2OYHZP1nTQ/exec";

const R1_COURSE = "EGE";
const R1_SECTION = "R1";

const R1_PAGE_URL =
    "https://thespace-english.github.io/The-Space-Trainer/ege-r1.html";


/* ---------- STUDENT ---------- */

const r1Params =
    new URLSearchParams(
        window.location.search
    );

let r1Student =
    r1Params.get("student") || "";

if (!r1Student) {

    r1Student =
        localStorage.getItem(
            "theSpaceStudent"
        ) || "";
}

if (r1Student) {

    localStorage.setItem(
        "theSpaceStudent",
        r1Student
    );
}

const r1StudentElement =
    document.getElementById(
        "readingStudent"
    );

if (r1StudentElement) {

    r1StudentElement.textContent =
        r1Student
            ? "Student: " + r1Student
            : "Student not selected";
}


/* ---------- BACK ---------- */

function readingBack() {

    if (window.history.length > 1) {

        window.history.back();
        return;
    }

    let url =
        R1_PAGE_URL;

    if (r1Student) {

        url +=
            "?student=" +
            encodeURIComponent(
                r1Student
            );
    }

    window.location.href =
        url;
}


/* ---------- HELPERS ---------- */

function r1Cards() {

    return document.querySelectorAll(
        ".reading-question"
    );
}


function r1ClearStates() {

    document
        .querySelectorAll(
            ".reading-question"
        )
        .forEach(card => {

            card.classList.remove(
                "correct",
                "wrong"
            );

            const oldKey =
                card.querySelector(
                    ".reading-key"
                );

            if (oldKey) {
                oldKey.remove();
            }

        });
}


function r1GetAnswer(card) {

    const select =
        card.querySelector(
            ".reading-select"
        );

    if (!select) {
        return "";
    }

    return select.value || "";
}


function r1SetDisabled(value) {

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

function r1ParseAnswers(text) {

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

            const number =
                part
                    .slice(
                        0,
                        separator
                    )
                    .trim()
                    .replace(
                        /^q/i,
                        ""
                    );

            const answer =
                part
                    .slice(
                        separator + 1
                    )
                    .trim();

            answers[number] =
                answer === "-"
                    ? ""
                    : answer;
        });

    return answers;
}


/* ---------- SHOW SAVED ATTEMPT ---------- */

function r1ShowSaved(
    card,
    userAnswer
) {

    const correct =
        card.dataset.answer;

    const select =
        card.querySelector(
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

        card.classList.add(
            "correct"
        );

    } else {

        card.classList.add(
            "wrong"
        );

        const key =
            document.createElement(
                "div"
            );

        key.className =
            "reading-key";

        key.textContent =
            "Correct: " +
            correct;

        card.appendChild(
            key
        );
    }
}


/* ---------- LOAD LAST ATTEMPT ---------- */

async function r1LoadLastAttempt() {

    if (
        !r1Student ||
        typeof TASK_ID ===
            "undefined"
    ) {
        return;
    }

    try {

        const url =
            R1_API_URL +
            "?action=lastattempt" +
            "&student=" +
            encodeURIComponent(
                r1Student
            ) +
            "&course=" +
            R1_COURSE +
            "&section=" +
            R1_SECTION +
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
            r1ParseAnswers(
                last.answers
            );

        r1ClearStates();

        r1Cards()
            .forEach(card => {

                const number =
                    card.dataset.question;

                r1ShowSaved(
                    card,
                    answers[number] || ""
                );
            });

        r1SetDisabled(true);

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

    r1ClearStates();

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

async function r1CheckAnswers() {

    if (!r1Student) {

        alert(
            "Please return to R1 and choose your name."
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

    r1ClearStates();

    let score = 0;

    const mistakes = [];
    const answers = [];

    const cards =
        r1Cards();

    cards.forEach(card => {

        const number =
            card.dataset.question;

        const correct =
            card.dataset.answer;

        const answer =
            r1GetAnswer(card);

        answers.push(
            number +
            ":" +
            (
                answer ||
                "-"
            )
        );

        if (
            answer ===
            correct
        ) {

            score++;

            card.classList.add(
                "correct"
            );

        } else {

            mistakes.push(
                number
            );

            card.classList.add(
                "wrong"
            );

            const key =
                document.createElement(
                    "div"
                );

            key.className =
                "reading-key";

            key.textContent =
                "Correct: " +
                correct;

            card.appendChild(
                key
            );
        }

    });

    r1SetDisabled(true);

    const resultText =
        score +
        "/" +
        cards.length;

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
                R1_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({

                            student:
                                r1Student,

                            course:
                                R1_COURSE,

                            section:
                                R1_SECTION,

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

const r1Form =
    document.getElementById(
        "readingForm"
    );

if (r1Form) {

    r1Form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            r1CheckAnswers();
        }
    );
}


/* ---------- START ---------- */

r1LoadLastAttempt();