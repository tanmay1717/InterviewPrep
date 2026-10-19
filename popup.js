async function renderAccountChip() {
  const chip = $("account-chip");
  const session = Cloud.isConfigured() ? await Cloud.getSession() : null;
  const { profile } = await chrome.storage.local.get("profile");
  chip.textContent = session ? `@${(profile && profile.username) || session.user.email.split("@")[0]}` : "Sign in";
  chip.classList.toggle("signed-in", !!session);
  $("am-user").textContent = chip.textContent;
  $("am-email").textContent = session ? ((profile && profile.email) || session.user.email || "") : "";
}

// Account menu: signed in -> @username opens a menu with Sign out; signed out -> go to sign in.
function setAccountMenu(open) {
  $("account-menu").hidden = !open;
  $("account-chip").setAttribute("aria-expanded", String(open));
}

async function popupSignOut() {
  setAccountMenu(false);
  await Cloud.signOut();
  friendsState.authMode = "signin";
  switchTab("friends");
  renderAll();
}

function initAccountMenu() {
  $("account-chip").addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!(Cloud.isConfigured() && (await Cloud.getSession()))) return switchTab("friends");
    setAccountMenu($("account-menu").hidden);
  });
  $("am-friends").addEventListener("click", () => { setAccountMenu(false); switchTab("friends"); });
  $("am-signout").addEventListener("click", popupSignOut);
  document.addEventListener("click", (e) => {
    if (!$("account-menu").hidden && !e.target.closest(".account")) setAccountMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("account-menu").hidden) setAccountMenu(false);
  });
}

// ---------- Tabs ----------
function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.toggle("active", c.id === name));
  chrome.storage.local.set({ lastTab: name });
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  initAccountMenu();
}

// ---------- Dashboard ----------
const DAY_TYPE_LABEL = { learn: "Learn", revision: "Revision", breather: "Breather", mock: "Mock" };

// The next unfinished day of the 90-day calendar, as a card with its problems and a Done box.
function nextDayCard(data) {
  const day = nextDay(data.dayProgress || {});
  if (!day) return `<div class="focus-card"><div class="eyebrow">90 Days DSA Calendar</div><div class="focus-text">All 90 days done - you're interview-ready.</div></div>`;
  const info = DSA90.DAYS[day];
  const custom = (data.customProblems || {})[day] || [];
  const res = info.res && DSA90.RES[info.res];
  const site = Cloud.isConfigured() && API_BASE_URL ? `${API_BASE_URL}/#day-${day}` : null;
  const problems = [
    ...(info.problems || []).map((p) => ({ n: p.n, url: `https://leetcode.com/problems/${p.slug}/`, d: p.d })),
    ...custom.map((p) => ({ n: p.n, url: p.url, d: p.d }))
  ];
  return `
    <div class="day-card ${info.type}">
      <div class="day-card-top">
        <span class="day-num">DAY ${day} <span>/ ${DSA90.TOTAL}</span></span>
        <span class="day-tag tag-${info.type}">${DAY_TYPE_LABEL[info.type]}</span>
      </div>
      <div class="day-pattern"><b>Pattern:</b> ${res ? `<a href="${esc(res)}" target="_blank" rel="noopener">${esc(info.pattern)}</a>` : esc(info.pattern)}</div>
      ${problems.length ? `<ul class="day-problems">${problems.map((p) => `
        <li><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.n)}</a><span class="diff diff-${p.d}">${p.d}</span></li>`).join("")}</ul>` : ""}
      ${info.note ? `<div class="day-note">${esc(info.note)}</div>` : ""}
      <div class="day-foot">
        <label><input type="checkbox" id="next-day-done" data-day="${day}" /> Mark day done</label>
        ${site ? `<a href="${esc(site)}" target="_blank" rel="noopener">Full calendar ↗</a>` : ""}
      </div>
    </div>`;
}

