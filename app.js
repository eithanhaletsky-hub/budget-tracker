/* ===== ניהול תקציב — לוגיקה ===== *
 * כל הנתונים נשמרים ב-localStorage, במכשיר המשתמש בלבד.
 * ללא שרת, ללא API, ללא מעקב.
 */

(() => {
  "use strict";

  const K = {
    tx: "budgethelper.transactions.v1",
    budget: "budgethelper.budgets.v1",
    goals: "budgethelper.goals.v1",
    recurring: "budgethelper.recurring.v1",
    recApplied: "budgethelper.recApplied.v1",
    theme: "budgethelper.theme",
  };

  /* ---------- קטגוריות ---------- */
  const CATEGORIES = {
    expense: [
      { id: "food", name: "מזון וסופר", icon: "🛒", color: "#f97316" },
      { id: "dining", name: "מסעדות ובתי קפה", icon: "🍔", color: "#ef4444" },
      { id: "transport", name: "תחבורה", icon: "🚗", color: "#3b82f6" },
      { id: "housing", name: "דיור וחשבונות", icon: "🏠", color: "#8b5cf6" },
      { id: "shopping", name: "קניות", icon: "🛍️", color: "#ec4899" },
      { id: "health", name: "בריאות", icon: "💊", color: "#14b8a6" },
      { id: "entertainment", name: "בילויים", icon: "🎬", color: "#f59e0b" },
      { id: "education", name: "חינוך", icon: "📚", color: "#6366f1" },
      { id: "other_exp", name: "אחר", icon: "📌", color: "#64748b" },
    ],
    income: [
      { id: "salary", name: "משכורת", icon: "💼", color: "#16a34a" },
      { id: "allowance", name: "דמי כיס", icon: "🪙", color: "#22c55e" },
      { id: "gift", name: "מתנה", icon: "🎁", color: "#84cc16" },
      { id: "freelance", name: "עבודה עצמאית", icon: "💻", color: "#0ea5e9" },
      { id: "refund", name: "החזר", icon: "↩️", color: "#06b6d4" },
      { id: "other_inc", name: "אחר", icon: "📌", color: "#10b981" },
    ],
  };
  const GOAL_EMOJIS = ["🎯", "🎧", "📱", "💻", "🎮", "✈️", "🚲", "👟", "🎸", "📷", "🏖️", "🎁", "💍", "🚗", "🏠", "💰"];

  const allCats = [...CATEGORIES.expense, ...CATEGORIES.income];
  const catById = (id) => allCats.find((c) => c.id === id) || { name: "לא ידוע", icon: "❓", color: "#94a3b8" };

  /* ---------- מצב ---------- */
  let transactions = load(K.tx, []);
  let budgets = load(K.budget, {});
  let goals = load(K.goals, []);
  let recurring = load(K.recurring, []);
  let recApplied = load(K.recApplied, {}); // { "recId:YYYY-MM": true }
  let currentType = "expense";
  let editType = "expense";
  let currentMonth = ymNow();
  let editingId = null;
  let contribGoalId = null;
  let selectedGoalEmoji = GOAL_EMOJIS[0];

  /* ---------- אחסון ---------- */
  function load(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
  function save() {
    localStorage.setItem(K.tx, JSON.stringify(transactions));
    localStorage.setItem(K.budget, JSON.stringify(budgets));
    localStorage.setItem(K.goals, JSON.stringify(goals));
    localStorage.setItem(K.recurring, JSON.stringify(recurring));
    localStorage.setItem(K.recApplied, JSON.stringify(recApplied));
  }

  /* ---------- תאריך/מספר ---------- */
  function ymNow() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
  function ymOf(s) { return s.slice(0, 7); }
  function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
  const fmt = (n) => "₪" + Number(n).toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fmtShort = (n) => { n = Math.round(n); return n >= 1000 ? "₪" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "K" : "₪" + n; };
  function monthLabel(ym) { const [y, m] = ym.split("-"); const names = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"]; return `${names[+m - 1]} ${y}`; }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* ---------- אלמנטים ---------- */
  const $ = (id) => document.getElementById(id);
  const el = {
    monthSelect: $("monthSelect"), prevMonth: $("prevMonth"), nextMonth: $("nextMonth"),
    totalIncome: $("totalIncome"), totalExpense: $("totalExpense"), balance: $("balance"),
    budgetValue: $("budgetValue"), budgetBar: $("budgetBar"), budgetBarFill: $("budgetBarFill"), budgetHint: $("budgetHint"), editBudget: $("editBudget"),
    insightsGrid: $("insightsGrid"),
    form: $("txForm"), amount: $("amount"), category: $("category"), description: $("description"), date: $("date"), isRecurring: $("isRecurring"),
    submitBtn: $("submitBtn"), typeBtns: document.querySelectorAll(".type-toggle .type-btn:not(.edit-type)"),
    txList: $("txList"), listEmpty: $("listEmpty"), listHint: $("listHint"),
    searchInput: $("searchInput"), filterType: $("filterType"), filterCategory: $("filterCategory"),
    pieChart: $("pieChart"), pieLegend: $("pieLegend"), pieEmpty: $("pieEmpty"), barChart: $("barChart"),
    goalsGrid: $("goalsGrid"), goalsEmpty: $("goalsEmpty"), addGoal: $("addGoal"),
    recurringList: $("recurringList"), recurringEmpty: $("recurringEmpty"),
    exportJson: $("exportJson"), exportCsv: $("exportCsv"), importBtn: $("importBtn"), importFile: $("importFile"), clearAll: $("clearAll"),
    themeToggle: $("themeToggle"),
    budgetModal: $("budgetModal"), budgetInput: $("budgetInput"), budgetSave: $("budgetSave"), budgetCancel: $("budgetCancel"), budgetClear: $("budgetClear"),
    editModal: $("editModal"), editAmount: $("editAmount"), editCategory: $("editCategory"), editDescription: $("editDescription"), editDate: $("editDate"),
    editSave: $("editSave"), editCancel: $("editCancel"), editDelete: $("editDelete"), editTypeBtns: document.querySelectorAll(".edit-type"),
    goalModal: $("goalModal"), goalName: $("goalName"), goalTarget: $("goalTarget"), goalSaved: $("goalSaved"), goalEmojiPicker: $("goalEmojiPicker"), goalSave: $("goalSave"), goalCancel: $("goalCancel"),
    contribModal: $("contribModal"), contribSub: $("contribSub"), contribAmount: $("contribAmount"), contribSave: $("contribSave"), contribCancel: $("contribCancel"),
    toast: $("toast"), confetti: $("confettiCanvas"),
  };

  /* ---------- ערכת נושא ---------- */
  function initTheme() {
    const saved = localStorage.getItem(K.theme);
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    el.themeToggle.textContent = dark ? "☀️" : "🌙";
  }
  el.themeToggle.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") !== "dark";
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem(K.theme, dark ? "dark" : "light");
    el.themeToggle.textContent = dark ? "☀️" : "🌙";
    renderCharts();
  });

  /* ---------- טופס הוספה ---------- */
  function fillCatSelect(sel, type) {
    sel.innerHTML = CATEGORIES[type].map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("");
  }
  el.typeBtns.forEach((btn) => btn.addEventListener("click", () => {
    currentType = btn.dataset.type;
    el.typeBtns.forEach((b) => b.classList.toggle("active", b === btn));
    el.submitBtn.textContent = currentType === "expense" ? "הוסף הוצאה" : "הוסף הכנסה";
    fillCatSelect(el.category, currentType);
  }));

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(el.amount.value);
    if (!(amount > 0)) { toast("נא להזין סכום חוקי"); return; }
    const tx = { id: uid(), type: currentType, amount: round2(amount), category: el.category.value, description: el.description.value.trim(), date: el.date.value || todayStr() };
    if (el.isRecurring.checked) {
      const rec = { id: uid(), type: tx.type, amount: tx.amount, category: tx.category, description: tx.description, day: +tx.date.split("-")[2], createdMonth: ymOf(tx.date) };
      recurring.push(rec);
      recApplied[`${rec.id}:${ymOf(tx.date)}`] = true; // this instance counts as applied for its month
      tx.recurringId = rec.id;
    }
    transactions.push(tx);
    save();
    el.form.reset();
    el.date.value = todayStr();
    el.isRecurring.checked = false;
    const m = ymOf(tx.date);
    if (m !== currentMonth) { currentMonth = m; el.monthSelect.value = m; }
    renderAll();
    toast(currentType === "expense" ? "הוצאה נוספה ✅" : "הכנסה נוספה ✅");
  });
  const round2 = (n) => Math.round(n * 100) / 100;

  /* ---------- תנועות קבועות ---------- */
  // מוסיף אוטומטית תנועות קבועות לחודש הנוכחי האמיתי אם עוד לא נוספו.
  function applyRecurring() {
    const now = ymNow();
    let added = 0;
    recurring.forEach((rec) => {
      if (rec.createdMonth > now) return;
      const key = `${rec.id}:${now}`;
      if (recApplied[key]) return;
      const day = Math.min(rec.day || 1, 28);
      transactions.push({ id: uid(), type: rec.type, amount: rec.amount, category: rec.category, description: rec.description, date: `${now}-${String(day).padStart(2, "0")}`, recurringId: rec.id });
      recApplied[key] = true;
      added++;
    });
    if (added > 0) save();
    return added;
  }
  function deleteRecurring(id) {
    if (!confirm("להסיר את התנועה הקבועה? תנועות שכבר נוספו יישארו.")) return;
    recurring = recurring.filter((r) => r.id !== id);
    save(); renderRecurring();
    toast("התנועה הקבועה הוסרה");
  }

  /* ---------- ניווט חודשים ---------- */
  function shiftMonth(d) {
    const [y, m] = currentMonth.split("-").map(Number);
    const nd = new Date(y, m - 1 + d, 1);
    currentMonth = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`;
    el.monthSelect.value = currentMonth; renderAll();
  }
  el.prevMonth.addEventListener("click", () => shiftMonth(-1));
  el.nextMonth.addEventListener("click", () => shiftMonth(1));
  el.monthSelect.addEventListener("change", () => { currentMonth = el.monthSelect.value || ymNow(); renderAll(); });
  [el.searchInput, el.filterType, el.filterCategory].forEach((c) => c.addEventListener("input", renderList));

  const monthTx = () => transactions.filter((t) => ymOf(t.date) === currentMonth);
  const sum = (arr) => arr.reduce((s, t) => s + t.amount, 0);

  /* ---------- סיכום + count-up ---------- */
  function animateValue(node, to) {
    const from = parseFloat(node.dataset.value || "0");
    if (from === to) { node.textContent = fmt(to); return; }
    node.dataset.value = to;
    const dur = 500, t0 = performance.now();
    node.classList.add("bump");
    setTimeout(() => node.classList.remove("bump"), 400);
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step);
      else node.textContent = fmt(to);
    })(t0);
  }

  function renderSummary() {
    const txs = monthTx();
    const income = sum(txs.filter((t) => t.type === "income"));
    const expense = sum(txs.filter((t) => t.type === "expense"));
    animateValue(el.totalIncome, income);
    animateValue(el.totalExpense, expense);
    animateValue(el.balance, income - expense);
    el.balance.classList.toggle("negative", income - expense < 0);

    const budget = budgets[currentMonth];
    if (budget > 0) {
      el.budgetValue.textContent = fmt(budget);
      el.budgetBar.hidden = false;
      const pct = Math.min(100, (expense / budget) * 100);
      el.budgetBarFill.style.width = pct + "%";
      el.budgetBarFill.style.background = pct >= 100 ? "var(--grad-expense)" : pct >= 80 ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "var(--grad-income)";
      const rem = budget - expense;
      if (rem >= 0) { el.budgetHint.textContent = `נותרו ${fmt(rem)} (${Math.round(pct)}% נוצל)`; el.budgetHint.style.color = pct >= 80 ? "var(--budget)" : "var(--text-muted)"; }
      else { el.budgetHint.textContent = `⚠️ חריגה של ${fmt(-rem)}!`; el.budgetHint.style.color = "var(--expense)"; }
    } else {
      el.budgetValue.textContent = "—"; el.budgetBar.hidden = true;
      el.budgetHint.textContent = "לא הוגדר תקציב לחודש זה"; el.budgetHint.style.color = "var(--text-muted)";
    }
  }

  /* ---------- תובנות חכמות ---------- */
  function renderInsights() {
    const txs = monthTx();
    const expenses = txs.filter((t) => t.type === "expense");
    const totalExp = sum(expenses);
    const cards = [];

    // ממוצע הוצאה יומית
    const [y, m] = currentMonth.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const isCurrent = currentMonth === ymNow();
    const dayNow = new Date().getDate();
    const daysElapsed = isCurrent ? dayNow : daysInMonth;
    const dailyAvg = daysElapsed > 0 ? totalExp / daysElapsed : 0;
    cards.push({ emoji: "📅", bg: "#3b82f6", label: "ממוצע הוצאה יומית", value: fmt(dailyAvg), sub: `על פני ${daysElapsed} ימים` });

    // קטגוריה יקרה
    if (expenses.length) {
      const byCat = {};
      expenses.forEach((t) => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
      const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
      const c = catById(top[0]);
      cards.push({ emoji: c.icon, bg: c.color, label: "הקטגוריה היקרה ביותר", value: c.name, sub: `${fmt(top[1])} · ${Math.round(top[1] / totalExp * 100)}%` });
    } else {
      cards.push({ emoji: "🧾", bg: "#64748b", label: "הקטגוריה היקרה ביותר", value: "—", sub: "אין הוצאות עדיין" });
    }

    // תחזית סוף חודש
    if (isCurrent && totalExp > 0) {
      const projected = dailyAvg * daysInMonth;
      cards.push({ emoji: "🔮", bg: "#8b5cf6", label: "תחזית להוצאות החודש", value: fmt(projected), sub: `בקצב הנוכחי` });
    } else {
      cards.push({ emoji: "💸", bg: "#8b5cf6", label: "סך ההוצאות", value: fmt(totalExp), sub: monthLabel(currentMonth) });
    }

    // השוואה לחודש קודם
    const prev = prevMonthOf(currentMonth);
    const prevExp = sum(transactions.filter((t) => t.type === "expense" && ymOf(t.date) === prev));
    if (prevExp > 0) {
      const diff = totalExp - prevExp;
      const pct = Math.round(Math.abs(diff) / prevExp * 100);
      const up = diff > 0;
      cards.push({ emoji: up ? "📈" : "📉", bg: up ? "#f43f5e" : "#10b981", label: "לעומת החודש הקודם", value: (up ? "+" : "−") + pct + "%", sub: `${up ? "יותר" : "פחות"} ב-${fmt(Math.abs(diff))}` });
    } else {
      cards.push({ emoji: "✨", bg: "#f59e0b", label: "לעומת החודש הקודם", value: "—", sub: "אין נתונים להשוואה" });
    }

    el.insightsGrid.innerHTML = cards.map((c) => `
      <div class="insight">
        <div class="insight-emoji" style="background:${c.bg}22;color:${c.bg}">${c.emoji}</div>
        <div class="insight-body">
          <div class="insight-label">${c.label}</div>
          <div class="insight-value">${escapeHtml(c.value)}</div>
          <div class="insight-sub">${escapeHtml(c.sub)}</div>
        </div>
      </div>`).join("");
  }
  function prevMonthOf(ym) { const [y, m] = ym.split("-").map(Number); const d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

  /* ---------- רשימת תנועות ---------- */
  function renderList() {
    const search = el.searchInput.value.trim().toLowerCase();
    const fType = el.filterType.value, fCat = el.filterCategory.value;

    const present = [...new Set(monthTx().map((t) => t.category))];
    const cur = el.filterCategory.value;
    el.filterCategory.innerHTML = `<option value="all">כל הקטגוריות</option>` + present.map((id) => { const c = catById(id); return `<option value="${id}">${c.icon} ${c.name}</option>`; }).join("");
    if ([...el.filterCategory.options].some((o) => o.value === cur)) el.filterCategory.value = cur;

    let txs = monthTx();
    if (fType !== "all") txs = txs.filter((t) => t.type === fType);
    if (fCat !== "all") txs = txs.filter((t) => t.category === fCat);
    if (search) txs = txs.filter((t) => { const c = catById(t.category); return (t.description || "").toLowerCase().includes(search) || c.name.toLowerCase().includes(search) || String(t.amount).includes(search); });
    txs.sort((a, b) => (b.date === a.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));

    el.listEmpty.hidden = txs.length > 0;
    el.listHint.hidden = txs.length === 0;
    if (txs.length === 0) el.listEmpty.textContent = monthTx().length === 0 ? "עדיין אין תנועות בחודש זה. הוסף את הראשונה! 👈" : "לא נמצאו תנועות התואמות לסינון.";

    el.txList.innerHTML = txs.map((t) => {
      const c = catById(t.category);
      const sign = t.type === "income" ? "+" : "−";
      const dateFmt = t.date.split("-").reverse().join("/");
      return `<div class="tx-item" data-id="${t.id}">
        <div class="tx-icon" style="background:${c.color}22;">${c.icon}</div>
        <div class="tx-body">
          <div class="tx-cat">${c.name}${t.recurringId ? '<span class="tx-recur-badge">🔁 קבוע</span>' : ""}</div>
          <div class="tx-meta"><span>${dateFmt}</span>${t.description ? `<span class="tx-desc">• ${escapeHtml(t.description)}</span>` : ""}</div>
        </div>
        <div class="tx-amount ${t.type}">${sign}${fmt(t.amount).replace("₪", "")}₪</div>
        <button class="tx-del" data-del="${t.id}" title="מחק" aria-label="מחק תנועה">🗑️</button>
      </div>`;
    }).join("");

    el.txList.querySelectorAll(".tx-item").forEach((item) => {
      item.addEventListener("click", (e) => { if (e.target.closest(".tx-del")) return; openEdit(item.dataset.id); });
    });
    el.txList.querySelectorAll(".tx-del").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); deleteTx(b.dataset.del); }));
  }
  function deleteTx(id) { transactions = transactions.filter((t) => t.id !== id); save(); renderAll(); toast("התנועה נמחקה"); }

  /* ---------- עריכת תנועה ---------- */
  function setEditType(type) {
    editType = type;
    el.editTypeBtns.forEach((b) => b.classList.toggle("active", b.dataset.type === type));
    const prev = el.editCategory.value;
    fillCatSelect(el.editCategory, type);
    if ([...el.editCategory.options].some((o) => o.value === prev)) el.editCategory.value = prev;
  }
  el.editTypeBtns.forEach((b) => b.addEventListener("click", () => setEditType(b.dataset.type)));
  function openEdit(id) {
    const t = transactions.find((x) => x.id === id);
    if (!t) return;
    editingId = id;
    setEditType(t.type);
    el.editCategory.value = t.category;
    el.editAmount.value = t.amount;
    el.editDescription.value = t.description || "";
    el.editDate.value = t.date;
    el.editModal.hidden = false;
    el.editAmount.focus();
  }
  function closeEdit() { el.editModal.hidden = true; editingId = null; }
  el.editCancel.addEventListener("click", closeEdit);
  el.editModal.addEventListener("click", (e) => { if (e.target === el.editModal) closeEdit(); });
  el.editSave.addEventListener("click", () => {
    const t = transactions.find((x) => x.id === editingId);
    if (!t) return closeEdit();
    const amt = parseFloat(el.editAmount.value);
    if (!(amt > 0)) { toast("נא להזין סכום חוקי"); return; }
    t.type = editType; t.amount = round2(amt); t.category = el.editCategory.value;
    t.description = el.editDescription.value.trim(); t.date = el.editDate.value || t.date;
    save(); closeEdit();
    if (ymOf(t.date) !== currentMonth) { currentMonth = ymOf(t.date); el.monthSelect.value = currentMonth; }
    renderAll(); toast("התנועה עודכנה ✅");
  });
  el.editDelete.addEventListener("click", () => { const id = editingId; closeEdit(); deleteTx(id); });

  /* ---------- גרפים ---------- */
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function renderCharts() { renderPie(); renderBar(); }

  function renderPie() {
    const ctx = el.pieChart.getContext("2d");
    const size = el.pieChart.width;
    ctx.clearRect(0, 0, size, size);
    const expenses = monthTx().filter((t) => t.type === "expense");
    const byCat = {};
    expenses.forEach((t) => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    el.pieEmpty.hidden = entries.length > 0;
    if (!entries.length) { el.pieLegend.innerHTML = ""; return; }

    const cx = size / 2, cy = size / 2, r = size / 2 - 6, inner = r * 0.6;
    let start = -Math.PI / 2;
    entries.forEach(([id, val]) => {
      const c = catById(id), angle = (val / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + angle); ctx.closePath();
      ctx.fillStyle = c.color; ctx.fill();
      ctx.strokeStyle = cssVar("--surface"); ctx.lineWidth = 3; ctx.stroke();
      start += angle;
    });
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = cssVar("--surface"); ctx.fill();
    ctx.fillStyle = cssVar("--text"); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 20px sans-serif"; ctx.fillText(fmtShort(total), cx, cy - 6);
    ctx.fillStyle = cssVar("--text-muted"); ctx.font = "12px sans-serif"; ctx.fillText("סה\"כ הוצאות", cx, cy + 14);

    el.pieLegend.innerHTML = entries.map(([id, val]) => {
      const c = catById(id), pct = Math.round(val / total * 100);
      return `<div class="leg-item"><span class="leg-color" style="background:${c.color}"></span><span class="leg-name">${c.icon} ${c.name}</span><span class="leg-val">${pct}%</span></div>`;
    }).join("");
  }

  function renderBar() {
    const ctx = el.barChart.getContext("2d");
    const W = el.barChart.width, H = el.barChart.height;
    ctx.clearRect(0, 0, W, H);
    const months = [];
    const [y, m] = currentMonth.split("-").map(Number);
    for (let i = 5; i >= 0; i--) { const d = new Date(y, m - 1 - i, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
    const data = months.map((ym) => { const txs = transactions.filter((t) => ymOf(t.date) === ym); return { ym, income: sum(txs.filter((t) => t.type === "income")), expense: sum(txs.filter((t) => t.type === "expense")) }; });
    const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
    const padTop = 12, padBottom = 26, padX = 10, chartH = H - padTop - padBottom;
    const groupW = (W - padX * 2) / months.length, barW = groupW * 0.3;

    ctx.strokeStyle = cssVar("--border"); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, H - padBottom); ctx.lineTo(W - padX, H - padBottom); ctx.stroke();
    const incC = cssVar("--income"), expC = cssVar("--expense"), muted = cssVar("--text-muted");
    data.forEach((d, i) => {
      const gx = padX + i * groupW + groupW / 2;
      const ih = (d.income / max) * chartH, eh = (d.expense / max) * chartH;
      ctx.fillStyle = incC; roundRect(ctx, gx - barW - 2, H - padBottom - ih, barW, ih, 3);
      ctx.fillStyle = expC; roundRect(ctx, gx + 2, H - padBottom - eh, barW, eh, 3);
      ctx.fillStyle = muted; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.font = "11px sans-serif";
      const label = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"][+d.ym.split("-")[1] - 1];
      ctx.fillText(label, gx, H - padBottom + 6);
    });
  }
  function roundRect(ctx, x, y, w, h, r) { if (h <= 0) return; r = Math.min(r, w / 2, h); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, 0); ctx.arcTo(x, y + h, x, y, 0); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); }

  /* ---------- יעדי חיסכון ---------- */
  function renderGoals() {
    el.goalsEmpty.hidden = goals.length > 0;
    el.goalsGrid.innerHTML = goals.map((g) => {
      const pct = Math.min(100, Math.round(g.saved / g.target * 100));
      const done = g.saved >= g.target;
      return `<div class="goal ${done ? "done" : ""}" data-id="${g.id}">
        <div class="goal-head">
          <span class="goal-emoji">${g.emoji || "🎯"}</span>
          <span class="goal-name">${escapeHtml(g.name)}</span>
          <span class="goal-actions">
            <button class="goal-mini" data-edit="${g.id}" title="ערוך">✏️</button>
            <button class="goal-mini" data-del="${g.id}" title="מחק">🗑️</button>
          </span>
        </div>
        <div class="goal-amounts"><span class="goal-saved">${fmt(g.saved)}</span><span class="goal-target">מתוך ${fmt(g.target)}</span></div>
        <div class="goal-bar"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
        <div class="goal-foot">
          ${done ? '<span class="goal-done-badge">🎉 הושג!</span>' : `<span class="goal-pct">${pct}%</span>`}
          <button class="goal-add" data-add="${g.id}">+ הוסף לחיסכון</button>
        </div>
      </div>`;
    }).join("");
    el.goalsGrid.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => openContrib(b.dataset.add)));
    el.goalsGrid.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteGoal(b.dataset.del)));
    el.goalsGrid.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openGoalModal(b.dataset.edit)));
  }

  let editingGoalId = null;
  function renderEmojiPicker() {
    el.goalEmojiPicker.innerHTML = GOAL_EMOJIS.map((e) => `<button type="button" class="emoji-opt ${e === selectedGoalEmoji ? "selected" : ""}" data-emoji="${e}">${e}</button>`).join("");
    el.goalEmojiPicker.querySelectorAll(".emoji-opt").forEach((b) => b.addEventListener("click", () => { selectedGoalEmoji = b.dataset.emoji; el.goalEmojiPicker.querySelectorAll(".emoji-opt").forEach((x) => x.classList.toggle("selected", x === b)); }));
  }
  function openGoalModal(id) {
    editingGoalId = id || null;
    if (id) {
      const g = goals.find((x) => x.id === id);
      el.goalName.value = g.name; el.goalTarget.value = g.target; el.goalSaved.value = g.saved; selectedGoalEmoji = g.emoji || GOAL_EMOJIS[0];
    } else { el.goalName.value = ""; el.goalTarget.value = ""; el.goalSaved.value = ""; selectedGoalEmoji = GOAL_EMOJIS[0]; }
    renderEmojiPicker();
    el.goalModal.hidden = false; el.goalName.focus();
  }
  function closeGoalModal() { el.goalModal.hidden = true; editingGoalId = null; }
  el.addGoal.addEventListener("click", () => openGoalModal(null));
  el.goalCancel.addEventListener("click", closeGoalModal);
  el.goalModal.addEventListener("click", (e) => { if (e.target === el.goalModal) closeGoalModal(); });
  el.goalSave.addEventListener("click", () => {
    const name = el.goalName.value.trim(), target = parseFloat(el.goalTarget.value), saved = parseFloat(el.goalSaved.value) || 0;
    if (!name) { toast("נא להזין שם ליעד"); return; }
    if (!(target > 0)) { toast("נא להזין סכום יעד חוקי"); return; }
    if (editingGoalId) {
      const g = goals.find((x) => x.id === editingGoalId);
      const wasDone = g.saved >= g.target;
      g.name = name; g.target = target; g.saved = saved; g.emoji = selectedGoalEmoji;
      if (!wasDone && saved >= target) celebrate();
    } else {
      goals.push({ id: uid(), name, target, saved, emoji: selectedGoalEmoji });
      if (saved >= target) celebrate();
    }
    save(); closeGoalModal(); renderGoals(); toast("היעד נשמר 🎯");
  });
  function deleteGoal(id) { if (!confirm("למחוק את היעד?")) return; goals = goals.filter((g) => g.id !== id); save(); renderGoals(); toast("היעד נמחק"); }

  function openContrib(id) {
    contribGoalId = id;
    const g = goals.find((x) => x.id === id);
    el.contribSub.textContent = `${g.emoji || "🎯"} ${g.name} — נחסך ${fmt(g.saved)} מתוך ${fmt(g.target)}`;
    el.contribAmount.value = ""; el.contribModal.hidden = false; el.contribAmount.focus();
  }
  function closeContrib() { el.contribModal.hidden = true; contribGoalId = null; }
  el.contribCancel.addEventListener("click", closeContrib);
  el.contribModal.addEventListener("click", (e) => { if (e.target === el.contribModal) closeContrib(); });
  el.contribSave.addEventListener("click", () => {
    const g = goals.find((x) => x.id === contribGoalId);
    if (!g) return closeContrib();
    const amt = parseFloat(el.contribAmount.value);
    if (!amt) { toast("נא להזין סכום"); return; }
    const wasDone = g.saved >= g.target;
    g.saved = Math.max(0, round2(g.saved + amt));
    save(); closeContrib(); renderGoals();
    if (!wasDone && g.saved >= g.target) { celebrate(); toast(`מזל טוב! השגת את היעד "${g.name}" 🎉`); }
    else toast("נוסף לחיסכון 💰");
  });

  /* ---------- תנועות קבועות (רשימה) ---------- */
  function renderRecurring() {
    el.recurringEmpty.hidden = recurring.length > 0;
    el.recurringList.innerHTML = recurring.map((r) => {
      const c = catById(r.category);
      return `<div class="recurring-item">
        <div class="tx-icon" style="background:${c.color}22;">${c.icon}</div>
        <div class="rec-body"><div class="rec-title">${c.name}${r.description ? " · " + escapeHtml(r.description) : ""}</div><div class="rec-meta">כל חודש ב-${r.day} לחודש</div></div>
        <div class="rec-amount ${r.type}">${r.type === "income" ? "+" : "−"}${fmt(r.amount).replace("₪", "")}₪</div>
        <button class="tx-del" data-delrec="${r.id}" title="הסר">🗑️</button>
      </div>`;
    }).join("");
    el.recurringList.querySelectorAll("[data-delrec]").forEach((b) => b.addEventListener("click", () => deleteRecurring(b.dataset.delrec)));
  }

  /* ---------- קונפטי 🎉 ---------- */
  function celebrate() {
    const cvs = el.confetti, ctx = cvs.getContext("2d");
    cvs.width = innerWidth; cvs.height = innerHeight;
    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e"];
    const parts = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - 0.5) * 14, vy: Math.random() * -16 - 4, s: Math.random() * 8 + 4, c: colors[(Math.random() * colors.length) | 0], r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4 }));
    let frame = 0;
    (function loop() {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      parts.forEach((p) => { p.vy += 0.5; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore(); });
      frame++;
      if (frame < 130) requestAnimationFrame(loop); else ctx.clearRect(0, 0, cvs.width, cvs.height);
    })();
  }

  /* ---------- תקציב ---------- */
  el.editBudget.addEventListener("click", () => { el.budgetInput.value = budgets[currentMonth] || ""; el.budgetModal.hidden = false; el.budgetInput.focus(); });
  function closeBudget() { el.budgetModal.hidden = true; }
  el.budgetCancel.addEventListener("click", closeBudget);
  el.budgetModal.addEventListener("click", (e) => { if (e.target === el.budgetModal) closeBudget(); });
  el.budgetSave.addEventListener("click", () => { const v = parseFloat(el.budgetInput.value); if (v > 0) { budgets[currentMonth] = Math.round(v); toast(`תקציב ל${monthLabel(currentMonth)} נשמר`); } else delete budgets[currentMonth]; save(); closeBudget(); renderSummary(); });
  el.budgetClear.addEventListener("click", () => { delete budgets[currentMonth]; save(); closeBudget(); renderSummary(); toast("התקציב אופס"); });

  /* ---------- ייצוא / ייבוא ---------- */
  el.exportJson.addEventListener("click", () => { const payload = { version: 2, exportedAt: new Date().toISOString(), transactions, budgets, goals, recurring, recApplied }; downloadFile(JSON.stringify(payload, null, 2), `budget-backup-${todayStr()}.json`, "application/json"); toast("הנתונים יוצאו לקובץ JSON"); });
  el.exportCsv.addEventListener("click", () => {
    if (!transactions.length) { toast("אין נתונים לייצוא"); return; }
    const rows = [["תאריך", "סוג", "קטגוריה", "תיאור", "סכום"]];
    [...transactions].sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => rows.push([t.date, t.type === "income" ? "הכנסה" : "הוצאה", catById(t.category).name, t.description || "", t.amount]));
    downloadFile("﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n"), `budget-${todayStr()}.csv`, "text/csv"); toast("הנתונים יוצאו לקובץ CSV");
  });
  const csvCell = (v) => { const s = String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  function downloadFile(content, filename, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.transactions)) throw new Error("bad");
        const merge = confirm(`הקובץ מכיל ${data.transactions.length} תנועות. אישור = מיזוג עם הקיים · ביטול = החלפה מלאה`);
        if (merge) {
          const ids = new Set(transactions.map((t) => t.id));
          data.transactions.forEach((t) => { if (!ids.has(t.id)) transactions.push(t); });
          budgets = { ...data.budgets, ...budgets };
          if (Array.isArray(data.goals)) { const gids = new Set(goals.map((g) => g.id)); data.goals.forEach((g) => { if (!gids.has(g.id)) goals.push(g); }); }
          if (Array.isArray(data.recurring)) { const rids = new Set(recurring.map((r) => r.id)); data.recurring.forEach((r) => { if (!rids.has(r.id)) recurring.push(r); }); }
          recApplied = { ...(data.recApplied || {}), ...recApplied };
        } else {
          transactions = data.transactions; budgets = data.budgets || {}; goals = data.goals || []; recurring = data.recurring || []; recApplied = data.recApplied || {};
        }
        save(); renderAll(); toast("הנתונים יובאו בהצלחה ✅");
      } catch { toast("שגיאה: הקובץ אינו תקין"); }
      el.importFile.value = "";
    };
    reader.readAsText(file);
  });

  el.clearAll.addEventListener("click", () => {
    if (!transactions.length && !Object.keys(budgets).length && !goals.length && !recurring.length) { toast("אין נתונים למחיקה"); return; }
    if (!confirm("למחוק את כל הנתונים לצמיתות? פעולה זו אינה הפיכה.\n\nמומלץ לייצא גיבוי קודם.")) return;
    if (!confirm("בטוח לגמרי? כל התנועות, היעדים, התקציבים והתנועות הקבועות יימחקו.")) return;
    transactions = []; budgets = {}; goals = []; recurring = []; recApplied = {};
    save(); renderAll(); toast("כל הנתונים נמחקו");
  });

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) { el.toast.textContent = msg; el.toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.hidden = true, 2600); }

  /* ---------- ESC סוגר מודלים ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    [el.budgetModal, el.editModal, el.goalModal, el.contribModal].forEach((m) => m.hidden = true);
  });

  /* ---------- רינדור כללי ---------- */
  function renderAll() { renderSummary(); renderInsights(); renderList(); renderCharts(); renderGoals(); renderRecurring(); }

  /* ---------- אתחול ---------- */
  function init() {
    initTheme();
    el.date.value = todayStr();
    el.monthSelect.value = currentMonth;
    fillCatSelect(el.category, currentType);
    fillCatSelect(el.editCategory, editType);
    const added = applyRecurring();
    renderAll();
    if (added > 0) toast(`נוספו ${added} תנועות קבועות לחודש זה 🔁`);
  }
  init();
})();
