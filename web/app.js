// Website UI. Shared storage/stats/sync helpers come from core.js; data from calendar.js, problems.js, studyplan.js.
const TYPE_LABEL = { learn: "Learn", revision: "Revision", breather: "Breather", mock: "Mock" };
const STATUSES = ["Applied", "OA", "Phone Screen", "Onsite", "Offer", "Rejected"];
const LC = "https://leetcode.com/problems/";
const pad2 = (n) => String(n).padStart(2, "0");
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// ---------- Routing ----------
const PAGES = ["calendar", "system-design", "friends", "applications", "resources"];
function showPage() {
  const page = PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : "calendar";
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === `page-${page}`));
  document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("active", a.dataset.page === page));
  window.scrollTo(0, 0);
  if (page === "friends") renderFriends();
}

async function renderAccount() {
  const { profile } = await getAll();
  const btn = $("account-btn");
  btn.textContent = `@${(profile && profile.username) || "account"}`;
  btn.classList.add("signed-in");
}

// ---------- Sign-in gate ----------
// Every page is per-account, so nothing is shown until someone signs in.
function showAuth() {
  document.body.classList.remove("booting");
  document.body.classList.add("signed-out");
  renderAuthBackground();
  renderAuth($("auth-slot"));
}

// Decorative 90-day heatmap behind the sign-in box: one cell per calendar day, coloured by
// day type, about two thirds "done" at varying intensity, with a few cells softly pulsing.
function renderAuthBackground() {
  const heat = $("auth-heat");
  if (heat.childElementCount) return;
  let html = "";
  for (let d = 1; d <= DSA90.TOTAL; d++) {
    const type = DSA90.DAYS[d].type;
    const on = (d * 7) % 10 < 7;
    const lvl = [30, 45, 62, 80][(d * 13) % 4];
    const pulse = on && d % 9 === 4;
    html += `<span class="heat-cell ${type} ${on ? "on" : ""} ${pulse ? "pulse" : ""}" style="--lvl:${lvl}%;--delay:${(d % 6) * 1.1}s"></span>`;
  }
  heat.innerHTML = html;
}

async function enterApp() {
  document.body.classList.remove("booting", "signed-out");
  $("auth-slot").innerHTML = "";
  showPage();
  await renderAll();
}

async function signOutToAuth() {
  await Cloud.signOut();
  friendsUi.open.clear();
  addingDay = null;
  history.replaceState(null, "", location.pathname);
  showAuth();
}