async function renderDashboard() {
  const data = await getAll();
  const { weekIndex, dayOfWeek, diffDays } = getCurrentWeekInfo();
  const week = STUDY_PLAN[weekIndex];
  const s = computeStats(shareData(data));

  const applications = data.applications || [];
  const pendingCount = applications.filter((a) => a.source === "gmail-auto" && !a.confirmed).length;

  let focusText;
  if (diffDays < 0) {
    focusText = `Your plan starts on ${START_DATE}. Check the Plan tab to preview Week 1.`;
  } else {
    const focus = DAILY_FOCUS_ROTATION[dayOfWeek];
    if (focus === "rest") focusText = "Rest day - a light skim of notes is optional, no new material.";
    else if (focus === "mock") focusText = "Mock interview / review day - do one timed practice round.";
    else {
      const list = week[focus] || [];
      focusText = list.length ? `${focus.toUpperCase()}: ${list[0]}` : "See the Plan tab for today's tasks.";
    }
  }

  const day = nextDay(data.dayProgress || {});
  $("header-sub").textContent = day ? `Day ${day} of ${DSA90.TOTAL} · ${s.daysDone} done` : "All 90 days done";

  $("dashboard-content").innerHTML = `
    ${pendingCount ? `<button class="banner" id="pending-banner">${pendingCount} auto-detected application${pendingCount > 1 ? "s" : ""} to review →</button>` : ""}
    ${nextDayCard(data)}
    <div class="stat-grid">
      <div class="stat-box"><div class="num">${s.daysDone}<span class="of">/${s.daysTotal}</span></div><div class="label">Days done</div></div>
      <div class="stat-box"><div class="num">${s.coding}</div><div class="label">Problems solved</div></div>
      <div class="stat-box"><div class="num">${s.streak}<span class="of">d</span></div><div class="label">Streak</div></div>
      <div class="stat-box"><div class="num">${s.thisWeek}</div><div class="label">This week</div></div>
      <div class="stat-box"><div class="num">${s.sdDone}<span class="of">/${s.sdTotal}</span></div><div class="label">System design</div></div>
      <div class="stat-box"><div class="num">${applications.length}</div><div class="label">Applications</div></div>
    </div>
    <div class="focus-card">
      <div class="eyebrow">9-week plan · Week ${week.week}: ${esc(week.theme)}</div>
      <div class="focus-text">${esc(focusText)}</div>
    </div>
  `;
  const banner = $("pending-banner");
  if (banner) banner.addEventListener("click", () => switchTab("applications"));
  const doneBox = $("next-day-done");
  if (doneBox) doneBox.addEventListener("change", async () => {
    await setDayDone(doneBox.dataset.day, true);
    renderDashboard();
    renderCoding();
  });
}

// ---------- Practice: coding ----------
const practiceState = { openPatterns: new Set(), openSd: new Set() };

function initPractice() {
  document.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".seg-pane").forEach((p) => p.classList.toggle("active", p.id === `seg-${btn.dataset.seg}`));
    });
  });
  ["pf-search", "pf-diff", "pf-status"].forEach((id) => $(id).addEventListener("input", renderCoding));
}

async function renderCoding() {
  const data = await getAll();
  const solved = data.solvedProblems || {};
  const s = computeStats(shareData(data));
  const q = $("pf-search").value.trim().toLowerCase();
  const diff = $("pf-diff").value;
  const status = $("pf-status").value;
  const filtering = !!(q || diff || status);

  $("coding-summary").innerHTML = `
    <div class="summary-main"><span class="big">${s.coding}</span> / ${s.codingTotal} solved</div>
    ${bar(s.coding, s.codingTotal)}
    <div class="summary-diffs">
      <span class="diff diff-E">Easy ${s.byDiff.E}</span>
      <span class="diff diff-M">Med ${s.byDiff.M}</span>
      <span class="diff diff-H">Hard ${s.byDiff.H}</span>
    </div>`;

  const html = CODING_PATTERNS.map((p) => {
    const items = ALL_PROBLEMS.filter((x) => x.pattern === p.id).filter((x) =>
      (!q || x.title.toLowerCase().includes(q)) &&
      (!diff || x.diff === diff) &&
      (!status || (status === "done" ? !!solved[x.slug] : !solved[x.slug]))
    );
    if (filtering && !items.length) return "";
    const done = p.problems.filter(([slug]) => solved[slug]).length;
    const open = filtering || practiceState.openPatterns.has(p.id);
    return `
      <div class="week-block">
        <div class="week-header" data-pattern="${p.id}">
          <div class="week-title">
            <div class="pattern-row"><span class="week-theme-sm">${esc(p.name)}</span><span class="count">${done}/${p.problems.length}</span></div>
            ${bar(done, p.problems.length, "bar-sm")}
          </div>
          <span class="chev ${open ? "open" : ""}">›</span>
        </div>
        <div class="week-body ${open ? "open" : ""}">
          ${items.map((x) => `
            <div class="prob-row ${solved[x.slug] ? "done" : ""}">
              <input type="checkbox" data-slug="${x.slug}" ${solved[x.slug] ? "checked" : ""} title="Mark solved" />
              <a href="https://leetcode.com/problems/${x.slug}/" target="_blank" rel="noopener">${esc(x.title)}</a>
              ${x.premium ? `<span class="tag" title="LeetCode Premium - see Links tab for free company-wise lists">Prem</span>` : ""}
              <span class="diff diff-${x.diff}">${DIFF_LABEL[x.diff]}</span>
            </div>`).join("")}
        </div>
      </div>`;
  }).join("");

  const list = $("coding-list");
  list.innerHTML = html || `<div class="empty-state">No problems match these filters.</div>`;

  list.querySelectorAll(".week-header").forEach((h) => {
    h.addEventListener("click", () => {
      const id = h.dataset.pattern;
      if (practiceState.openPatterns.has(id)) practiceState.openPatterns.delete(id);
      else practiceState.openPatterns.add(id);
      h.nextElementSibling.classList.toggle("open");
      h.querySelector(".chev").classList.toggle("open");
    });
  });

  list.querySelectorAll("input[data-slug]").forEach((cb) => {
    cb.addEventListener("change", async () => {
      const d = await getAll();
      const solvedNow = d.solvedProblems || {};
      if (cb.checked) solvedNow[cb.dataset.slug] = dateStr();
      else delete solvedNow[cb.dataset.slug];
      await setKeys({ solvedProblems: solvedNow });
      await markChanged();
      renderCoding();
      renderDashboard();
    });
  });
}

