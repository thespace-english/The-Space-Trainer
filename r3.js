/* =========================================================
   THE SPACE — EGE READING 3 ENGINE
   Builds NEW R3 trainers from READING_TASK
   ========================================================= */

const R3_API_URL =
    "https://script.google.com/macros/s/AKfycbxxTEqdc_eAgBYhxPlAxGdD4ufwliTjwp3Rvc_leSns3wG6tnS1KKlCQABN2OYHZP1nTQ/exec";

const R3_PAGE_URL =
    "https://thespace-english.github.io/The-Space-Trainer/ege-r3.html";


/* =========================================================
   CHECK TASK DATA
   ========================================================= */

if (
    typeof READING_TASK === "undefined" ||
    !READING_TASK.id ||
    !READING_TASK.title ||
    !READING_TASK.text ||
    !Array.isArray(READING_TASK.questions)
) {
    throw new Error(
        "READING_TASK is incomplete"
    );
}


/* =========================================================
   STUDENT
   ========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

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


/* =========================================================
   CREATE PAGE
   ========================================================= */

const app =
    document.getElementById(
        "readingApp"
    );

app.innerHTML = `

    <div class="space-decor space-decor-medium"></div>
    <div class="space-decor space-decor-small"></div>

    <button
        class="reading-back"
        id="readingBack"
        type="button"
    >
        ← BACK TO R3
    </button>


    <div class="reading-page">

        <div class="reading-top">

            <div class="reading-label">
                EGE · R3 · ${READING_TASK.id}
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

                <div class="reading-text">
                    ${READING_TASK.text}
                </div>

            </section>


            <section class="reading-side">

                <div class="reading-side-title">
                    QUESTIONS
                </div>

                <form id="readingForm">

                    <div id="readingQuestions"></div>

                    <button
                        id="readingCheck"
                        class="reading-button"
                        type="submit"
                    >
                        CHECK ANSWERS
                    </button>

                </form>

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


/* =========================================================
   STUDENT LINE
   ========================================================= */

document.getElementById(
    "readingStudent"
).textContent =
    student
        ? "Student: " + student
        : "Student not selected";


/* =========================================================
   QUESTIONS
   ========================================================= */

const questionsContainer =
    document.getElementById(
        "readingQuestions"
    );

READING_TASK.questions.forEach(
    question => {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "reading-question";

        card.dataset.question =
            String(question.number);

        card.dataset.answer =
            String(question.answer);


        const optionsHtml =
            question.options
                .map(
                    (option, index) => `

                        <label class="reading-option">

                            <input
                                type="radio"
                                name="q${question.number}"
                                value="${index + 1}"
                            >

                            <span>
                                ${index + 1}) ${option}
                            </span>

                        </label>
                    `
                )
                .join("");


        card.innerHTML = `

            <span class="reading-question-title">
                ${question.number}. ${question.text}
            </span>

            ${optionsHtml}
        `;


        questionsContainer.appendChild(
            card
        );
    }
);


/* =========================================================
   BACK
   ========================================================= */

document.getElementById(
    "readingBack"
).addEventListener(
    "click",
    function () {

        if (
            window.history.length > 1
        ) {
            window.history.back();
            return;
        }

        let url =
            R3_PAGE_URL;

        if (student) {

            url +=
                "?student=" +
                encodeURIComponent(
                    student
                );
        }

        window.location.href =
            url;
    }
);


/* =========================================================
   HELPERS
   ========================================================= */

function getQuestionCards() {

    return document.querySelectorAll(
        ".reading-question"
    );
}


function clearStates() {

    document
        .querySelectorAll(
            ".reading-option"
        )
        .forEach(label => {

            label.classList.remove(
                "correct",
                "wrong"
            );
        });
}


function getSelected(card) {

    const selected =
        card.querySelector(
            'input[type="radio"]:checked'
        );

    return selected
        ? selected.value
        : "";
}


function setDisabled(value) {

    document
        .querySelectorAll(
            '.reading-question input[type="radio"]'
        )
        .forEach(input => {

            input.disabled =
                value;
        });
}


/* =========================================================
   OLD + NEW SAVED ANSWER FORMAT
   ========================================================= */

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

            if (
                separator === -1
            ) {
                return;
            }

            const question =
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

            answers[question] =
                answer === "-"
                    ? ""
                    : answer;
        });

    return answers;
}


/* =========================================================
   SHOW PREVIOUS ANSWER
   ========================================================= */

function showSavedAnswer(
    card,
    userAnswer
) {

    const correct =
        card.dataset.answer;

    card
        .querySelectorAll(
            ".reading-option"
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


/* =========================================================
   LAST ATTEMPT
   ========================================================= */

async function loadLastAttempt() {

    if (!student) {
        return;
    }

    try {

        const url =
            R3_API_URL +
            "?action=lastattempt" +
            "&student=" +
            encodeURIComponent(student) +
            "&course=EGE" +
            "&section=R3" +
            "&taskId=" +
            encodeURIComponent(
                READING_TASK.id
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

        const savedAnswers =
            parseAnswers(
                last.answers
            );


        clearStates();


        getQuestionCards()
            .forEach(card => {

                const number =
                    card.dataset.question;

                showSavedAnswer(
                    card,
                    savedAnswers[number] || ""
                );
            });


        setDisabled(true);


        document.getElementById(
            "readingCheck"
        ).style.display =
            "none";


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


/* =========================================================
   TRY AGAIN
   ========================================================= */

function tryAgain() {

    clearStates();


    document
        .querySelectorAll(
            '.reading-question input[type="radio"]'
        )
        .forEach(input => {

            input.checked =
                false;

            input.disabled =
                false;
        });


    document.getElementById(
        "readingReview"
    ).style.display =
        "none";


    document.getElementById(
        "readingResult"
    ).style.display =
        "none";


    document.getElementById(
        "readingCheck"
    ).style.display =
        "block";


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


/* =========================================================
   CHECK + SAVE
   ========================================================= */

document.getElementById(
    "readingForm"
).addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!student) {

            alert(
                "Please return to R3 and choose your name."
            );

            return;
        }


        clearStates();


        let score = 0;

        const mistakes = [];
        const answers = [];

        const cards =
            getQuestionCards();


        cards.forEach(
            card => {

                const number =
                    card.dataset.question;

                const correct =
                    card.dataset.answer;

                const selected =
                    getSelected(card);


                answers.push(
                    number +
                    ":" +
                    (
                        selected || "-"
                    )
                );


                card
                    .querySelectorAll(
                        ".reading-option"
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
                    selected ===
                    correct
                ) {

                    score++;

                } else {

                    mistakes.push(
                        number
                    );
                }
            }
        );


        setDisabled(true);


        const result =
            score +
            "/" +
            cards.length;


        const mistakesText =
            mistakes.length
                ? mistakes.join(", ")
                : "—";


        document.getElementById(
            "readingScore"
        ).textContent =
            result;


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
        ).style.display =
            "block";


        document.getElementById(
            "readingReview"
        ).style.display =
            "none";


        document.getElementById(
            "readingCheck"
        ).style.display =
            "none";


        try {

            const response =
                await fetch(
                    R3_API_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "text/plain;charset=utf-8"
                        },

                        body:
                            JSON.stringify({

                                student:
                                    student,

                                course:
                                    "EGE",

                                section:
                                    "R3",

                                taskId:
                                    READING_TASK.id,

                                result:
                                    result,

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


            document.getElementById(
                "readingSaved"
            ).textContent =
                data.status ===
                    "success"
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


/* =========================================================
   START
   ========================================================= */

loadLastAttempt();
