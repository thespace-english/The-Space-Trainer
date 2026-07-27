/* =========================================================
   THE SPACE — EGE WRITING ENGINE
   W1 = Task 37
   ========================================================= */


/* =========================================================
   TASK CHECK
   ========================================================= */

if (
    typeof WRITING_TASK === "undefined" ||
    !WRITING_TASK.id ||
    !WRITING_TASK.type ||
    !WRITING_TASK.title ||
    !WRITING_TASK.taskHtml
) {
    throw new Error(
        "WRITING_TASK is incomplete"
    );
}


const WRITING_TYPE =
    String(
        WRITING_TASK.type
    ).toUpperCase();


/* =========================================================
   STUDENT
   Same logic as Speaking
   ========================================================= */

const writingParams =
    new URLSearchParams(
        window.location.search
    );


let writingStudent =
    writingParams.get("student") ||
    localStorage.getItem(
        "theSpaceStudent"
    ) ||
    "";


if (writingStudent) {
    localStorage.setItem(
        "theSpaceStudent",
        writingStudent
    );
}


/* =========================================================
   APP
   ========================================================= */

const writingApp =
    document.getElementById(
        "writingApp"
    );


if (!writingApp) {
    throw new Error(
        'Element #writingApp not found'
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

function writingEscape(text) {

    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}


function writingCountWords(text) {

    const matches =
        String(text || "")
            .trim()
            .match(
                /[A-Za-zА-Яа-яЁё0-9]+(?:[’'\-][A-Za-zА-Яа-яЁё0-9]+)*/g
            );


    return matches
        ? matches.length
        : 0;
}


/* =========================================================
   BACK
   Same logic as Speaking
   ========================================================= */

function writingBack() {

    if (
        window.history.length > 1
    ) {
        window.history.back();
        return;
    }


    if (WRITING_TASK.backUrl) {

        let url =
            WRITING_TASK.backUrl;


        if (writingStudent) {

            url +=
                (
                    url.includes("?")
                        ? "&"
                        : "?"
                ) +
                "student=" +
                encodeURIComponent(
                    writingStudent
                );
        }


        window.location.href =
            url;

        return;
    }


    window.location.href =
        "index.html";
}


/* =========================================================
   PAGE
   ========================================================= */

function writingBuildShell() {

    writingApp.innerHTML = `

        <div
            class="space-decor space-decor-medium"
        ></div>

        <div
            class="space-decor space-decor-small"
        ></div>


        <img
            class="speaking-logo"
            src="logo.png"
            alt="The Space"
        >


        <button
            class="speaking-back"
            type="button"
            id="writingBack"
        >
            ← BACK
        </button>


        <div class="speaking-page">


            <div class="speaking-top">


                <div class="speaking-label">

                    EGE ·
                    ${WRITING_TYPE} ·
                    ${writingEscape(
                        WRITING_TASK.id
                    )}

                </div>


                <h1 class="speaking-title">

                    ${writingEscape(
                        WRITING_TASK.title
                    )}

                </h1>


                <div
                    id="writingStudent"
                    class="speaking-student"
                ></div>


            </div>


            <section
                class="speaking-main writing-task-card"
            >

                <div
                    class="writing-task"
                >

                    ${WRITING_TASK.taskHtml}

                </div>

            </section>


            <section
                class="speaking-main writing-answer-card"
            >


                <div
                    class="writing-answer-top"
                >


                    <div
                        class="speaking-side-title writing-answer-label"
                    >
                        YOUR ANSWER
                    </div>


                    <div
                        id="writingWordCount"
                        class="writing-word-count"
                    ></div>


                </div>


                <textarea
                    id="writingAnswer"
                    class="writing-textarea"
                    spellcheck="true"
                    autocomplete="off"
                ></textarea>


            </section>


        </div>
    `;


    document.getElementById(
        "writingBack"
    ).addEventListener(
        "click",
        writingBack
    );


    document.getElementById(
        "writingStudent"
    ).textContent =
        writingStudent
            ? "Student: " +
              writingStudent
            : "Student not selected";


    document.getElementById(
        "writingAnswer"
    ).addEventListener(
        "input",
        writingUpdateCounter
    );


    writingUpdateCounter();
}


/* =========================================================
   WORD COUNTER
   ========================================================= */

function writingUpdateCounter() {

    const answer =
        document.getElementById(
            "writingAnswer"
        );


    const counter =
        document.getElementById(
            "writingWordCount"
        );


    const count =
        writingCountWords(
            answer.value
        );


    const min =
        Number(
            WRITING_TASK.minWords || 100
        );


    const max =
        Number(
            WRITING_TASK.maxWords || 140
        );


    counter.textContent =
        `WORDS: ${count} / ${min}–${max}`;


    counter.classList.remove(
        "ok",
        "out"
    );


    if (
        count >= min &&
        count <= max
    ) {
        counter.classList.add(
            "ok"
        );

    } else if (count > 0) {
        counter.classList.add(
            "out"
        );
    }
}


/* =========================================================
   START
   ========================================================= */

writingBuildShell();