// ---------- Practice: system design ----------
function linkLabel(url, i) {
  if (url.includes("youtu")) return `Video ${i + 1}`;
  if (url.includes("substack")) return "Article";
  return "Link";
}

async function renderSystemDesign() {
  const data = await getAll();
  const sd = data.sdProgress || {};
  const s = computeStats(shareData(data));

  $("sd-summary").innerHTML = `
    <div class="summary-main"><span class="big">${s.sdDone}</span> / ${s.sdTotal} topics & problems</div>
    ${bar(s.sdDone, s.sdTotal)}
    <div class="hint">Roadmap from the "System Design Roadmap for Beginners" post, plus classic practice problems.</div>`;

  const weeks = SYSTEM_DESIGN.roadmap.map((w) => {
    const done = w.topics.filter((_, i) => sd[sdTopicKey(w.id, i)]).length;
    const open = practiceState.openSd.has(w.id);
    return `
      <div class="week-block">
        <div class="week-header" data-sd="${w.id}">
          <div class="week-title">
            <div class="pattern-row"><span class="week-theme-sm">${esc(w.name)}</span><span class="count">${done}/${w.topics.length}</span></div>
            ${bar(done, w.topics.length, "bar-sm")}
          </div>
          <span class="chev ${open ? "open" : ""}">›</span>
        </div>
        <div class="week-body ${open ? "open" : ""}">
          ${w.topics.map((t, i) => {
            const key = sdTopicKey(w.id, i);
            return `<div class="task-row ${sd[key] ? "done" : ""}">
              <input type="checkbox" id="sd-${key}" data-sd-key="${key}" ${sd[key] ? "checked" : ""} />
              <label for="sd-${key}">${esc(t)}</label>
              ${w.links && w.links[i] ? `<a class="chip-link" href="${esc(w.links[i])}" target="_blank" rel="noopener" title="Learn on ${esc(sourceName(w.links[i]))}">Learn</a>` : ""}
            </div>`;
          }).join("")}
          ${w.videos.length ? `<div class="video-row">${w.videos.map((v, i) =>
            `<a class="chip-link" href="${v}" target="_blank" rel="noopener">${linkLabel(v, i)}</a>`).join("")}</div>` : ""}
        </div>
      </div>`;
  }).join("");

  const problemsOpen = practiceState.openSd.has("problems");
  const problemsDone = SYSTEM_DESIGN.problems.filter((p) => sd[`p-${p.id}`]).length;
  const problems = `
    <div class="week-block">
      <div class="week-header" data-sd="problems">
        <div class="week-title">
          <div class="pattern-row"><span class="week-theme-sm">Practice problems</span><span class="count">${problemsDone}/${SYSTEM_DESIGN.problems.length}</span></div>
          ${bar(problemsDone, SYSTEM_DESIGN.problems.length, "bar-sm")}
        </div>
        <span class="chev ${problemsOpen ? "open" : ""}">›</span>
      </div>
      <div class="week-body ${problemsOpen ? "open" : ""}">
        ${SYSTEM_DESIGN.problems.map((p) => {
          const key = `p-${p.id}`;
          return `<div class="sd-problem ${sd[key] ? "done" : ""}">
            <div class="task-row">
              <input type="checkbox" id="sd-${key}" data-sd-key="${key}" ${sd[key] ? "checked" : ""} />
              <label for="sd-${key}">${esc(p.name)}</label>
            </div>
            <ul class="points">${p.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
            ${(p.links || []).length ? `<div class="video-row">${p.links.map((l) =>
              `<a class="chip-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>` : ""}
          </div>`;
        }).join("")}
      </div>
    </div>`;

  const list = $("sd-list");
  list.innerHTML = `<div class="cat-label">Roadmap</div>${weeks}<div class="cat-label">Interview problems</div>${problems}`;

  list.querySelectorAll(".week-header").forEach((h) => {
    h.addEventListener("click", () => {
      const id = h.dataset.sd;
      if (practiceState.openSd.has(id)) practiceState.openSd.delete(id);
      else practiceState.openSd.add(id);
      h.nextElementSibling.classList.toggle("open");
      h.querySelector(".chev").classList.toggle("open");
    });
  });

  list.querySelectorAll("input[data-sd-key]").forEach((cb) => {
    cb.addEventListener("change", async () => {
      const d = await getAll();
      const sdNow = d.sdProgress || {};
      if (cb.checked) sdNow[cb.dataset.sdKey] = true;
      else delete sdNow[cb.dataset.sdKey];
      await setKeys({ sdProgress: sdNow });
      await markChanged();
      renderSystemDesign();
      renderDashboard();
    });
  });
}

// ---------- Friends ----------
const friendsState = { authMode: "signin", compareOpen: new Set() };

function setupCard() {
  return `
    <div class="auth-card">
      <div class="auth-title">Connect your server to use friends</div>
      <p class="hint">Login, cross-machine sync and friends run on your Vercel + Neon deployment.
      Follow <b>README → section 7</b>, then put your Vercel URL in <code>config.js</code> and reload the extension.</p>
    </div>`;
}

function renderAuthForm(el) {
  const signup = friendsState.authMode === "signup";
  el.innerHTML = `
    <div class="auth-card">
      <div class="auth-title">Study with friends</div>
      <p class="hint">Sign in to back up your progress, pick it up on another computer, and compare with friends.
      Friends see your study progress - never anything about your applications.</p>
      <div class="segmented small">
        <button class="seg-btn ${!signup ? "active" : ""}" data-mode="signin">Sign in</button>
        <button class="seg-btn ${signup ? "active" : ""}" data-mode="signup">Create account</button>
      </div>
      <form id="auth-form" class="auth-form">
        ${signup
          ? `<input type="email" id="auth-email" placeholder="Email" required autocomplete="email" />`
          : `<input type="text" id="auth-email" placeholder="Email or username" required autocomplete="username" autocapitalize="none" spellcheck="false" />`}
        <input type="password" id="auth-password" placeholder="Password (min 8 chars)" required minlength="8"
          autocomplete="${signup ? "new-password" : "current-password"}" />
        ${signup ? `<input type="text" id="auth-username" placeholder="Username (friends add you by this)" required />` : ""}
        <button type="submit" class="btn btn-primary" id="auth-submit">${signup ? "Create account" : "Sign in"}</button>
      </form>
      <div id="auth-msg" class="form-msg"></div>
    </div>`;

  el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    friendsState.authMode = b.dataset.mode;
    renderAuthForm(el);
  }));

  $("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("auth-msg");
    const btn = $("auth-submit");
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value;
    btn.disabled = true;
    msg.className = "form-msg";
    msg.textContent = signup ? "Creating account..." : "Signing in...";
    try {
      if (signup) {
        const { needsConfirmation } = await Cloud.signUp(email, password, $("auth-username").value);
        if (needsConfirmation) {
          friendsState.authMode = "signin";
          renderAuthForm(el);
          $("auth-msg").className = "form-msg ok";
          $("auth-msg").textContent = "Account created - check your email to confirm it, then sign in.";
          return;
        }
      } else {
        await Cloud.signIn(email, password);
      }
      await Cloud.getMyProfile();
      await syncOnOpen();
      await renderAll();
    } catch (err) {
      msg.className = "form-msg err";
      msg.textContent = err.message;
      btn.disabled = false;
    }
  });
}