// ---------- 90-day calendar ----------
let addingDay = null; // day whose "add question" form is open
async function renderCalendar() {
  const data = await getAll();
  const progress = data.dayProgress || {};
  const custom = data.customProblems || {};
  const s = computeStats(shareData(data));
  const next = nextDay(progress);

  $("cal-fill").style.width = `${pct(s.daysDone, s.daysTotal)}%`;
  $("cal-label").textContent = `${s.daysDone} / ${s.daysTotal} days`;
  $("cal-meta").innerHTML = next
    ? `Up next: <a href="#day-${next}">Day ${next}</a> · ${s.coding} solved · ${s.streak}-day streak`
    : `All 90 days done · ${s.coding} solved`;

  $("calendar").innerHTML = DSA90.WEEKS.map((week) => {
    let cards = "";
    for (let d = week.from; d <= week.to; d++) {
      const info = DSA90.DAYS[d];
      const res = info.res && DSA90.RES[info.res];
      cards += `
        <div class="day-card ${info.type} ${progress[d] ? "done" : ""} ${d === next ? "next" : ""}" id="day-${d}">
          <div class="day-card-top">
            <span class="day-num">D${d}${d === next ? `<span class="up-next">· next</span>` : ""}</span>
            <span class="day-tag tag-${info.type}">${TYPE_LABEL[info.type]}</span>
          </div>
          <div class="pattern"><b>Pattern:</b> ${res
            ? `<a href="${res}" target="_blank" rel="noopener">${esc(info.pattern)}</a>`
            : esc(info.pattern)}</div>
          ${info.problems || custom[d] ? `<ul class="problems">${(info.problems || []).map((p) => `
            <li><a href="${LC}${p.slug}/" target="_blank" rel="noopener">${esc(p.n)}</a><span class="diff diff-${p.d}">${p.d}</span></li>`).join("")}
            ${(custom[d] || []).map((p) => `
            <li class="custom"><a href="${esc(p.url)}" target="_blank" rel="noopener" title="Added by you">${esc(p.n)}</a><span class="diff diff-${p.d}">${p.d}</span>
              <button class="remove-x" data-remove-q="${esc(p.id)}" data-day="${d}" title="Remove this question" aria-label="Remove ${esc(p.n)}">×</button></li>`).join("")}
          </ul>` : ""}
          ${info.note ? `<div class="note">${esc(info.note)}</div>` : ""}
          ${addingDay === d ? `
            <form class="add-q-form" data-day="${d}">
              <input name="q" placeholder="Name, link, or both" aria-label="Problem name or link" required />
              <div class="add-q-row">
                <select name="diff" aria-label="Difficulty"><option value="E">Easy</option><option value="M" selected>Med</option><option value="H">Hard</option></select>
                <button class="btn btn-primary btn-xs" type="submit">Add</button>
                <button class="btn btn-xs" type="button" data-cancel-q title="Cancel" aria-label="Cancel">✕</button>
              </div>
              <div class="add-q-msg"></div>
            </form>` : `<button class="add-q" data-add-q="${d}">+ Add question</button>`}
          <label class="check-row"><input type="checkbox" data-day="${d}" ${progress[d] ? "checked" : ""} /> Done</label>
        </div>`;
    }
    return `
      <div class="week-block">
        <div class="week-head"><span class="week-num">WEEK ${pad2(week.n)}</span><span class="week-title">${esc(week.title)}</span></div>
        <div class="day-row">${cards}</div>
      </div>`;
  }).join("");

  const cal = $("calendar");
  cal.querySelectorAll("input[data-day]").forEach((cb) => {
    cb.addEventListener("change", async () => {
      await setDayDone(cb.dataset.day, cb.checked);
      renderCalendar();
    });
  });
  cal.querySelectorAll("[data-add-q]").forEach((b) => (b.onclick = () => {
    addingDay = Number(b.dataset.addQ);
    renderCalendar().then(() => cal.querySelector(".add-q-form input").focus());
  }));
  cal.querySelectorAll("[data-cancel-q]").forEach((b) => (b.onclick = () => { addingDay = null; renderCalendar(); }));
  cal.querySelectorAll(".add-q-form").forEach((form) => (form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await addCustomProblem(form.dataset.day, form.q.value, form.diff.value);
      addingDay = null;
      renderCalendar();
    } catch (err) {
      form.querySelector(".add-q-msg").textContent = err.message;
    }
  }));
  cal.querySelectorAll("[data-remove-q]").forEach((b) => (b.onclick = async () => {
    await removeCustomProblem(b.dataset.day, b.dataset.removeQ);
    renderCalendar();
  }));
}

// ---------- System design ----------
function videoLabel(url, i) {
  if (url.includes("youtu")) return `▶ Video ${i + 1}`;
  if (url.includes("substack")) return "Article";
  return "Link";
}

