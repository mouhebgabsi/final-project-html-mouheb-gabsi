function $(s, r) {
  if (!r) { r = document; }
  return r.querySelector(s);
}

function $a(s, r) {
  if (!r) { r = document; }
  return Array.from(r.querySelectorAll(s));
}

$a("[data-year]").forEach(function (e) {
  e.textContent = new Date().getFullYear();
});

var navBtn = $(".nav-toggle");
var nav = $(".site-nav");

if (navBtn && nav) {
  navBtn.onclick = function () {
    nav.classList.toggle("open");
    navBtn.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
  };
}

var themeBtn = $("#themeBtn");

if (themeBtn) {
  themeBtn.onclick = function () {
    document.body.classList.toggle("dark");
  };
}

$a(".faq-q").forEach(function (q) {
  q.onclick = function () {
    var a = q.nextElementSibling;
    if (a) {
      a.hidden = !a.hidden;
    }
  };
});

function getLS(k, f) {
  try {
    var v = localStorage.getItem(k);
    if (!v) { return f; }
    return JSON.parse(v);
  } catch (e) {
    return f;
  }
}

function setLS(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}

var workoutForm = $("#workoutForm");
var workoutList = $("#workoutList");

function renderWorkouts() {
  if (!workoutList) {
    return;
  }
  var data = getLS("workouts", []);
  workoutList.innerHTML = "";
  if (!data.length) {
    var li0 = document.createElement("li");
    li0.textContent = "No workouts yet.";
    workoutList.appendChild(li0);
    return;
  }
  data.forEach(function (w) {
    var li = document.createElement("li");
    li.textContent = w.date + " - " + w.type + " (" + w.minutes + " min)";
    workoutList.appendChild(li);
  });
}

function updateStats() {
  var data = getLS("workouts", []);
  var total = $("#statTotal");
  var mins = $("#statMinutes");
  if (total) {
    total.textContent = String(data.length);
  }
  if (mins) {
    mins.textContent = String(data.reduce(function (s, w) {
      return s + Number(w.minutes || 0);
    }, 0));
  }
}

if (workoutForm) {
  workoutForm.onsubmit = function (e) {
    e.preventDefault();
    var data = getLS("workouts", []);
    data.push({
      type: workoutForm.type.value,
      minutes: workoutForm.minutes.value,
      date: workoutForm.date.value
    });
    setLS("workouts", data);
    workoutForm.reset();
    renderWorkouts();
    updateStats();
  };
}

renderWorkouts();
updateStats();

var bmiBtn = $("#calcBMI");

if (bmiBtn) {
  bmiBtn.onclick = function () {
    var hEl = $("#height");
    var wEl = $("#weight");
    var out = $("#bmiResult");
    if (!hEl || !wEl || !out) {
      return;
    }
    var h = Number(hEl.value) / 100;
    var w = Number(wEl.value);
    if (!h || !w) {
      out.textContent = "Enter height and weight.";
      return;
    }
    var bmi = (w / (h * h)).toFixed(1);
    out.textContent = "BMI: " + bmi;
  };
}

var quoteBtn = $("#loadQuote");
var quote = $("#quote");

var localQuotes = [
  { t: "Small steps every day add up.", a: "FitTrack" },
  { t: "Discipline beats motivation.", a: "FitTrack" },
  { t: "Start where you are. Use what you have. Do what you can.", a: "Arthur Ashe" },
  { t: "Consistency is the real workout plan.", a: "FitTrack" },
  { t: "You don’t have to be extreme, just consistent.", a: "Unknown" },
  { t: "Progress, not perfection.", a: "FitTrack" },
  { t: "A little effort today beats a lot of regret tomorrow.", a: "FitTrack" }
];

function fetchTimeout(url, ms) {
  var controller = new AbortController();
  var timer = setTimeout(function () {
    controller.abort();
  }, ms);

  return fetch(url, { signal: controller.signal })
    .then(function (r) {
      clearTimeout(timer);
      return r;
    })
    .catch(function (e) {
      clearTimeout(timer);
      throw e;
    });
}

function setLastQuoteText(text) {
  try {
    localStorage.setItem("last_quote_text", text);
  } catch (e) {}
}

function getLastQuoteText() {
  try {
    return localStorage.getItem("last_quote_text") || "";
  } catch (e) {
    return "";
  }
}

function setRandomLocalQuoteNoRepeat() {
  if (!quote) { return; }
  var last = getLastQuoteText();
  var pick = localQuotes[0];
  var tries = 0;

  while (tries < 12) {
    pick = localQuotes[Math.floor(Math.random() * localQuotes.length)];
    var text = """ + pick.t + "" — " + pick.a;
    if (text !== last) {
      quote.textContent = text;
      setLastQuoteText(text);
      return;
    }
    tries = tries + 1;
  }

  var fallback = """ + pick.t + "" — " + pick.a;
  quote.textContent = fallback;
  setLastQuoteText(fallback);
}

function loadQuote() {
  if (!quote) {
    return;
  }

  quote.textContent = "Loading...";

  var cb = Date.now();
  var direct = "https://api.quotable.io/random?cb=" + cb;
  var viaProxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(direct);
  var urls = [direct, viaProxy];

  (function tryNext(i) {
    if (i >= urls.length) {
      setRandomLocalQuoteNoRepeat();
      return;
    }

    fetchTimeout(urls[i], 8000)
      .then(function (r) {
        if (!r.ok) { throw new Error("bad status"); }
        return r.json();
      })
      .then(function (d) {
        if (d && d.content) {
          var text = """ + d.content + "" — " + (d.author || "Unknown");
          var last = getLastQuoteText();
          if (text === last) {
            tryNext(i + 1);
            return;
          }
          quote.textContent = text;
          setLastQuoteText(text);
          return;
        }
        throw new Error("bad json");
      })
      .catch(function () {
        tryNext(i + 1);
      });
  })(0);
}

if (quoteBtn) {
  quoteBtn.onclick = function () {
    loadQuote();
  };
}

var contactForm = $("#contactForm");
var contactMsg = $("#contactMsg");

if (contactForm) {
  contactForm.onsubmit = function (e) {
    e.preventDefault();
    if (contactMsg) {
      contactMsg.textContent = "Message sent successfully!";
    }
    contactForm.reset();
  };
}