async function renderFriends() {
  const el = $("friends-content");
  if (!Cloud.isConfigured()) { el.innerHTML = setupCard(); return; }
  const session = await Cloud.getSession();
  if (!session) { renderAuthForm(el); return; }

  const { profile } = await getAll();
  el.innerHTML = `
    <div class="account-row">
      <div class="account-info">
        <div class="acct-name">@${esc(profile ? profile.username : session.user.email)}</div>
        <div class="muted mono" id="sync-label"></div>
      </div>
      <button class="btn" id="fr-refresh">Refresh</button>
      <button class="btn" id="fr-signout">Sign out</button>
    </div>
    <form class="add-friend" id="fr-form">
      <input type="text" id="fr-username" placeholder="Friend's username" required />
      <button type="submit" class="btn btn-primary">Add friend</button>
    </form>
    <div id="fr-msg" class="form-msg"></div>
    <div id="fr-body"><div class="empty-state">Loading friends...</div></div>`;
  updateSyncLabel();

  $("fr-signout").addEventListener("click", async () => {
    await popupSignOut();
  });
  $("fr-refresh").addEventListener("click", async () => {
    await syncOnOpen();
    renderAll();
  });
  $("fr-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("fr-msg");
    const name = $("fr-username").value;
    try {
      await Cloud.sendFriendRequest(name);
      msg.className = "form-msg ok";
      msg.textContent = `Request sent to @${name.trim().replace(/^@/, "").toLowerCase()}. They'll see it in their Friends tab.`;
      $("fr-username").value = "";
      loadFriendsBody(session, profile);
    } catch (err) {
      msg.className = "form-msg err";
      msg.textContent = err.message;
    }
  });

  loadFriendsBody(session, profile);
}