async function renderSystemDesign() {
  const data = await getAll();
  const sd = data.sdProgress || {};
  const s = computeStats(shareData(data));
  $("sd-fill").style.width = `${pct(s.sdDone, s.sdTotal)}%`;
  $("sd-label").textContent = `${s.sdDone} / ${s.sdTotal} topics & problems`;

  const card = (key, inner, cls = "") => `
    <div class="day-card ${cls} ${sd[key] ? "done" : ""}">
      ${inner}
      <label class="check-row"><input type="checkbox" data-sd="${key}" ${sd[key] ? "checked" : ""} /> Done</label>
    </div>`;

  const weeks = SYSTEM_DESIGN.roadmap.map((w, wi) => {
    const [, title] = w.name.split(" - ");
    return `
      <div class="week-block">
        <div class="week-head">
          <span class="week-num">WEEK ${pad2(wi + 1)}</span><span class="week-title">${esc(title || w.name)}</span>
          <span class="week-extra">${w.videos.map((v, i) =>
            `<a class="chip" href="${v}" target="_blank" rel="noopener">${videoLabel(v, i)}</a>`).join("")}</span>
        </div>
        <div class="topic-grid">${w.topics.map((t, i) => {
          const link = w.links && w.links[i];
          return card(sdTopicKey(w.id, i), `<div class="topic-text">${esc(t)}</div>${link
            ? `<a class="learn-link" href="${esc(link)}" target="_blank" rel="noopener">Learn on ${esc(sourceName(link))} ↗</a>` : ""}`, "topic-card");
        }).join("")}</div>
      </div>`;
  }).join("");

  const problems = `
    <div class="week-block">
      <div class="week-head"><span class="week-num">PRACTICE</span><span class="week-title">Classic interview problems</span></div>
      <div class="problem-grid">${SYSTEM_DESIGN.problems.map((p) => card(`p-${p.id}`, `
        <h3>${esc(p.name)}</h3>
        <ul class="points">${p.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
        ${(p.links || []).length ? `<div class="ref-links">${p.links.map((l) =>
          `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(sourceName(l.url))}">${esc(l.label)} ↗</a>`).join("")}</div>` : ""}`, "problem-card mock")).join("")}
      </div>
    </div>`;

  $("sd-content").innerHTML = weeks + problems;
  $("sd-content").querySelectorAll("input[data-sd]").forEach((cb) => {
    cb.addEventListener("change", async () => {
      const d = await getAll();
      const sdNow = d.sdProgress || {};
      if (cb.checked) sdNow[cb.dataset.sd] = true;
      else delete sdNow[cb.dataset.sd];
      await setKeys({ sdProgress: sdNow });
      await markChanged();
      renderSystemDesign();
    });
  });
}

// ---------- Friends ----------
const friendsUi = { mode: "signin", open: new Set() };

async function renderFriends() {
  const el = $("friends-content");
  const session = await Cloud.getSession();
  if (!session) return showAuth();

  const { profile } = await getAll();
  const me = profile ? profile.username : session.user.email;
  el.innerHTML = `
    <div class="friends-layout">
      <aside class="side">
        <div class="panel">
          <div class="me-name">@${esc(me)}</div>
          <div class="muted" style="font-size:12.5px" id="sync-label"></div>
          <div class="row" style="margin-top:12px">
            <button class="btn" id="f-refresh">Refresh</button>
            <button class="btn" id="f-signout">Sign out</button>
          </div>
        </div>
        <form class="panel" id="f-add">
          <div class="label-sm">Add a friend</div>
          <div class="row"><input id="f-username" placeholder="Their username" required /><button class="btn btn-primary">Add</button></div>
          <div class="msg" id="f-msg"></div>
          <div class="muted" style="font-size:12px;margin-top:6px">Your username is <b>@${esc(me)}</b> - share it so friends can add you.</div>
        </form>
        <div id="f-requests"></div>
      </aside>
      <div>
        <div class="week-head"><span class="week-num">LEADERBOARD</span><span class="week-title">This is how everyone's doing</span></div>
        <div id="f-board"><div class="empty">Loading...</div></div>
      </div>
    </div>`;
  updateSyncLabel();

  $("f-signout").onclick = signOutToAuth;
  $("f-refresh").onclick = async () => { await syncOnOpen(); renderAll(); };
  $("f-add").onsubmit = async (e) => {
    e.preventDefault();
    const msg = $("f-msg");
    try {
      await Cloud.sendFriendRequest($("f-username").value);
      msg.className = "msg ok";
      msg.textContent = "Request sent - they'll see it on their Friends page.";
      $("f-username").value = "";
      loadBoard(session, me);
    } catch (err) {
      msg.className = "msg err";
      msg.textContent = err.message;
    }
  };
  loadBoard(session, me);
}

function renderAuth(el) {
  const signup = friendsUi.mode === "signup";
  el.innerHTML = `
    <div class="panel auth">
      <div class="auth-title">${signup ? "Create your account" : "Welcome back"}</div>
      <p class="auth-sub">${signup ? "Pick a username - friends will add you by it." : "Sign in to see your calendar and progress."}</p>
      <div class="seg">
        <button data-mode="signin" class="${signup ? "" : "active"}">Sign in</button>
        <button data-mode="signup" class="${signup ? "active" : ""}">Create account</button>
      </div>
      <form class="stack" id="auth-form">
        <input type="email" id="a-email" placeholder="Email" autocomplete="email" required />
        <input type="password" id="a-pass" placeholder="Password (min 8 characters)" minlength="8"
          autocomplete="${signup ? "new-password" : "current-password"}" required />
        ${signup ? `<input id="a-user" placeholder="Username - friends add you by this" required />` : ""}
        <button class="btn btn-primary" id="a-submit">${signup ? "Create account" : "Sign in"}</button>
      </form>
      <div class="msg" id="a-msg"></div>
    </div>`;
  el.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => { friendsUi.mode = b.dataset.mode; renderAuth(el); }));
  $("auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const msg = $("a-msg");
    $("a-submit").disabled = true;
    msg.className = "msg";
    msg.textContent = signup ? "Creating account..." : "Signing in...";
    try {
      if (signup) await Cloud.signUp($("a-email").value.trim(), $("a-pass").value, $("a-user").value);
      else await Cloud.signIn($("a-email").value.trim(), $("a-pass").value);
      await syncOnOpen();
      await enterApp();
    } catch (err) {
      msg.className = "msg err";
      msg.textContent = err.message;
      $("a-submit").disabled = false;
    }
  };
}

async function loadBoard(session, myName) {
  const uid = session.user.id;
  let rows, progress;
  try {
    rows = await Cloud.listFriendships();
    progress = await Cloud.friendsProgress();
  } catch (err) {
    $("f-board").innerHTML = `<div class="empty">Couldn't load friends: ${esc(err.message)}</div>`;
    return;
  }
  const other = (r) => (r.requester === uid ? r.addressee_profile : r.requester_profile);
  const incoming = rows.filter((r) => r.status === "pending" && r.addressee === uid);
  const outgoing = rows.filter((r) => r.status === "pending" && r.requester === uid);
  const byId = Object.fromEntries(progress.map((p) => [p.user_id, p]));

  $("f-requests").innerHTML = incoming.length || outgoing.length ? `
    <div class="panel" style="margin-top:12px">
      ${incoming.length ? `<div class="label-sm">Requests</div>${incoming.map((r) => `
        <div class="req"><span><b>@${esc(other(r).username)}</b> wants to study together</span>
          <button class="btn btn-primary" data-accept="${r.id}">Accept</button>
          <button class="icon-btn" data-remove="${r.id}" title="Decline">✕</button></div>`).join("")}` : ""}
      ${outgoing.length ? `<div class="label-sm" style="margin-top:8px">Sent</div>${outgoing.map((r) => `
        <div class="req muted"><span>@${esc(other(r).username)} · pending</span>
          <button class="btn" data-remove="${r.id}">Cancel</button></div>`).join("")}` : ""}
    </div>` : "";

  const d = await getAll();
  const people = [{ me: true, name: myName, stats: computeStats(shareData(d)), updated: d.lastSyncedAt }];
  rows.filter((r) => r.status === "accepted").forEach((r) => {
    const p = other(r);
    const prog = byId[p.id];
    people.push({ id: r.id, name: p.username, stats: computeStats((prog && prog.data) || {}), updated: prog && prog.updated_at });
  });
  people.sort((a, b) => b.stats.daysDone - a.stats.daysDone || b.stats.coding - a.stats.coding);
  const mine = people.find((p) => p.me).stats;

  $("f-board").innerHTML = people.map((p, i) => {
    const s = p.stats;
    const open = !p.me && friendsUi.open.has(p.id);
    return `
      <div class="lb-card ${p.me ? "me" : ""}">
        <div class="lb-head">
          <span class="rank">#${i + 1}</span>
          <div class="lb-name"><b>@${esc(p.name)}</b>${p.me ? `<span class="you">You</span>` : ""}
            <div class="lb-sub">${p.updated ? `${p.me ? "synced" : "active"} ${timeAgo(p.updated)}` : "no activity yet"}</div></div>
          ${p.me ? "" : `<button class="btn" data-compare="${p.id}">${open ? "Hide" : "Compare"}</button>
            <button class="icon-btn" data-remove="${p.id}" data-confirm="1" title="Remove friend">✕</button>`}
        </div>
        <div class="lb-stats">
          <div><b>${s.daysDone}</b><span>of 90 days</span></div>
          <div><b>${s.coding}</b><span>problems</span></div>
          <div><b>${s.thisWeek}</b><span>this week</span></div>
          <div><b>${s.streak}</b><span>day streak</span></div>
          <div><b>${s.sdDone}</b><span>sys design</span></div>
        </div>
        ${open ? compare(mine, s) : ""}
      </div>`;
  }).join("") + (people.length === 1
    ? `<div class="empty">No friends yet. Share your username <b>@${esc(myName)}</b> and add theirs on the left.</div>` : "");

  const root = $("page-friends");
  root.querySelectorAll("[data-accept]").forEach((b) => (b.onclick = async () => {
    await Cloud.acceptFriend(b.dataset.accept);
    loadBoard(session, myName);
  }));
  root.querySelectorAll("[data-remove]").forEach((b) => (b.onclick = async () => {
    if (b.dataset.confirm && !confirm("Remove this friend? You'll stop seeing each other's progress.")) return;
    await Cloud.removeFriendship(b.dataset.remove);
    loadBoard(session, myName);
  }));
  root.querySelectorAll("[data-compare]").forEach((b) => (b.onclick = () => {
    const id = Number(b.dataset.compare);
    if (friendsUi.open.has(id)) friendsUi.open.delete(id);
    else friendsUi.open.add(id);
    loadBoard(session, myName);
  }));
}

