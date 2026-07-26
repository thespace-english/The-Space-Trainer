/* =========================================
   THE SPACE — EGE READING 3 ENGINE
========================================= */

const R3_API_URL =
    "https://script.google.com/macros/s/AKfycbxxTEqdc_eAgBYhxPlAxGdD4ufwliTjwp3Rvc_leSns3wG6tnS1KKlCQABN2OYHZP1nTQ/exec";

const R3_COURSE = "EGE";
const R3_SECTION = "R3";

const R3_PAGE_URL =
    "https://thespace-english.github.io/The-Space-Trainer/ege-r3.html";


/* STUDENT */

const r3Params =
    new URLSearchParams(
        window.location.search
    );

let r3Student =
    r3Params.get("student") || "";

if (!r3Student) {
    r3Student =
        localStorage.getItem(
            "theSpaceStudent"
        ) || "";
}

if (r3Student) {
    localStorage.setItem(
        "theSpaceStudent",
        r3Student
    );
}

const studentElement =
    document.getElementById(
        "r3Student"
    );

if (studentElement) {
    studentElement.textContent =
        r3Student
            ? "Student: " + r3Student
            : "Student not selected";
}


/* BACK */

function r3Back() {

    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    let url =
        R3_PAGE_URL;

    if (r3Student) {
        url +=
            "?student=" +
            encodeURIComponent(
                r3Student
            );
    }

    window.location.href =
        url;
}


/* HELPERS */

function r3Questions() {
    return document.querySelectorAll(
        ".r3-question"
    );
}


function r3ClearStates() {

    document
        .querySelectorAll(
            ".r3-option"
        )
        .forEach(label => {

            label.classList.remove(
                "correct",
                "wrong"
            );

        });
}


function r3Selected(card) {

    const input =
        card.querySelector(
            'input[type="radio"]:checked'
        );

    return input
        ? input.value
        : "";
}


function r3SetDisabled(value) {

    document
        .querySelectorAll(
            '.r3-question input[type="radio"]'
        )
        .forEach(input => {

            input.disabled =
                value;

        });
}


/* OLD + NEW ANSWER FORMAT */

function r3ParseAnswers(text) {

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


/* SHOW SAVED ATTEMPT */

function r3ShowSaved(
    card,
    userAnswer
) {

    const correct =
        card.dataset.answer;

    card
        .querySelectorAll(
            ".r3-option"
        )
        .forEach(label => {

            const input =
                label.querySelector(
                    "input"
                );

            if (
                input.value ===
                userAnswer
            ) {
                input.checked =
                    true;
            }

            if (
                input.value ===
                correct
            ) {
                label.classList.add(
                    "correct"
                );
            }

            if (
                input.value ===
                    userAnswer &&
                userAnswer !==
                    correct
            ) {
                label.classList.add(
                    "wrong"
                );
            }

        });
}


/* LOAD LAST ATTEMPT */

async function r3LoadLastAttempt() {

    if (
        !r3Student ||
        typeof TASK_ID ===
            "undefined"
    ) {
        return;
    }

    try {

        const url =
            R3_API_URL +
            "?action=lastattempt" +
            "&student=" +
            encodeURIComponent(
                r3Student
            ) +
            "&course=" +
            R3_COURSE +
            "&section=" +
            R3_SECTION +
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
            r3ParseAnswers(
                last.answers
            );

        r3ClearStates();

        r3Questions()
            .forEach(card => {

                const number =
                    card.dataset.question;

                r3ShowSaved(
                    card,
                    answers[number] || ""
                );

            });

        r3SetDisabled(true);

        const checkButton =
            document.getElementById(
                "r3Check"
            );

        if (checkButton) {
            checkButton.style.display =
                "none";
        }

        const review =
            document.getElementById(
                "r3Review"
            );

        const details =
            document.getElementById(
                "r3ReviewDetails"
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


/* TRY AGAIN */

function r3TryAgain() {

    r3ClearStates();

    document
        .querySelectorAll(
            '.r3-question input[type="radio"]'
        )
        .forEach(input => {

            input.checked =
                false;

        });

    r3SetDisabled(false);

    const review =
        document.getElementById(
            "r3Review"
        );

    const result =
        document.getElementById(
            "r3Result"
        );

    const check =
        document.getElementById(
            "r3Check"
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

    const text =
        document.querySelector(
            ".r3-text"
        );

    const questions =
        document.querySelector(
            ".r3-questions"
        );

    if (text) {
        text.scrollTop = 0;
    }

    if (questions) {
        questions.scrollTop = 0;
    }
}


/* CHECK */

async function r3CheckAnswers() {

    if (!r3Student) {

        alert(
            "Please return to R3 and choose your name."
        );

        return;
    }

    r3ClearStates();

    let score = 0;

    const mistakes = [];
    const answers = [];

    const cards =
        r3Questions();

    cards.forEach(card => {

        const number =
            card.dataset.question;

        const correct =
            card.dataset.answer;

        const selected =
            r3Selected(card);

        answers.push(
            number +
            ":" +
            (
                selected ||
                "-"
            )
        );

        card
            .querySelectorAll(
                ".r3-option"
            )
            .forEach(label => {

                const input =
                    label.querySelector(
                        "input"
                    );

                if (
                    input.value ===
                    correct
                ) {
                    label.classList.add(
                        "correct"
                    );
                }

                if (
                    input.value ===
                        selected &&
                    selected !==
                        correct
                ) {
                    label.classList.add(
                        "wrong"
                    );
                }

            });

        if (
            selected === correct
        ) {
            score++;
        } else {
            mistakes.push(
                number
            );
        }

    });

    r3SetDisabled(true);

    const resultText =
        score +
        "/" +
        cards.length;

    const mistakesText =
        mistakes.length
            ? mistakes.join(", ")
            : "—";

    document.getElementById(
        "r3Score"
    ).textContent =
        resultText;

    document.getElementById(
        "r3Mistakes"
    ).textContent =
        mistakes.length
            ? "Mistakes: " +
              mistakes.join(", ")
            : "No mistakes";

    document.getElementById(
        "r3Saved"
    ).textContent =
        "Saving result...";

    document.getElementById(
        "r3Result"
    ).style.display =
        "block";

    document.getElementById(
        "r3Check"
    ).style.display =
        "none";

    try {

        const response =
            await fetch(
                R3_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({

                            student:
                                r3Student,

                            course:
                                R3_COURSE,

                            section:
                                R3_SECTION,

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

            document.getElementById(
                "r3Saved"
            ).textContent =
                "Result saved · Attempt " +
                data.attempt;

        } else {

            document.getElementById(
                "r3Saved"
            ).textContent =
                "Could not save result";
        }

    } catch (error) {

        console.error(error);

        document.getElementById(
            "r3Saved"
        ).textContent =
            "Could not save result";
    }
}


/* FORM */

const r3Form =
    document.getElementById(
        "r3Form"
    );

if (r3Form) {

    r3Form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            r3CheckAnswers();
        }
    );
}


/* START */

r3LoadLastAttempt();