async function loadFriendsBody(session, profile) {
  const body = $("fr-body");
  const uid = session.user.id;
  let rows, progressRows;
  try {
    rows = await Cloud.listFriendships();
    const accepted = rows.filter((r) => r.status === "accepted");
    progressRows = await Cloud.friendsProgress(accepted.map((r) => (r.requester === uid ? r.addressee : r.requester)));
  } catch (err) {
    body.innerHTML = `<div class="empty-state">Couldn't load friends: ${esc(err.message)}</div>`;
    return;
  }

  const other = (r) => (r.requester === uid ? r.addressee_profile : r.requester_profile) || { username: "unknown" };
  const incoming = rows.filter((r) => r.status === "pending" && r.addressee === uid);
  const outgoing = rows.filter((r) => r.status === "pending" && r.requester === uid);
  const progressById = Object.fromEntries(progressRows.map((p) => [p.user_id, p]));

  const d = await getAll();
  const people = [
    { me: true, name: profile ? profile.username : "you", stats: computeStats(shareData(d)), updated: d.lastSyncedAt }
  ];
  rows.filter((r) => r.status === "accepted").forEach((r) => {
    const p = other(r);
    const prog = progressById[p.id];
    people.push({ friendshipId: r.id, name: p.username, stats: computeStats((prog && prog.data) || {}), updated: prog && prog.updated_at });
  });
  people.sort((a, b) => b.stats.daysDone - a.stats.daysDone || b.stats.coding - a.stats.coding);
  const mine = people.find((p) => p.me).stats;

  const reqHtml = incoming.length ? `
    <div class="cat-label">Friend requests</div>
    ${incoming.map((r) => `
      <div class="req-row">
        <span><b>@${esc(other(r).username)}</b> wants to study together</span>
        <button class="btn btn-primary" data-accept="${r.id}">Accept</button>
        <button class="icon-btn" data-remove="${r.id}" title="Decline">✕</button>
      </div>`).join("")}` : "";

  const outHtml = outgoing.length ? `
    <div class="cat-label">Sent</div>
    ${outgoing.map((r) => `
      <div class="req-row muted">
        <span>@${esc(other(r).username)} · pending</span>
        <button class="btn" data-remove="${r.id}">Cancel</button>
      </div>`).join("")}` : "";

  const cards = people.map((p, i) => {
    const s = p.stats;
    const open = !p.me && friendsState.compareOpen.has(p.friendshipId);
    return `
      <div class="friend-card ${p.me ? "me" : ""}">
        <div class="friend-head">
          <span class="rank">#${i + 1}</span>
          <div class="friend-name">
            <b>@${esc(p.name)}</b>${p.me ? ` <span class="tag tag-you">You</span>` : ""}
            <div class="muted mono">${p.updated ? `${p.me ? "synced" : "active"} ${timeAgo(p.updated)}` : "no activity yet"}</div>
          </div>
          ${p.me ? "" : `
            <button class="btn" data-compare="${p.friendshipId}">${open ? "Hide" : "Compare"}</button>
            <button class="icon-btn" data-remove="${p.friendshipId}" data-confirm="1" title="Remove friend">✕</button>`}
        </div>
        <div class="friend-stats">
          <div><b>${s.daysDone}</b><span>days</span></div>
          <div><b>${s.coding}</b><span>problems</span></div>
          <div><b>${s.thisWeek}</b><span>this wk</span></div>
          <div><b>${s.streak}d</b><span>streak</span></div>
          <div><b>${s.sdDone}</b><span>sys des</span></div>
        </div>
        ${open ? compareHtml(mine, s, p.name) : ""}
      </div>`;
  }).join("");

  const empty = people.length === 1
    ? `<div class="empty-state">No friends yet. Send your username <b>@${esc(profile ? profile.username : "")}</b> to a friend and add theirs above.</div>`
    : "";

  body.innerHTML = `${reqHtml}${outHtml}<div class="cat-label">Leaderboard</div>${cards}${empty}`;

  body.querySelectorAll("[data-accept]").forEach((b) => b.addEventListener("click", async () => {
    await Cloud.acceptFriend(b.dataset.accept);
    loadFriendsBody(session, profile);
  }));
  body.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", async () => {
    if (b.dataset.confirm && !confirm("Remove this friend? You'll stop seeing each other's progress.")) return;
    await Cloud.removeFriendship(b.dataset.remove);
    loadFriendsBody(session, profile);
  }));
  body.querySelectorAll("[data-compare]").forEach((b) => b.addEventListener("click", () => {
    const id = Number(b.dataset.compare);
    if (friendsState.compareOpen.has(id)) friendsState.compareOpen.delete(id);
    else friendsState.compareOpen.add(id);
    loadFriendsBody(session, profile);
  }));
}

