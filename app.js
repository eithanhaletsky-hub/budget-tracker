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
    customCats: "budgethelper.customCats.v1",
    catBudgets: "budgethelper.catBudgets.v1",
    theme: "budgethelper.theme",
  };

  /* ---------- קטגוריות ---------- */
  const BUILTIN = {
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

  // קטגוריות מותאמות אישית (נטענות מ-localStorage) ממוזגות עם המובנות
  let customCats = load(K.customCats, { expense: [], income: [] });
  if (!customCats.expense) customCats = { expense: [], income: [] };
  const catsOf = (type) => [...BUILTIN[type], ...(customCats[type] || [])];
  const allCats = () => [...catsOf("expense"), ...catsOf("income")];
  const catById = (id) => allCats().find((c) => c.id === id) || { name: "לא ידוע", icon: "❓", color: "#94a3b8" };

  /* ---------- מצב ---------- */
  let transactions = load(K.tx, []);
  let budgets = load(K.budget, {});
  let goals = load(K.goals, []);
  let recurring = load(K.recurring, []);
  let recApplied = load(K.recApplied, {}); // { "recId:YYYY-MM": true }
  let catBudgets = load(K.catBudgets, {}); // { catId: monthlyAmount } — חל על כל חודש
  let currentType = "expense";
  let newCatType = "expense";
  let newCatEmoji = "🏷️";
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
    localStorage.setItem(K.customCats, JSON.stringify(customCats));
    localStorage.setItem(K.catBudgets, JSON.stringify(catBudgets));
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
    lineChart: $("lineChart"), lineEmpty: $("lineEmpty"),
    manageCats: $("manageCats"), catModal: $("catModal"), catManageList: $("catManageList"), catEmojiPicker: $("catEmojiPicker"),
    newCatName: $("newCatName"), newCatColor: $("newCatColor"), catAdd: $("catAdd"), catClose: $("catClose"), newCatTypeBtns: document.querySelectorAll(".newcat-type"),
    catBudgetList: $("catBudgetList"), catBudgetEmpty: $("catBudgetEmpty"), addCatBudget: $("addCatBudget"),
    catBudgetModal: $("catBudgetModal"), catBudgetSelect: $("catBudgetSelect"), catBudgetAmount: $("catBudgetAmount"), catBudgetSave: $("catBudgetSave"), catBudgetCancel: $("catBudgetCancel"),
    printReport: $("printReport"),
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
    sel.innerHTML = catsOf(type).map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("");
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
  function renderCharts() { renderPie(); renderBar(); renderLine(); }

  function renderLine() {
    const ctx = el.lineChart.getContext("2d");
    const W = el.lineChart.width, H = el.lineChart.height;
    ctx.clearRect(0, 0, W, H);
    const txs = monthTx();
    el.lineEmpty.hidden = txs.length > 0;
    if (!txs.length) return;

    const [y, m] = currentMonth.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    // מאזן מצטבר יומי
    const daily = new Array(days + 1).fill(0);
    txs.forEach((t) => { const d = +t.date.split("-")[2]; if (d >= 1 && d <= days) daily[d] += (t.type === "income" ? t.amount : -t.amount); });
    const cum = []; let run = 0;
    for (let d = 1; d <= days; d++) { run += daily[d]; cum.push(run); }
    const max = Math.max(0, ...cum), min = Math.min(0, ...cum);
    const range = (max - min) || 1;
    const padT = 14, padB = 22, padX = 12, chartH = H - padT - padB, chartW = W - padX * 2;
    const xAt = (i) => padX + (days === 1 ? chartW / 2 : (i / (days - 1)) * chartW);
    const yAt = (v) => padT + (1 - (v - min) / range) * chartH;

    // קו אפס
    const zeroY = yAt(0);
    ctx.strokeStyle = cssVar("--border"); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(padX, zeroY); ctx.lineTo(W - padX, zeroY); ctx.stroke(); ctx.setLineDash([]);

    // אזור מתחת לקו
    const primary = cssVar("--primary");
    ctx.beginPath(); ctx.moveTo(xAt(0), yAt(cum[0]));
    for (let i = 1; i < cum.length; i++) ctx.lineTo(xAt(i), yAt(cum[i]));
    ctx.lineTo(xAt(cum.length - 1), zeroY); ctx.lineTo(xAt(0), zeroY); ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
    grad.addColorStop(0, primary + "44"); grad.addColorStop(1, primary + "05");
    ctx.fillStyle = grad; ctx.fill();

    // הקו
    ctx.beginPath(); ctx.moveTo(xAt(0), yAt(cum[0]));
    for (let i = 1; i < cum.length; i++) ctx.lineTo(xAt(i), yAt(cum[i]));
    ctx.strokeStyle = primary; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();

    // נקודה אחרונה + ערך
    const lx = xAt(cum.length - 1), ly = yAt(cum[cum.length - 1]);
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fillStyle = primary; ctx.fill();
    ctx.fillStyle = cssVar("--text"); ctx.font = "700 12px sans-serif"; ctx.textBaseline = "bottom"; ctx.textAlign = lx > W - 60 ? "end" : "start";
    ctx.fillText(fmtShort(cum[cum.length - 1]), lx + (lx > W - 60 ? -6 : 6), ly - 6);
  }

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
    [el.budgetModal, el.editModal, el.goalModal, el.contribModal, el.catModal, el.catBudgetModal].forEach((m) => m.hidden = true);
  });

  /* ---------- קטגוריות מותאמות אישית ---------- */
  const CAT_EMOJIS = ["🏷️", "🐶", "🎾", "🎨", "☕", "🌱", "🧾", "💇", "🎓", "🎁", "🚿", "🍺", "👶", "💊", "🏋️", "✂️", "🔧", "📶", "🎵", "⛽"];
  function renderCatEmojiPicker() {
    el.catEmojiPicker.innerHTML = CAT_EMOJIS.map((e) => `<button type="button" class="emoji-opt ${e === newCatEmoji ? "selected" : ""}" data-emoji="${e}">${e}</button>`).join("");
    el.catEmojiPicker.querySelectorAll(".emoji-opt").forEach((b) => b.addEventListener("click", () => { newCatEmoji = b.dataset.emoji; el.catEmojiPicker.querySelectorAll(".emoji-opt").forEach((x) => x.classList.toggle("selected", x === b)); }));
  }
  el.newCatTypeBtns.forEach((b) => b.addEventListener("click", () => { newCatType = b.dataset.type; el.newCatTypeBtns.forEach((x) => x.classList.toggle("active", x === b)); }));

  function renderCatManageList() {
    const rows = [];
    ["expense", "income"].forEach((type) => {
      catsOf(type).forEach((c) => {
        const custom = (customCats[type] || []).some((x) => x.id === c.id);
        rows.push(`<div class="cat-manage-item">
          <span class="cm-icon" style="background:${c.color}22">${c.icon}</span>
          <span class="cm-name">${escapeHtml(c.name)}</span>
          <span class="cm-type">${type === "expense" ? "הוצאה" : "הכנסה"}</span>
          ${custom ? `<button class="cm-del" data-delcat="${c.id}" title="מחק">🗑️</button>` : `<span class="cm-builtin">מובנה</span>`}
        </div>`);
      });
    });
    el.catManageList.innerHTML = rows.join("");
    el.catManageList.querySelectorAll("[data-delcat]").forEach((b) => b.addEventListener("click", () => deleteCat(b.dataset.delcat)));
  }
  function openCatModal() { newCatType = "expense"; newCatEmoji = CAT_EMOJIS[0]; el.newCatTypeBtns.forEach((x) => x.classList.toggle("active", x.dataset.type === "expense")); el.newCatName.value = ""; renderCatEmojiPicker(); renderCatManageList(); el.catModal.hidden = false; }
  function closeCatModal() { el.catModal.hidden = true; }
  el.manageCats.addEventListener("click", openCatModal);
  el.catClose.addEventListener("click", closeCatModal);
  el.catModal.addEventListener("click", (e) => { if (e.target === el.catModal) closeCatModal(); });
  el.catAdd.addEventListener("click", () => {
    const name = el.newCatName.value.trim();
    if (!name) { toast("נא להזין שם לקטגוריה"); return; }
    const cat = { id: "custom_" + uid(), name, icon: newCatEmoji, color: el.newCatColor.value };
    if (!customCats[newCatType]) customCats[newCatType] = [];
    customCats[newCatType].push(cat);
    save();
    el.newCatName.value = "";
    renderCatManageList();
    fillCatSelect(el.category, currentType);
    toast("הקטגוריה נוספה 🏷️");
  });
  function deleteCat(id) {
    const used = transactions.some((t) => t.category === id);
    if (used && !confirm("קטגוריה זו בשימוש בתנועות קיימות. למחוק בכל זאת? התנועות יישארו אך ללא קטגוריה מזוהה.")) return;
    else if (!used && !confirm("למחוק את הקטגוריה?")) return;
    ["expense", "income"].forEach((type) => { customCats[type] = (customCats[type] || []).filter((c) => c.id !== id); });
    delete catBudgets[id];
    save(); renderCatManageList(); fillCatSelect(el.category, currentType); renderAll();
    toast("הקטגוריה נמחקה");
  }

  /* ---------- תקציב לפי קטגוריה ---------- */
  function renderCatBudgets() {
    const ids = Object.keys(catBudgets).filter((id) => catBudgets[id] > 0);
    el.catBudgetEmpty.hidden = ids.length > 0;
    const spentByCat = {};
    monthTx().filter((t) => t.type === "expense").forEach((t) => spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount);
    el.catBudgetList.innerHTML = ids.map((id) => {
      const c = catById(id), budget = catBudgets[id], spent = spentByCat[id] || 0;
      const pct = Math.min(100, Math.round(spent / budget * 100));
      const over = spent > budget;
      const color = over ? "var(--grad-expense)" : pct >= 80 ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "var(--grad-income)";
      return `<div class="catbudget">
        <div class="catbudget-head">
          <span class="catbudget-icon" style="background:${c.color}22">${c.icon}</span>
          <span class="catbudget-name">${c.name}</span>
          <span class="catbudget-actions">
            <button data-editcb="${id}" title="ערוך">✏️</button>
            <button data-delcb="${id}" title="מחק">🗑️</button>
          </span>
        </div>
        <div class="catbudget-nums"><b>${fmt(spent)}</b> מתוך ${fmt(budget)}</div>
        <div class="catbudget-bar"><div class="catbudget-bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="catbudget-foot">
          <span class="catbudget-status" style="color:${over ? "var(--expense)" : "var(--text-muted)"}">${over ? "⚠️ חריגה של " + fmt(spent - budget) : "נותרו " + fmt(budget - spent)}</span>
          <span class="catbudget-status" style="color:var(--text-muted)">${pct}%</span>
        </div>
      </div>`;
    }).join("");
    el.catBudgetList.querySelectorAll("[data-delcb]").forEach((b) => b.addEventListener("click", () => { delete catBudgets[b.dataset.delcb]; save(); renderCatBudgets(); toast("תקציב הקטגוריה הוסר"); }));
    el.catBudgetList.querySelectorAll("[data-editcb]").forEach((b) => b.addEventListener("click", () => openCatBudgetModal(b.dataset.editcb)));
  }
  function openCatBudgetModal(preId) {
    el.catBudgetSelect.innerHTML = catsOf("expense").map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("");
    if (preId) { el.catBudgetSelect.value = preId; el.catBudgetAmount.value = catBudgets[preId] || ""; }
    else { el.catBudgetAmount.value = ""; }
    el.catBudgetModal.hidden = false; el.catBudgetAmount.focus();
  }
  function closeCatBudgetModal() { el.catBudgetModal.hidden = true; }
  el.addCatBudget.addEventListener("click", () => openCatBudgetModal(null));
  el.catBudgetCancel.addEventListener("click", closeCatBudgetModal);
  el.catBudgetModal.addEventListener("click", (e) => { if (e.target === el.catBudgetModal) closeCatBudgetModal(); });
  el.catBudgetSave.addEventListener("click", () => {
    const id = el.catBudgetSelect.value, amt = parseFloat(el.catBudgetAmount.value);
    if (amt > 0) { catBudgets[id] = Math.round(amt); toast("תקציב הקטגוריה נשמר 📊"); } else { delete catBudgets[id]; }
    save(); closeCatBudgetModal(); renderCatBudgets();
  });

  /* ---------- דוח חודשי להדפסה / PDF ---------- */
  el.printReport.addEventListener("click", printReport);
  function printReport() {
    const txs = monthTx();
    if (!txs.length) { toast("אין תנועות בחודש זה להפקת דוח"); return; }
    const income = sum(txs.filter((t) => t.type === "income")), expense = sum(txs.filter((t) => t.type === "expense"));
    const byCat = {};
    txs.filter((t) => t.type === "expense").forEach((t) => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
    const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([id, v]) => { const c = catById(id); return `<tr><td>${c.icon} ${escapeHtml(c.name)}</td><td>${fmt(v)}</td><td>${Math.round(v / expense * 100)}%</td></tr>`; }).join("");
    const txRows = [...txs].sort((a, b) => a.date.localeCompare(b.date)).map((t) => { const c = catById(t.category); return `<tr><td>${t.date.split("-").reverse().join("/")}</td><td>${c.icon} ${escapeHtml(c.name)}</td><td>${escapeHtml(t.description || "")}</td><td class="${t.type}">${t.type === "income" ? "+" : "−"}${fmt(t.amount)}</td></tr>`; }).join("");
    const budget = budgets[currentMonth];

    let root = document.getElementById("printRoot");
    if (!root) { root = document.createElement("div"); root.id = "printRoot"; document.body.appendChild(root); }
    root.innerHTML = `
      <div style="font-family:sans-serif;direction:rtl;padding:30px;color:#111;max-width:800px;margin:0 auto">
        <h1 style="margin:0 0 4px">💰 דוח תקציב — ${monthLabel(currentMonth)}</h1>
        <p style="color:#666;margin:0 0 20px">הופק בתאריך ${todayStr().split("-").reverse().join("/")}</p>
        <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
          <div style="flex:1;min-width:140px;border:1px solid #ddd;border-radius:10px;padding:14px"><div style="color:#666;font-size:13px">הכנסות</div><div style="font-size:22px;font-weight:800;color:#059669">${fmt(income)}</div></div>
          <div style="flex:1;min-width:140px;border:1px solid #ddd;border-radius:10px;padding:14px"><div style="color:#666;font-size:13px">הוצאות</div><div style="font-size:22px;font-weight:800;color:#dc2626">${fmt(expense)}</div></div>
          <div style="flex:1;min-width:140px;border:1px solid #ddd;border-radius:10px;padding:14px"><div style="color:#666;font-size:13px">מאזן</div><div style="font-size:22px;font-weight:800;color:${income - expense < 0 ? "#dc2626" : "#0284c7"}">${fmt(income - expense)}</div></div>
          ${budget ? `<div style="flex:1;min-width:140px;border:1px solid #ddd;border-radius:10px;padding:14px"><div style="color:#666;font-size:13px">תקציב</div><div style="font-size:22px;font-weight:800;color:#d97706">${fmt(budget)}</div></div>` : ""}
        </div>
        <h2 style="border-bottom:2px solid #eee;padding-bottom:6px">פילוח הוצאות לפי קטגוריה</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
          <thead><tr style="text-align:right;color:#666"><th style="padding:8px">קטגוריה</th><th style="padding:8px">סכום</th><th style="padding:8px">אחוז</th></tr></thead>
          <tbody>${catRows || '<tr><td colspan="3" style="padding:8px;color:#999">אין הוצאות</td></tr>'}</tbody>
        </table>
        <h2 style="border-bottom:2px solid #eee;padding-bottom:6px">כל התנועות (${txs.length})</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="text-align:right;color:#666"><th style="padding:6px">תאריך</th><th style="padding:6px">קטגוריה</th><th style="padding:6px">תיאור</th><th style="padding:6px">סכום</th></tr></thead>
          <tbody>${txRows}</tbody>
        </table>
        <p style="color:#999;font-size:12px;margin-top:24px;text-align:center">הופק ע"י אפליקציית "התקציב שלי"</p>
      </div>`;
    root.querySelectorAll(".income").forEach((e) => e.style.color = "#059669");
    root.querySelectorAll(".expense").forEach((e) => e.style.color = "#dc2626");
    root.querySelectorAll("td").forEach((td) => { td.style.padding = "7px 8px"; td.style.borderBottom = "1px solid #eee"; });
    setTimeout(() => window.print(), 100);
  }

  /* ---------- רינדור כללי ---------- */
  function renderAll() { renderSummary(); renderInsights(); renderList(); renderCharts(); renderGoals(); renderRecurring(); renderCatBudgets(); }

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
