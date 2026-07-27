/* =========================================================
   THE SPACE — WRITING ENGINE
   EGE Writing 37 / 38
   ========================================================= */

const WRITING_API_URL =
    "https://script.google.com/macros/s/AKfycbxxTEqdc_eAgBYhxPlAxGdD4ufwliTjwp3Rvc_leSns3wG6tnS1KKlCQABN2OYHZP1nTQ/exec";


const WRITING_WORD_LIMITS = {
    min: 90,
    max: 154
};


/* =========================================================
   STATE
   ========================================================= */

let writingOriginalText = "";
let writingWordCount = 0;


/* =========================================================
   STUDENT
   ========================================================= */

function writingGetStudent() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("student") ||
        localStorage.getItem(
            "theSpaceStudent"
        ) ||
        ""
    ).trim();
}


/* =========================================================
   WORD COUNT
   ========================================================= */

function writingCountWords(text) {

    const clean =
        String(text || "")
            .trim();

    if (!clean) {
        return 0;
    }

    return clean
        .split(/\s+/)
        .filter(Boolean)
        .length;
}


function writingUpdateCounter() {

    const textarea =
        document.getElementById(
            "writingAnswer"
        );

    const counter =
        document.getElementById(
            "writingCounter"
        );

    const number =
        document.getElementById(
            "writingCounterNumber"
        );

    if (
        !textarea ||
        !counter ||
        !number
    ) {
        return;
    }


    writingWordCount =
        writingCountWords(
            textarea.value
        );


    number.textContent =
        writingWordCount;


    const inRange =
        writingWordCount >=
            WRITING_WORD_LIMITS.min &&
        writingWordCount <=
            WRITING_WORD_LIMITS.max;


    counter.classList.toggle(
        "ok",
        inRange
    );
}


/* =========================================================
   ESCAPE
   ========================================================= */