function compare(me, them) {
  const row = (label, a, b, total) => `
    <div class="cmp">
      <div class="cmp-label">${esc(label)}</div>
      <div>
        <div class="cmp-line"><span>You</span><div class="bar"><i style="width:${pct(a, total)}%"></i></div><span class="cmp-n">${a}</span></div>
        <div class="cmp-line"><span>Them</span><div class="bar them"><i style="width:${pct(b, total)}%"></i></div><span class="cmp-n">${b}</span></div>
      </div>
    </div>`;
  const score = (s) => s.byDiff.E + s.byDiff.M * 2 + s.byDiff.H * 3;
  const top = Math.max(1, score(me), score(them));
  const patterns = CODING_PATTERNS
    .filter((p) => me.byPattern[p.id] || them.byPattern[p.id])
    .map((p) => row(p.name, me.byPattern[p.id] || 0, them.byPattern[p.id] || 0, p.problems.length)).join("");
  return `<div class="compare">
    ${row("90-day calendar", me.daysDone, them.daysDone, me.daysTotal)}
    ${row("Weighted score (Easy 1 · Med 2 · Hard 3)", score(me), score(them), top)}
    ${row("System design", me.sdDone, them.sdDone, me.sdTotal)}
    ${patterns}
  </div>`;
}

// ---------- Applications ----------
async function renderApplications() {
  const { applications = [] } = await getAll();
  const apps = applications.filter((a) => a.confirmed !== false)
    .sort((a, b) => String(b.dateApplied).localeCompare(String(a.dateApplied)));
  $("apps-list").innerHTML = apps.length ? `<div class="panel">${apps.map((a) => `
    <div class="app-row" data-id="${esc(a.id)}">
      <input class="company" data-field="company" value="${esc(a.company)}" aria-label="Company" />
      <input data-field="position" value="${esc(a.position || "")}" placeholder="Position" aria-label="Position" />
      <input type="date" data-field="dateApplied" value="${esc(a.dateApplied || "")}" aria-label="Date applied" />
      <select data-field="status" aria-label="Status">${STATUSES.map((s) => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      <button class="icon-btn" data-del title="Delete">✕</button>
    </div>`).join("")}</div>` : `<div class="empty">No applications yet - add your first one above.</div>`;

  const update = async (id, fn) => {
    const d = await getAll();
    await setKeys({ applications: fn(d.applications || [], id) });
    await markChanged();
  };
  $("apps-list").querySelectorAll(".app-row").forEach((row) => {
    const id = row.dataset.id;
    row.querySelectorAll("[data-field]").forEach((inp) => (inp.onchange = () =>
      update(id, (list) => list.map((a) => (a.id === id ? { ...a, [inp.dataset.field]: inp.value } : a)))));
    row.querySelector("[data-del]").onclick = async () => {
      await update(id, (list) => list.filter((a) => a.id !== id));
      renderApplications();
    };
  });
}

function initApplications() {
  $("af-status").innerHTML = STATUSES.map((s) => `<option>${s}</option>`).join("");
  $("app-form").onsubmit = async (e) => {
    e.preventDefault();
    const d = await getAll();
    const apps = d.applications || [];
    apps.push({
      id: `manual-${Date.now()}`,
      company: $("af-company").value.trim(),
      position: $("af-position").value.trim(),
      dateApplied: $("af-date").value || dateStr(),
      status: $("af-status").value,
      source: "manual",
      confirmed: true,
      notes: ""
    });
    await setKeys({ applications: apps });
    await markChanged();
    e.target.reset();
    renderApplications();
  };
}

// ---------- Resources ----------
async function renderResources() {
  const { customResources = [] } = await getAll();
  const groups = allResources(customResources);
  $("res-groups").innerHTML = Object.keys(groups).map((g) => `<option value="${esc(g)}"></option>`).join("");
  $("resources-content").innerHTML = Object.entries(groups).map(([group, links]) => `
    <div class="panel"><h3>${esc(group)}</h3>
      ${links.map((l) => `<div class="res-item">
        <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}${l.id ? ` <span class="yours">added by you</span>` : ""}</a>
        ${l.id ? `<button class="remove-x" data-remove-res="${esc(l.id)}" title="Remove" aria-label="Remove ${esc(l.name)}">×</button>` : ""}
      </div>`).join("")}
    </div>`).join("");
  $("resources-content").querySelectorAll("[data-remove-res]").forEach((b) => (b.onclick = async () => {
    await removeCustomResource(b.dataset.removeRes);
    renderResources();
  }));
}

function initResources() {
  $("res-form").onsubmit = async (e) => {
    e.preventDefault();
    const msg = $("res-msg");
    try {
      await addCustomResource($("res-group").value, $("res-name").value, $("res-url").value);
      e.target.reset();
      msg.className = "msg ok";
      msg.textContent = "Added.";
      renderResources();
    } catch (err) {
      msg.className = "msg err";
      msg.textContent = err.message;
    }
  };
}

// ---------- Theme (dark "Espresso" by default, light "Terracotta & Sage") ----------
function applyTheme(theme) {
  const light = theme === "light";
  if (light) document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  const btn = $("theme-btn");
  btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
  document.querySelector('meta[name="theme-color"]').content = light ? "#FAF4EC" : "#1C1612";
  try { localStorage.setItem("theme", light ? "light" : "dark"); } catch { /* storage blocked */ }
}

function initTheme() {
  applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  $("theme-btn").addEventListener("click", () =>
    applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"));
}

// ---------- Init ----------
async function renderAll() {
  // Session gone (signed out elsewhere or expired)? Back to the welcome screen.
  if (!(await Cloud.getSession())) return showAuth();
  await renderAccount();
  await renderCalendar();
  await renderSystemDesign();
  await renderApplications();
  await renderResources();
  if (location.hash === "#friends") await renderFriends();
}

window.addEventListener("hashchange", showPage);
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initApplications();
  initResources();
  if (!(await Cloud.getSession())) return showAuth();
  await enterApp();       // show this account's saved data straight away
  await syncOnOpen();     // then pull the latest from the server
  await renderAll();
});