function compareHtml(me, them, name) {
  const row = (label, a, b, total) => `
    <div class="cmp-row">
      <div class="cmp-label">${esc(label)}</div>
      <div class="cmp-bars">
        <div class="cmp-line"><span class="cmp-who">you</span>${bar(a, total, "bar-sm")}<span class="cmp-n">${a}</span></div>
        <div class="cmp-line them"><span class="cmp-who">them</span>${bar(b, total, "bar-sm bar-alt")}<span class="cmp-n">${b}</span></div>
      </div>
    </div>`;
  const score = (s) => s.byDiff.E + s.byDiff.M * 2 + s.byDiff.H * 3;
  // Only patterns where at least one of you has started, so the panel stays short.
  const patternRows = CODING_PATTERNS
    .filter((p) => me.byPattern[p.id] || them.byPattern[p.id])
    .map((p) => row(p.name, me.byPattern[p.id] || 0, them.byPattern[p.id] || 0, p.problems.length))
    .join("");
  return `
    <div class="compare">
      <div class="compare-title">You vs @${esc(name)}</div>
      ${row("Weighted score (Easy 1 · Med 2 · Hard 3)", score(me), score(them), Math.max(1, score(me), score(them)))}
      ${patternRows || `<div class="compare-note">Neither of you has solved a pattern problem yet.</div>`}
      ${row("90-day calendar", me.daysDone, them.daysDone, me.daysTotal)}
      ${row("System design", me.sdDone, them.sdDone, me.sdTotal)}
      ${row("Study plan tasks", me.planDone, them.planDone, me.planTotal)}
    </div>`;
}

