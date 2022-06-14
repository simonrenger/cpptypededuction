

function markdown(str) {
    {
        const regex = /(```(.*)\n(.*)```)/gm;
        str = str.replace(regex, `<pre><code class="language-cpp">$2\n$3</code></pre>`);
    }
    return marked.parse(str);
}

function generateQuestions(questions, index) {
    let template = ""
    questions.forEach(q => {

        let options = `<div class="quizlib-question-answers" role="group">`;
        q.options.forEach(o => {
            const qIdx = questions.indexOf(q);
            const oIdx = q.options.indexOf(o);
            options += `
            <div class="form-check form-check-inline">
            <input type="${q.type}" name="b${index}-q${qIdx}" class="form-check-input" id="b${index}-q${qIdx}-o${oIdx}" value="b${index}-q${qIdx}-o${oIdx}">
            <label class="form-check-label" for="b${index}-q${qIdx}-o${oIdx}">${marked.parse(o.value)}</label>
            </div>
            `;
        });
        options += "</div>"
        template += `<div class="card mt-5 quizlib-question">
        <div class="card-body">
          <h5 class="card-title text-dark quizlib-question-title">${marked.parse(q.title)}</h5>
          <div class="card-text text-dark">
            ${options}
          </div>
          </div>
      </div>`;
    });
    return template
}


(() => {
    const did_test = localStorage.getItem('type_deduction_test');
    if (did_test) {
        $("#overview").removeClass("disabled");
        $("#cheatsheet").removeClass("disabled");
        $("#overview").addClass("text-warning");
        $("#cheatsheet").addClass("text-warning");
        $(".did_quiz").addClass("d-none")
    }
})();

$("#home").click(() => {
    $("#content").empty();
    $("#intro").removeClass("d-none");
    $("a").removeClass("active");
    $("#home").addClass("active");
});

$("#overview").click(() => {
    $("#content").empty();
    $("#intro").addClass("d-none");
    $("a").removeClass("active");
    $("#overview").addClass("active");
    $("#result").addClass("d-none");
    $("#content").append("<p>To be added... feel free to create a PR.</p>");
});

$("#cheatsheet").click(() => {
    $("#content").empty();
    $("#intro").addClass("d-none");
    $("a").removeClass("active");
    $("#cheatsheet").addClass("active");
    $("#result").addClass("d-none");
    $("#content").append("<p>To be added... feel free to create a PR.</p>");
});

$(".do_quiz").click(() => {
    $.getJSON('./quiz.json', function (data) {

        let correctAnswers = [];
        $("#intro").addClass("d-none");
        $("#content").empty();
        $("a").removeClass("active");
        $("#quiz-link").addClass("active");

        $("#content").append(`
        <div class="progress mt-5">
            <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="${data.length - 1}">0/${data.length - 1}</div>
        </div>
        `);

        data.forEach(item => {
            if (item.questions.length > 0) {
                $("#content").append(`
                <div id="question-${data.indexOf(item)}" class="questions d-none">
            <div class="card mt-5">
            <div class="card-body">
              <h5 class="card-title text-dark">${item.title}</h5>
              <h6 class="card-subtitle mb-2 text-muted">Questions: ${item.questions.length}</h6>
              <div class="card-text text-dark">${markdown(item.description)}</div>
            </div>
          </div>
          <div id="questions-${data.indexOf(item) + 1}">
          ${generateQuestions(item.questions, data.indexOf(item))}
          </div>
          <a href="#" data-next="${data.indexOf(item) - 1}" class="mt-5 btn btn-lg btn-secondary fw-bold bg-white back">Back</a>
          <a href="#" data-prv="${data.indexOf(item)}" data-next="${data.indexOf(item) + 1}" class="mt-5 btn btn-lg btn-secondary fw-bold
          bg-white  ${data.indexOf(item) + 1 < data.length ? "next" : "finished"}">${data.indexOf(item) + 1 < data.length ? "Next" : "Finish"}</a>
          </div>
            `);
                item.questions.forEach(q => {
                    const qIdx = item.questions.indexOf(q);
                    correctAnswers.push(`b${data.indexOf(item)}-q${qIdx}-o${q.correctAnswerIndex}`);
                });

            } else {
                $("#content").append(`
                <div id="question-${data.indexOf(item)}">
            <div class="card mt-5 visible">
            <div class="card-body">
              <h5 class="card-title text-dark">${item.title}</h5>
              <div class="card-text text-dark">${markdown(item.description)}</div>
              <a href="#" data-prv="${data.indexOf(item)}"  data-next="${data.indexOf(item) + 1}" class="mt-5 btn btn-lg btn-secondary fw-bold
              bg-white next">Start</a>
            </div>
          </div>
          </div>            
            `);
            }
        });
        hljs.highlightAll();

        console.log($(".quizlib-question").length == correctAnswers.length);
        const quiz = new Quiz('content', correctAnswers);
        console.log(correctAnswers);

        $(".next").click(function () {
            $(`#question-${$(this).data("prv")}`).addClass("d-none");
            $(`#question-${$(this).data("next")}`).removeClass("d-none");
            let percent = ($(this).data("next")) / (data.length - 1);
            $(`.progress-bar`).css('width', `${percent * 100}% `);
            $(`.progress-bar`).attr(`aria-valuenow`, $(this).data("next") - 1);
            $(`.progress-bar`).text(`${$(this).data("next")}/${data.length - 1}`);
        });

        $(".back").click(function () {
            console.log("back");
            $(".questions").addClass("d-none");
            $(`#question-${$(this).data("next")}`).removeClass("d-none");
        });

        $(".finished").click(function () {
            if (quiz.checkAnswers()) {
                $("#result").removeClass("d-none");
                $(".progress").addClass("d-none");
                quiz.highlightResults((quiz, question, no, correct) => {
                    if (correct) {
                        $(question).find(".form-check-input").each(function () {
                            $(this).removeClass("is-invalid");
                            $(this).addClass("is-valid");
                        });
                    } else {
                        $(question).find(".form-check-input").each(function () {
                            $(this).addClass("is-invalid");
                            $(this).removeClass("is-valid");
                        });
                    }
                });
                $("#correct-answers").text(`${quiz.result.score} (${quiz.result.scorePercentFormatted}%)`);
                $("#incorrect-answers").text(`${quiz.result.totalQuestions - quiz.result.score}`);

                $(".questions").removeClass("d-none");
                $(".next").addClass("d-none");
                $(".back").addClass("d-none");
                localStorage.setItem('type_deduction_test', true);
                $("#overview").removeClass("disabled");
                $("#cheatsheet").removeClass("disabled");
                $("#overview").addClass("text-warning");
                $("#cheatsheet").addClass("text-warning");
                $(".did_quiz").addClass("d-none")
            } else {
                $(".questions").removeClass("d-none");
                $(".next").addClass("d-none");
            }
        })
    });
})