function writingEscape(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   BUILD PAGE
   ========================================================= */

function writingBuild() {

    if (
        typeof WRITING_TASK ===
        "undefined"
    ) {

        throw new Error(
            "WRITING_TASK is not defined"
        );
    }


    const student =
        writingGetStudent();


    const app =
        document.getElementById(
            "writingApp"
        );


    app.innerHTML = `

    <div class="space-decor space-decor-medium"></div>
<div class="space-decor space-decor-small"></div>

        <div class="writing-shell">

            <a
    class="writing-back"
    href="${WRITING_TASK.backUrl || '#'}"
>
    ← BACK TO WRITING
</a>


            <div class="writing-topbar">

    <div class="writing-meta">

        <div class="writing-kicker">
            EGE · ${writingEscape(
                WRITING_TASK.type ||
                "W1"
            )}
            ·
            ${writingEscape(
                WRITING_TASK.id ||
                ""
            )}
        </div>

        <h1 class="writing-title">
            ${writingEscape(
                WRITING_TASK.title ||
                ""
            )}
        </h1>

        <div class="writing-student-inline">
            Student:
            ${writingEscape(
                student ||
                "Not selected"
            )}
        </div>

    </div>

</div>


            <div class="writing-layout">

                <main class="writing-card">

                    <div class="writing-task-label">
                        TASK
                    </div>

                    <div class="writing-task-text">
                        ${WRITING_TASK.taskText || ""}
                    </div>


                    <div class="writing-answer-title">
                        YOUR ANSWER
                    </div>

                    <textarea
                        id="writingAnswer"
                        class="writing-textarea"
                        placeholder="Write your answer here..."
                        spellcheck="true"
                    ></textarea>


                    <div
                        id="writingResultArea"
                    ></div>

                </main>


                <aside
                    class="writing-card writing-side"
                >

                    <div class="writing-side-title">
                        WRITING
                    </div>


                    <div
                        id="writingCounter"
                        class="writing-counter"
                    >

                        <div
                            id="writingCounterNumber"
                            class="writing-counter-number"
                        >
                            0
                        </div>

                        <div class="writing-counter-label">
                            WORDS
                        </div>

                        <div class="writing-counter-range">
                            Allowed range:
                            ${WRITING_WORD_LIMITS.min}–${WRITING_WORD_LIMITS.max}
                        </div>

                    </div>


                    <button
                        id="writingSubmit"
                        class="writing-button"
                        type="button"
                    >
                        SUBMIT
                    </button>

                </aside>

            </div>

        </div>


        
        <img
    src="https://thespace-english.github.io/The-Space-Trainer/logo.png"
    class="platform-corner-logo"
    alt="The Space English Online"
>

    `;


    const textarea =
        document.getElementById(
            "writingAnswer"
        );


    textarea.addEventListener(
        "input",
        writingUpdateCounter
    );


    document
        .getElementById(
            "writingSubmit"
        )
        .addEventListener(
            "click",
            writingSubmit
        );


    writingUpdateCounter();
}


/* =========================================================
   SUBMIT
   ========================================================= */

async function writingSubmit() {

    const student =
        writingGetStudent();


    if (!student) {

        alert(
            "Student is not selected."
        );

        return;
    }


    const textarea =
        document.getElementById(
            "writingAnswer"
        );


    const submitButton =
        document.getElementById(
            "writingSubmit"
        );


    const text =
        textarea.value;


    if (!text.trim()) {

        alert(
            "Write your answer first."
        );

        return;
    }


    /*
       IMPORTANT:
       This is the student's ORIGINAL.
       We never edit or replace it.
    */

    writingOriginalText =
        text;

    writingWordCount =
        writingCountWords(
            writingOriginalText
        );


    submitButton.disabled =
        true;

    submitButton.textContent =
        "SUBMITTING...";


    try {

        const payload = {

            action:
                "writingSubmit",

            student:
                student,

            course:
                "EGE",

            section:
                WRITING_TASK.type ||
                "W1",

            taskId:
                WRITING_TASK.id,

            title:
                WRITING_TASK.title ||
                "",

            originalText:
                writingOriginalText,

            wordCount:
                writingWordCount
        };


        const response =
            await fetch(
                WRITING_API_URL,
                {
                    method:
                        "POST",

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
                "Could not save writing."
            );
        }


        writingShowSubmitted(
            data
        );


    } catch (error) {

        console.error(
            error
        );


        alert(
            "Could not save your writing."
        );


        submitButton.disabled =
            false;

        submitButton.textContent =
            "SUBMIT";
    }
}


/* =========================================================
   AFTER SUBMISSION
   ========================================================= */

function writingShowSubmitted(
    data
) {

    const textarea =
        document.getElementById(
            "writingAnswer"
        );


    const submitButton =
        document.getElementById(
            "writingSubmit"
        );


    textarea.style.display =
        "none";


    submitButton.style.display =
        "none";


    const area =
        document.getElementById(
            "writingResultArea"
        );


    area.innerHTML = `

        <div class="writing-review">

            <div class="writing-review-title">
                YOUR ORIGINAL ANSWER
            </div>

            <div class="writing-original">
${writingEscape(
    writingOriginalText
)}
            </div>


            <div class="writing-status">

                ${
                    data.aiReviewReady
                        ? "Проверено ИИ. Требует уточнения преподавателя."
                        : "Работа отправлена. Ожидает автоматической проверки."
                }

            </div>

        </div>
    `;


    /*
       When AI review is connected,
       it will be rendered separately here.

       The original student text above
       remains unchanged forever.
    */

    if (data.aiReview) {

        writingRenderAIReview(
            data.aiReview
        );
    }
}


/* =========================================================
   AI REVIEW DISPLAY
   AI DOES NOT GIVE SCORE
   ========================================================= */

function writingRenderAIReview(
    review
) {

    const area =
        document.getElementById(
            "writingResultArea"
        );


    const aspects =
        Array.isArray(
            review.aspects
        )
            ? review.aspects
            : [];


    const errors =
        Array.isArray(
            review.languageErrors
        )
            ? review.languageErrors
            : [];


    let html = `

        <div class="writing-review">

            <div class="writing-review-title">
                TASK ACHIEVEMENT
            </div>
    `;


    aspects.forEach(
        aspect => {

            html += `

                <div class="writing-aspect">

                    <div class="writing-aspect-head">

                        <div class="writing-aspect-mark">
                            ${writingEscape(
                                aspect.mark ||
                                ""
                            )}
                        </div>

                        <div class="writing-aspect-name">
                            ${writingEscape(
                                aspect.name ||
                                ""
                            )}
                        </div>

                    </div>

                    ${
                        aspect.comment
                            ? `
                                <div class="writing-aspect-comment">
                                    ${writingEscape(
                                        aspect.comment
                                    )}
                                </div>
                            `
                            : ""
                    }

                </div>
            `;
        }
    );


    html += `

        </div>


        <div class="writing-review">

            <div class="writing-review-title">
                LANGUAGE
            </div>
    `;


    if (!errors.length) {

        html += `

            <div class="writing-error">
                Языковые ошибки не отмечены.
            </div>
        `;

    } else {

        errors.forEach(
            error => {

                html += `

                    <div class="writing-error">

                        <div class="writing-error-fragment">
                            ${writingEscape(
                                error.fragment ||
                                ""
                            )}
                        </div>

                        <div class="writing-error-comment">
                            ${writingEscape(
                                error.comment ||
                                ""
                            )}
                        </div>

                    </div>
                `;
            }
        );
    }


    html += `
        </div>
    `;


    area.insertAdjacentHTML(
        "beforeend",
        html
    );
}


/* =========================================================
   TEACHER FINAL REVIEW
   ========================================================= */

function writingRenderTeacherFinal(
    teacherComment,
    score
) {

    const area =
        document.getElementById(
            "writingResultArea"
        );


    const oldStatus =
        area.querySelector(
            ".writing-status"
        );


    if (oldStatus) {
        oldStatus.remove();
    }


    area.insertAdjacentHTML(
        "beforeend",
        `

        <div class="writing-teacher-comment">

            <div class="writing-teacher-label">
                КОММЕНТАРИЙ ПРЕПОДАВАТЕЛЯ
            </div>

            <div class="writing-teacher-text">
                ${writingEscape(
                    teacherComment || ""
                )}
            </div>

            <div class="writing-final-score">
                Результат:
                ${writingEscape(
                    score || ""
                )}
            </div>

        </div>
        `
    );
}


/* =========================================================
   START
   ========================================================= */

writingBuild();