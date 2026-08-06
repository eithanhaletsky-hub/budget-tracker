/* ===== ניהול תקציב — לוגיקה ===== *
 * כל הנתונים נשמרים ב-localStorage, במכשיר המשתמש בלבד.
 * ללא שרת, ללא API, ללא מעקב.
 */

(() => {
  "use strict";

  const STORAGE_KEY = "budgethelper.transactions.v1";
  const BUDGET_KEY = "budgethelper.budgets.v1";
  const THEME_KEY = "budgethelper.theme";

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

  const allCats = [...CATEGORIES.expense, ...CATEGORIES.income];
  const catById = (id) => allCats.find((c) => c.id === id) || { name: "לא ידוע", icon: "❓", color: "#94a3b8" };

  /* ---------- מצב ---------- */
  let transactions = load(STORAGE_KEY, []);
  let budgets = load(BUDGET_KEY, {}); // { "2026-08": 5000 }
  let currentType = "expense";
  let currentMonth = ymNow();

  /* ---------- עזרי אחסון ---------- */
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
  }

  /* ---------- עזרי תאריך/מספר ---------- */
  function ymNow() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  function ymOf(dateStr) { return dateStr.slice(0, 7); }
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const fmt = (n) => "₪" + Number(n).toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  function monthLabel(ym) {
    const [y, m] = ym.split("-");
    const names = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
    return `${names[+m - 1]} ${y}`;
  }

  /* ---------- אלמנטים ---------- */
  const $ = (id) => document.getElementById(id);
  const el = {
    monthSelect: $("monthSelect"), prevMonth: $("prevMonth"), nextMonth: $("nextMonth"),
    totalIncome: $("totalIncome"), totalExpense: $("totalExpense"), balance: $("balance"),
    budgetValue: $("budgetValue"), budgetBar: $("budgetBar"), budgetBarFill: $("budgetBarFill"), budgetHint: $("budgetHint"),
    editBudget: $("editBudget"),
    form: $("txForm"), amount: $("amount"), category: $("category"), description: $("description"),
    date: $("date"), submitBtn: $("submitBtn"), typeBtns: document.querySelectorAll(".type-btn"),
    txList: $("txList"), listEmpty: $("listEmpty"),
    searchInput: $("searchInput"), filterType: $("filterType"), filterCategory: $("filterCategory"),
    pieChart: $("pieChart"), pieLegend: $("pieLegend"), pieEmpty: $("pieEmpty"),
    barChart: $("barChart"),
    exportJson: $("exportJson"), exportCsv: $("exportCsv"), importBtn: $("importBtn"), importFile: $("importFile"), clearAll: $("clearAll"),
    themeToggle: $("themeToggle"),
    budgetModal: $("budgetModal"), budgetInput: $("budgetInput"), budgetSave: $("budgetSave"), budgetCancel: $("budgetCancel"), budgetClear: $("budgetClear"),
    toast: $("toast"),
  };

  /* ---------- ערכת נושא ---------- */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    el.themeToggle.textContent = dark ? "☀️" : "🌙";
  }
  el.themeToggle.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") !== "dark";
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    el.themeToggle.textContent = dark ? "☀️" : "🌙";
    renderCharts();
  });

  /* ---------- טופס ---------- */
  function populateCategorySelect() {
    el.category.innerHTML = CATEGORIES[currentType]
      .map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`)
      .join("");
  }
  el.typeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.type;
      el.typeBtns.forEach((b) => b.classList.toggle("active", b === btn));
      el.submitBtn.textContent = currentType === "expense" ? "הוסף הוצאה" : "הוסף הכנסה";
      populateCategorySelect();
    });
  });

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(el.amount.value);
    if (!(amount > 0)) { toast("נא להזין סכום חוקי"); return; }
    const tx = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: currentType,
      amount: Math.round(amount * 100) / 100,
      category: el.category.value,
      description: el.description.value.trim(),
      date: el.date.value || todayStr(),
    };
    transactions.push(tx);
    save();
    el.form.reset();
    el.date.value = todayStr();
    // עבור לחודש של התנועה שהוזנה כדי שהמשתמש יראה אותה
    const txMonth = ymOf(tx.date);
    if (txMonth !== currentMonth) { currentMonth = txMonth; el.monthSelect.value = currentMonth; }
    renderAll();
    toast(currentType === "expense" ? "הוצאה נוספה ✅" : "הכנסה נוספה ✅");
  });

  /* ---------- מחיקה ---------- */
  function deleteTx(id) {
    transactions = transactions.filter((t) => t.id !== id);
    save();
    renderAll();
    toast("התנועה נמחקה");
  }

  /* ---------- ניווט חודשים ---------- */
  function shiftMonth(delta) {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    el.monthSelect.value = currentMonth;
    renderAll();
  }
  el.prevMonth.addEventListener("click", () => shiftMonth(-1));
  el.nextMonth.addEventListener("click", () => shiftMonth(1));
  el.monthSelect.addEventListener("change", () => {
    currentMonth = el.monthSelect.value || ymNow();
    renderAll();
  });

  /* ---------- סינון ---------- */
  [el.searchInput, el.filterType, el.filterCategory].forEach((c) =>
    c.addEventListener("input", renderList)
  );

  function monthTx() {
    return transactions.filter((t) => ymOf(t.date) === currentMonth);
  }

  /* ---------- רינדור סיכום ---------- */
  function renderSummary() {
    const txs = monthTx();
    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const bal = income - expense;
    el.totalIncome.textContent = fmt(income);
    el.totalExpense.textContent = fmt(expense);
    el.balance.textContent = fmt(bal);
    el.balance.classList.toggle("negative", bal < 0);

    // תקציב
    const budget = budgets[currentMonth];
    if (budget && budget > 0) {
      el.budgetValue.textContent = fmt(budget);
      el.budgetBar.hidden = false;
      const pct = Math.min(100, (expense / budget) * 100);
      el.budgetBarFill.style.width = pct + "%";
      let color = "var(--income)";
      if (pct >= 100) color = "var(--expense)";
      else if (pct >= 80) color = "var(--budget)";
      el.budgetBarFill.style.background = color;
      const remaining = budget - expense;
      if (remaining >= 0) {
        el.budgetHint.textContent = `נותרו ${fmt(remaining)} (${Math.round(pct)}% נוצל)`;
        el.budgetHint.style.color = pct >= 80 ? "var(--budget)" : "var(--text-muted)";
      } else {
        el.budgetHint.textContent = `⚠️ חריגה של ${fmt(-remaining)}!`;
        el.budgetHint.style.color = "var(--expense)";
      }
    } else {
      el.budgetValue.textContent = "—";
      el.budgetBar.hidden = true;
      el.budgetHint.textContent = "לא הוגדר תקציב לחודש זה";
      el.budgetHint.style.color = "var(--text-muted)";
    }
  }

  /* ---------- רינדור רשימה ---------- */
  function renderList() {
    const search = el.searchInput.value.trim().toLowerCase();
    const fType = el.filterType.value;
    const fCat = el.filterCategory.value;

    // עדכון אפשרויות סינון קטגוריה לפי הקטגוריות הקיימות בחודש
    const presentCats = [...new Set(monthTx().map((t) => t.category))];
    const currentFilterVal = el.filterCategory.value;
    el.filterCategory.innerHTML = `<option value="all">כל הקטגוריות</option>` +
      presentCats.map((id) => { const c = catById(id); return `<option value="${id}">${c.icon} ${c.name}</option>`; }).join("");
    if ([...el.filterCategory.options].some((o) => o.value === currentFilterVal)) el.filterCategory.value = currentFilterVal;

    let txs = monthTx();
    if (fType !== "all") txs = txs.filter((t) => t.type === fType);
    if (fCat !== "all") txs = txs.filter((t) => t.category === fCat);
    if (search) {
      txs = txs.filter((t) => {
        const c = catById(t.category);
        return (t.description || "").toLowerCase().includes(search) ||
               c.name.toLowerCase().includes(search) ||
               String(t.amount).includes(search);
      });
    }
    txs.sort((a, b) => (b.date === a.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));

    el.listEmpty.hidden = txs.length > 0;
    if (txs.length === 0) {
      el.listEmpty.textContent = monthTx().length === 0
        ? "עדיין אין תנועות בחודש זה. הוסף את הראשונה! 👉"
        : "לא נמצאו תנועות התואמות לסינון.";
    }

    el.txList.innerHTML = txs.map((t) => {
      const c = catById(t.category);
      const sign = t.type === "income" ? "+" : "−";
      const dateFmt = t.date.split("-").reverse().join("/");
      return `
        <div class="tx-item">
          <div class="tx-icon" style="background:${c.color}22;">${c.icon}</div>
          <div class="tx-body">
            <div class="tx-cat">${c.name}</div>
            <div class="tx-meta">
              <span>${dateFmt}</span>
              ${t.description ? `<span class="tx-desc">• ${escapeHtml(t.description)}</span>` : ""}
            </div>
          </div>
          <div class="tx-amount ${t.type}">${sign}${fmt(t.amount).replace("₪", "")}₪</div>
          <button class="tx-del" data-id="${t.id}" title="מחק" aria-label="מחק תנועה">🗑️</button>
        </div>`;
    }).join("");

    el.txList.querySelectorAll(".tx-del").forEach((b) =>
      b.addEventListener("click", () => deleteTx(b.dataset.id))
    );
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- גרפים ---------- */
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function renderCharts() { renderPie(); renderBar(); }

  function renderPie() {
    const ctx = el.pieChart.getContext("2d");
    const size = el.pieChart.width;
    ctx.clearRect(0, 0, size, size);

    const expenses = monthTx().filter((t) => t.type === "expense");
    const byCat = {};
    expenses.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);

    el.pieEmpty.hidden = entries.length > 0;
    if (entries.length === 0) { el.pieLegend.innerHTML = ""; return; }

    const cx = size / 2, cy = size / 2, r = size / 2 - 6, inner = r * 0.58;
    let start = -Math.PI / 2;
    entries.forEach(([id, val]) => {
      const c = catById(id);
      const angle = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = c.color;
      ctx.fill();
      start += angle;
    });
    // חור פנימי (donut)
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = cssVar("--surface");
    ctx.fill();
    // טקסט מרכזי
    ctx.fillStyle = cssVar("--text");
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 20px " + cssVar("--font").replace(/"/g, "");
    ctx.fillText(fmt(total), cx, cy - 6);
    ctx.fillStyle = cssVar("--text-muted");
    ctx.font = "12px sans-serif";
    ctx.fillText("סה\"כ הוצאות", cx, cy + 14);

    el.pieLegend.innerHTML = entries.map(([id, val]) => {
      const c = catById(id);
      const pct = Math.round((val / total) * 100);
      return `<div class="leg-item">
        <span class="leg-color" style="background:${c.color}"></span>
        <span class="leg-name">${c.icon} ${c.name}</span>
        <span class="leg-val">${pct}%</span>
      </div>`;
    }).join("");
  }

  function renderBar() {
    const ctx = el.barChart.getContext("2d");
    const W = el.barChart.width, H = el.barChart.height;
    ctx.clearRect(0, 0, W, H);

    // 6 חודשים אחרונים ביחס לחודש הנבחר
    const months = [];
    const [y, m] = currentMonth.split("-").map(Number);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const data = months.map((ym) => {
      const txs = transactions.filter((t) => ymOf(t.date) === ym);
      return {
        ym,
        income: txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      };
    });
    const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));

    const padTop = 12, padBottom = 26, padX = 10;
    const chartH = H - padTop - padBottom;
    const groupW = (W - padX * 2) / months.length;
    const barW = groupW * 0.3;

    ctx.strokeStyle = cssVar("--border");
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, H - padBottom); ctx.lineTo(W - padX, H - padBottom); ctx.stroke();

    const incomeC = cssVar("--income"), expenseC = cssVar("--expense"), mutedC = cssVar("--text-muted");
    data.forEach((d, i) => {
      const gx = padX + i * groupW + groupW / 2;
      const ih = (d.income / max) * chartH;
      const eh = (d.expense / max) * chartH;
      // הכנסה (ימין ב-RTL אך ציור לפי פיקסלים)
      ctx.fillStyle = incomeC;
      roundRect(ctx, gx - barW - 2, H - padBottom - ih, barW, ih, 3);
      ctx.fillStyle = expenseC;
      roundRect(ctx, gx + 2, H - padBottom - eh, barW, eh, 3);
      // תווית חודש
      ctx.fillStyle = mutedC;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.font = "11px sans-serif";
      const label = ["ינו","פבר","מרץ","אפר","מאי","יונ","יול","אוג","ספט","אוק","נוב","דצמ"][+d.ym.split("-")[1] - 1];
      ctx.fillText(label, gx, H - padBottom + 6);
    });
  }
  function roundRect(ctx, x, y, w, h, r) {
    if (h <= 0) return;
    r = Math.min(r, w / 2, h);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, 0);
    ctx.arcTo(x, y + h, x, y, 0);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  /* ---------- תקציב (מודל) ---------- */
  el.editBudget.addEventListener("click", openBudgetModal);
  function openBudgetModal() {
    el.budgetInput.value = budgets[currentMonth] || "";
    el.budgetModal.hidden = false;
    el.budgetInput.focus();
  }
  function closeBudgetModal() { el.budgetModal.hidden = true; }
  el.budgetCancel.addEventListener("click", closeBudgetModal);
  el.budgetModal.addEventListener("click", (e) => { if (e.target === el.budgetModal) closeBudgetModal(); });
  el.budgetSave.addEventListener("click", () => {
    const v = parseFloat(el.budgetInput.value);
    if (v > 0) { budgets[currentMonth] = Math.round(v); toast(`תקציב ל${monthLabel(currentMonth)} נשמר`); }
    else { delete budgets[currentMonth]; }
    save(); closeBudgetModal(); renderSummary();
  });
  el.budgetClear.addEventListener("click", () => {
    delete budgets[currentMonth];
    save(); closeBudgetModal(); renderSummary(); toast("התקציב אופס");
  });

  /* ---------- ייצוא / ייבוא ---------- */
  el.exportJson.addEventListener("click", () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), transactions, budgets };
    downloadFile(JSON.stringify(payload, null, 2), `budget-backup-${todayStr()}.json`, "application/json");
    toast("הנתונים יוצאו לקובץ JSON");
  });

  el.exportCsv.addEventListener("click", () => {
    if (transactions.length === 0) { toast("אין נתונים לייצוא"); return; }
    const rows = [["תאריך", "סוג", "קטגוריה", "תיאור", "סכום"]];
    [...transactions].sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => {
      rows.push([t.date, t.type === "income" ? "הכנסה" : "הוצאה", catById(t.category).name, t.description || "", t.amount]);
    });
    const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    downloadFile(csv, `budget-${todayStr()}.csv`, "text/csv");
    toast("הנתונים יוצאו לקובץ CSV");
  });
  function csvCell(v) {
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.transactions)) throw new Error("bad");
        if (!confirm(`הקובץ מכיל ${data.transactions.length} תנועות. האם למזג עם הנתונים הקיימים? (ביטול = החלפה מלאה)`)) {
          transactions = data.transactions;
          budgets = data.budgets || {};
        } else {
          const existingIds = new Set(transactions.map((t) => t.id));
          data.transactions.forEach((t) => { if (!existingIds.has(t.id)) transactions.push(t); });
          budgets = { ...data.budgets, ...budgets };
        }
        save(); renderAll();
        toast("הנתונים יובאו בהצלחה ✅");
      } catch {
        toast("שגיאה: הקובץ אינו תקין");
      }
      el.importFile.value = "";
    };
    reader.readAsText(file);
  });

  el.clearAll.addEventListener("click", () => {
    if (transactions.length === 0 && Object.keys(budgets).length === 0) { toast("אין נתונים למחיקה"); return; }
    if (!confirm("האם למחוק את כל הנתונים לצמיתות? פעולה זו אינה הפיכה.\n\nמומלץ לייצא גיבוי קודם.")) return;
    if (!confirm("בטוח לגמרי? כל התנועות והתקציבים יימחקו.")) return;
    transactions = []; budgets = {};
    save(); renderAll();
    toast("כל הנתונים נמחקו");
  });

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2600);
  }

  /* ---------- רינדור כללי ---------- */
  function renderAll() {
    renderSummary();
    renderList();
    renderCharts();
  }

  /* ---------- אתחול ---------- */
  function init() {
    initTheme();
    el.date.value = todayStr();
    el.monthSelect.value = currentMonth;
    populateCategorySelect();
    renderAll();
  }
  init();
})();