// ---------- Applications ----------
function appRowTemplate(app) {
  const pendingClass = app.source === "gmail-auto" && !app.confirmed ? "pending" : "";
  const badge = pendingClass
    ? `<span class="pending-badge">Auto-detected - review</span>`
    : `<span class="date-mono">${app.source === "gmail-auto" ? "via gmail" : "manual"}</span>`;

  const actionBtns = pendingClass
    ? `<button class="btn btn-primary confirm-btn" data-id="${app.id}">Confirm</button>
       <button class="icon-btn dismiss-btn" data-id="${app.id}" title="Dismiss">✕</button>`
    : `<button class="icon-btn delete-btn" data-id="${app.id}" title="Delete">🗑</button>`;

  return `
    <div class="app-item ${pendingClass}" data-id="${app.id}">
      <div class="app-row">
        <input type="text" class="company-input" data-field="company" data-id="${app.id}" value="${esc(app.company)}" placeholder="Company" />
        ${actionBtns}
      </div>
      <div class="meta-row">
        <input type="text" data-field="position" data-id="${app.id}" value="${esc(app.position || "")}" placeholder="Position" style="flex:1" />
        <input type="date" data-field="dateApplied" data-id="${app.id}" value="${app.dateApplied || ""}" />
      </div>
      <div class="meta-row">
        <select data-field="status" data-id="${app.id}">
          ${["Applied", "OA", "Phone Screen", "Onsite", "Offer", "Rejected"]
            .map((s) => `<option ${s === app.status ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
        ${badge}
      </div>
      ${app.subject ? `<div class="meta-row"><span class="date-mono" title="Original email subject">${esc(app.subject)}</span></div>` : ""}
    </div>
  `;
}

async function renderApplications() {
  const data = await getAll();
  const applications = data.applications || [];
  const pending = applications.filter((a) => a.source === "gmail-auto" && !a.confirmed);
  const rest = applications.filter((a) => !(a.source === "gmail-auto" && !a.confirmed));

  const list = $("applications-list");
  if (applications.length === 0) {
    list.innerHTML = `<div class="empty-state">No applications yet. Add one manually, or connect Gmail to auto-detect them.</div>`;
  } else {
    list.innerHTML = pending.map(appRowTemplate).join("") + rest.map(appRowTemplate).join("");
  }

  list.querySelectorAll("input, select").forEach((inp) => {
    inp.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const field = e.target.dataset.field;
      const d = await getAll();
      const apps = d.applications || [];
      const idx = apps.findIndex((a) => a.id === id);
      if (idx >= 0) {
        apps[idx][field] = e.target.value;
        await setKeys({ applications: apps });
        await markAppsChanged();
      }
    });
  });

  list.querySelectorAll(".confirm-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const d = await getAll();
      const apps = d.applications || [];
      const idx = apps.findIndex((a) => a.id === id);
      if (idx >= 0) apps[idx].confirmed = true;
      await setKeys({ applications: apps });
      await markAppsChanged();
      renderApplications();
      renderDashboard();
    });
  });

  list.querySelectorAll(".dismiss-btn, .delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const d = await getAll();
      const apps = (d.applications || []).filter((a) => a.id !== id);
      await setKeys({ applications: apps });
      await markAppsChanged();
      renderApplications();
      renderDashboard();
    });
  });
}

// Gmail detection only shows once a Google client ID is configured for this extension.
function gmailAvailable() {
  const oauth = chrome.runtime.getManifest().oauth2;
  return !!(oauth && oauth.client_id && !oauth.client_id.includes("PASTE_YOUR"));
}

function initApplicationControls() {
  if (!gmailAvailable()) {
    $("sync-gmail-btn").hidden = true;
    $("connect-gmail-btn").hidden = true;
  }
  const form = $("add-application-form");
  $("add-application-btn").addEventListener("click", () => {
    form.classList.toggle("hidden");
  });
  $("af-cancel").addEventListener("click", () => {
    form.classList.add("hidden");
  });
  $("af-save").addEventListener("click", async () => {
    const company = $("af-company").value.trim();
    if (!company) return;
    const newApp = {
      id: `manual-${Date.now()}`,
      company,
      position: $("af-position").value.trim(),
      dateApplied: $("af-date").value || dateStr(),
      status: $("af-status").value,
      source: "manual",
      confirmed: true,
      notes: ""
    };
    const d = await getAll();
    const apps = d.applications || [];
    apps.push(newApp);
    await setKeys({ applications: apps });
    await markAppsChanged();
    ["af-company", "af-position", "af-date"].forEach((id) => ($(id).value = ""));
    form.classList.add("hidden");
    renderApplications();
    renderDashboard();
  });

  $("sync-gmail-btn").addEventListener("click", async (e) => {
    const btn = e.target;
    btn.textContent = "Syncing...";
    btn.disabled = true;
    chrome.runtime.sendMessage({ type: "SYNC_NOW" }, (resp) => {
      btn.disabled = false;
      btn.textContent = "Sync Gmail now";
      if (resp && resp.ok) {
        renderApplications();
        renderDashboard();
      } else {
        alert("Couldn't sync yet. Click 'Connect Gmail' first, then try again.");
      }
    });
  });

  $("connect-gmail-btn").addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        alert("Couldn't connect to Gmail. Please try again.");
        return;
      }
      chrome.runtime.sendMessage({ type: "SYNC_NOW" }, () => {
        renderApplications();
        renderDashboard();
      });
    });
  });
}

// ---------- Study Plan ----------
async function renderStudyPlan() {
  const data = await getAll();
  const progress = data.studyProgress || {};
  const { weekIndex } = getCurrentWeekInfo();
  const catLabels = { dsa: "Coding / DSA", lld: "LLD / OOD", hld: "HLD / System Design", behavioral: "Behavioral" };

  const container = $("studyplan-list");
  container.innerHTML = STUDY_PLAN.map((w, i) => {
    const categories = PLAN_CATS.filter((c) => w[c]);
    const body = categories.map((c) => `
      <div class="cat-label">${catLabels[c]}</div>
      ${w[c].map((task, idx) => {
        const key = `${w.week}-${c}-${idx}`;
        const checked = !!progress[key];
        return `<div class="task-row ${checked ? "done" : ""}">
          <input type="checkbox" id="cb-${key}" data-key="${key}" ${checked ? "checked" : ""} />
          <label for="cb-${key}">${esc(task)}</label>
        </div>`;
      }).join("")}
    `).join("");

    return `
      <div class="week-block ${i === weekIndex ? "current" : ""}" data-week="${w.week}">
        <div class="week-header" data-idx="${i}">
          <div class="ring ring-sm" id="ring-week-${w.week}"><div class="ring-inner"></div></div>
          <div class="week-title">
            <div class="week-num">Week ${w.week}${i === weekIndex ? " · now" : ""}</div>
            <div class="week-theme-sm">${esc(w.theme)}</div>
          </div>
        </div>
        <div class="week-body ${i === weekIndex ? "open" : ""}">${body}</div>
      </div>
    `;
  }).join("");

  STUDY_PLAN.forEach((w) => {
    let total = 0, done = 0;
    PLAN_CATS.forEach((c) => {
      if (w[c]) w[c].forEach((_, idx) => {
        total++;
        if (progress[`${w.week}-${c}-${idx}`]) done++;
      });
    });
    const ring = $(`ring-week-${w.week}`);
    if (ring) setRing(ring, total ? (done / total) * 100 : 0);
  });

  container.querySelectorAll(".week-header").forEach((h) => {
    h.addEventListener("click", () => {
      h.nextElementSibling.classList.toggle("open");
    });
  });

  container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", async (e) => {
      const key = e.target.dataset.key;
      const d = await getAll();
      const progress = d.studyProgress || {};
      progress[key] = e.target.checked;
      await setKeys({ studyProgress: progress });
      await markChanged();
      renderStudyPlan();
      renderDashboard();
    });
  });
}

// ---------- Resources ----------
async function renderResources() {
  const { customResources = [] } = await getAll();
  $("resources-list").innerHTML = Object.entries(allResources(customResources)).map(([group, links]) => `
    <div class="res-group">
      <h3>${esc(group)}</h3>
      ${links.map((l) => `<a class="res-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}</a>`).join("")}
    </div>
  `).join("");
}

// ---------- Init ----------
async function renderAll() {
  await renderAccountChip();
  await renderDashboard();
  await renderCoding();
  await renderSystemDesign();
  await renderStudyPlan();
  await renderApplications();
  await renderFriends();
  await renderResources();
}

document.addEventListener("DOMContentLoaded", async () => {
  initTabs();
  initPractice();
  initApplicationControls();

  const { lastTab } = await chrome.storage.local.get("lastTab");
  if (lastTab && $(lastTab)) switchTab(lastTab);

  await renderAll();          // render local data immediately
  const session = Cloud.isConfigured() ? await Cloud.getSession() : null;
  if (session) {
    await syncOnOpen();       // then pull from the cloud and re-render if anything changed
    await renderAll();
  }
});
