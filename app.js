/* ===== ניהול תקציב — לוגיקה ===== *
 * כל הנתונים נשמרים ב-localStorage, במכשיר המשתמש בלבד.
 * ללא שרת, ללא API, ללא מעקב.
 */

(() => {
  "use strict";

  /* ---------- קונפיגורציית מיתוג (White-Label) ----------
   * גרסאות ממותגות מגדירות window.BUDGET_CONFIG לפני טעינת הקובץ.
   * ברירת המחדל = הגרסה הכללית "התקציב שלי".
   */
  const CFG = (typeof window !== "undefined" && window.BUDGET_CONFIG) || {};
  const APP = {
    name: CFG.name || "התקציב שלי",
    tagline: CFG.tagline || "מעקב הוצאות והכנסות — פשוט, חכם ונוח",
    logo: CFG.logo || "💰",
    accent: CFG.accent || null,      // { primary, primary2 }
    preset: CFG.preset || "generic", // generic | kids | coach
    kids: !!CFG.kids,                 // מפעיל מצב הישגים/מדליות וטון ידידותי
    brandedBy: CFG.brandedBy || null, // שם עסק/מאמן להצגה (white-label)
    variant: CFG.variant || null,     // זהות עיצובית מלאה: kids | coach (מוסיף class ל-body)
    demoLock: !!CFG.demoLock,          // גרסת הדגמה נעולה לשליחה ללקוח
    contact: CFG.contact || null,      // פרטי יצירת קשר לבאנר הרכישה
    lang: CFG.lang || "he",            // שפת ממשק: he | ru | en
    hideDemo: !!CFG.hideDemo,          // מסתיר את כפתור "טען נתוני הדגמה"
    compact: !!CFG.compact,            // פריסה תמציתית: 2 כרטיסים, בלי תובנות/גרפי מגמה, טבלת קטגוריות
    tableOnly: !!CFG.tableOnly,         // מצב טבלה בלבד (רוסית/אנגלית): רק טבלת תקציב
    showTable: !!CFG.showTable,         // הצגת טבלת המעקב גם בגרסה העברית (בעמוד הראשי)
  };

  /* ---------- i18n (עברית → רוסית) ---------- */
  const TR_RU = {
    // כותרות וניווט
    "מעקב הוצאות והכנסות": "учёт доходов и расходов",
    "📋 סיכום חודשי": "📋 Итоги месяца", "סיכום חודשי": "Итоги месяца", "סיכום נקי של החודש": "Чистая сводка месяца",
    "החלף מצב תצוגה": "Сменить тему", "מצב כהה/בהיר": "Тёмный/светлый режим",
    "חודש קודם": "Предыдущий месяц", "בחר חודש": "Выбрать месяц", "חודש הבא": "Следующий месяц",
    // כרטיסי סיכום
    "הכנסות החודש": "Доходы за месяц", "הוצאות החודש": "Расходы за месяц",
    "מאזן החודש (הכנסות − הוצאות)": "Баланс месяца (доходы − расходы)",
    "תקציב חודשי": "Месячный бюджет", "ערוך תקציב": "Редактировать бюджет",
    "✨ תובנות חכמות": "✨ Умные подсказки",
    // טופס
    "הוספת תנועה": "Добавить операцию", "➖ הוצאה": "➖ Расход", "➕ הכנסה": "➕ Доход",
    "סכום (₪)": "Сумма (₪)", "⚙️ נהל קטגוריות": "⚙️ Категории",
    "תיאור (לא חובה)": "Описание (необязательно)", "למשל: קניות בסופר": "Напр.: покупки в магазине",
    "🔁 הפוך לתנועה קבועה (חוזרת כל חודש)": "🔁 Сделать регулярной (каждый месяц)",
    "הוסף הוצאה": "Добавить расход", "הוסף הכנסה": "Добавить доход",
    // גרפים
    "פילוח לפי קטגוריה": "Разбивка по категориям", "אין הוצאות להצגה בחודש זה.": "Нет расходов за этот месяц.",
    "מגמה — 6 חודשים אחרונים": "Динамика — последние 6 месяцев",
    "מאזן מצטבר לאורך החודש": "Накопленный баланс за месяц", "אין תנועות בחודש זה להצגת מאזן.": "Нет операций для баланса.",
    'סה"כ הוצאות': "Всего расходов",
    // רשימה
    "התנועות שלי": "Мои операции", "🔍 חיפוש...": "🔍 Поиск...", "חיפוש תנועות": "Поиск операций",
    "סינון לפי סוג": "Фильтр по типу", "סינון לפי קטגוריה": "Фильтр по категории",
    "כל הקטגוריות": "Все категории",
    "💡 לחיצה על תנועה פותחת עריכה": "💡 Нажмите на операцию для редактирования",
    "עדיין אין תנועות בחודש זה. הוסף את הראשונה! 👈": "Пока нет операций. Добавьте первую! 👈",
    "לא נמצאו תנועות התואמות לסינון.": "Операции по фильтру не найдены.",
    "🔁 קבוע": "🔁 регул.",
    // יעדים
    "🎯 יעדי חיסכון": "🎯 Цели накоплений", "+ יעד חדש": "+ Новая цель",
    "אין עדיין יעדים. הגדר יעד חיסכון ראשון והתחל לעקוב! 🚀": "Пока нет целей. Задайте первую цель накоплений! 🚀",
    "🎉 הושג!": "🎉 Достигнуто!", "+ הוסף לחיסכון": "+ Пополнить", "מתוך ": "из ",
    // תקציב לפי קטגוריה
    "📊 תקציב לפי קטגוריה": "📊 Бюджет по категориям", "+ הגדר תקציב לקטגוריה": "+ Задать бюджет категории",
    "הגדר תקציב חודשי לקטגוריות ספציפיות (למשל 500₪ למסעדות) ועקוב אחרי כל אחת בנפרד.": "Задайте месячный бюджет для отдельных категорий (напр. 500₪ на рестораны).",
    // תנועות קבועות
    "🔁 תנועות קבועות": "🔁 Регулярные операции", "מתווספות אוטומטית בכל חודש חדש": "Добавляются автоматически каждый месяц",
    'אין תנועות קבועות. סמן "הפוך לתנועה קבועה" בעת הוספת תנועה. 🔁': "Нет регулярных операций. Отметьте «Сделать регулярной» при добавлении. 🔁",
    "כל חודש ב-": "Каждый месяц, ", " לחודש": "-го числа",
    // ניהול נתונים
    "ניהול נתונים": "Управление данными",
    "הנתונים שלך נשמרים אך ורק בדפדפן הזה, במכשיר שלך. מומלץ לגבות מדי פעם.": "Данные хранятся только в этом браузере, на вашем устройстве. Делайте резервные копии.",
    "🎬 טען נתוני הדגמה": "🎬 Загрузить демо-данные", "🖨️ דוח חודשי (הדפסה/PDF)": "🖨️ Месячный отчёт (печать/PDF)",
    "📤 ייצוא (JSON)": "📤 Экспорт (JSON)", "📊 ייצוא (CSV)": "📊 Экспорт (CSV)",
    "📥 ייבוא מקובץ": "📥 Импорт из файла", "🗑️ מחיקת הכל": "🗑️ Удалить всё",
    "💾 כל הנתונים נשמרים במכשיר שלך בלבד — ללא שרת, ללא הרשמה, ללא מעקב.": "💾 Все данные хранятся только на вашем устройстве — без сервера, регистрации и слежки.",
    // מודלים
    "הגדרת תקציב חודשי": "Настройка месячного бюджета",
    "קבע כמה אתה מתכנן להוציא החודש. נעדכן אותך כשתתקרב לחריגה.": "Укажите, сколько планируете потратить в этом месяце.",
    "סכום התקציב (₪)": "Сумма бюджета (₪)", "למשל: 5000": "Напр.: 5000",
    "ביטול": "Отмена", "אפס תקציב": "Сбросить бюджет", "שמירה": "Сохранить",
    "עריכת תנועה": "Редактирование операции", "קטגוריה": "Категория", "תיאור": "Описание", "תאריך": "Дата", "מחק": "Удалить",
    "יעד חיסכון חדש": "Новая цель накоплений",
    "קבע לעצמך מטרה — נעקוב אחרי ההתקדמות ונחגוג כשתגיע אליה! 🎉": "Поставьте цель — мы отследим прогресс и отметим её достижение! 🎉",
    "שם היעד": "Название цели", "למשל: אוזניות חדשות": "Напр.: новые наушники",
    "סכום היעד (₪)": "Сумма цели (₪)", "למשל: 800": "Напр.: 800",
    "כמה כבר חסכת? (לא חובה)": "Сколько уже накоплено? (необязательно)",
    "הוספה לחיסכון": "Пополнить накопления", "סכום להוספה (₪)": "Сумма пополнения (₪)", "למשל: 50": "Напр.: 50", "הוסף": "Добавить",
    "ניהול קטגוריות": "Управление категориями",
    "הוסף קטגוריות משלך. אפשר למחוק רק קטגוריות שיצרת.": "Добавляйте свои категории. Удалять можно только созданные вами.",
    "שם הקטגוריה": "Название категории", "למשל: חיות מחמד": "Напр.: питомцы",
    "צבע": "Цвет", "אייקון": "Иконка", "סגור": "Закрыть", "+ הוסף קטגוריה": "+ Добавить категорию", "מובנה": "встроенная",
    "הוצאה": "Расход", "הכנסה": "Доход",
    "תקציב לקטגוריה": "Бюджет категории", "קבע תקרת הוצאה חודשית לקטגוריה. חל על כל חודש.": "Задайте месячный лимит расходов для категории.",
    "תקציב חודשי (₪)": "Месячный бюджет (₪)", "למשל: 500": "Напр.: 500",
    "סגירה": "Закрыть", "💸 ההוצאות הגדולות": "💸 Крупнейшие расходы",
    "אין תנועות בחודש זה. בחר חודש אחר או הוסף תנועות.": "Нет операций в этом месяце. Выберите другой месяц.",
    // תובנות
    "ממוצע הוצאה יומית": "Средний расход в день", "על פני ": "за ", " ימים": " дн.",
    "הקטגוריה היקרה ביותר": "Самая крупная категория", "אין הוצאות עדיין": "Пока нет расходов",
    "תחזית להוצאות החודש": "Прогноз расходов за месяц", "בקצב הנוכחי": "при текущем темпе",
    "סך ההוצאות": "Всего расходов", "לעומת החודש הקודם": "По сравнению с прошлым месяцем",
    "יותר ב-": "больше на ", "פחות ב-": "меньше на ", "אין נתונים להשוואה": "Нет данных для сравнения",
    // סיכום/תקציב מחרוזות דינמיות
    "מאזן": "Баланс", "הכנסות": "Доходы", "הוצאות": "Расходы",
    "סיכום — ": "Итоги — ", "🎯 תקציב: ": "🎯 Бюджет: ", " · נוצל ": " · использовано ",
    "⚠️ חריגה של ": "⚠️ превышение на ", "נותרו מהתקציב ": "Осталось от бюджета ", "נותרו ": "осталось ",
    "% נוצל)": "% использовано)", "לא הוגדר תקציב לחודש זה": "Бюджет на месяц не задан",
    " תנועות החודש · ": " операций за месяц · ", "חסכת ": "сэкономлено ", "% מההכנסות 🌱": "% доходов 🌱",
    "החודש ההוצאות עלו על ההכנסות": "В этом месяце расходы превысили доходы",
    " — נחסך ": " — накоплено ", " מתוך ": " из ",
    // הודעות (toast) ודיאלוגים
    "הוצאה נוספה ✅": "Расход добавлен ✅", "הכנסה נוספה ✅": "Доход добавлен ✅",
    "נא להזין סכום חוקי": "Введите корректную сумму", "התנועה נמחקה": "Операция удалена",
    "התנועה עודכנה ✅": "Операция обновлена ✅",
    "נוספו ": "Добавлено ", " תנועות קבועות לחודש זה 🔁": " регулярных операций 🔁",
    "התנועה הקבועה הוסרה": "Регулярная операция удалена",
    "תקציב ל": "Бюджет за ", " נשמר": " сохранён", "התקציב אופס": "Бюджет сброшен",
    "הנתונים יוצאו לקובץ JSON": "Данные экспортированы в JSON", "אין נתונים לייצוא": "Нет данных для экспорта",
    "הנתונים יוצאו לקובץ CSV": "Данные экспортированы в CSV", "הנתונים יובאו בהצלחה ✅": "Данные импортированы ✅",
    "שגיאה: הקובץ אינו תקין": "Ошибка: неверный файл", "אין נתונים למחיקה": "Нет данных для удаления",
    "כל הנתונים נמחקו": "Все данные удалены",
    "היעד נשמר 🎯": "Цель сохранена 🎯", "היעד נמחק": "Цель удалена", "נוסף לחיסכון 💰": "Добавлено к накоплениям 💰",
    'מזל טוב! השגת את היעד "': "Поздравляем! Цель «", '" 🎉': "» 🎉",
    "הקטגוריה נוספה 🏷️": "Категория добавлена 🏷️", "הקטגוריה נמחקה": "Категория удалена",
    "תקציב הקטגוריה נשמר 📊": "Бюджет категории сохранён 📊", "תקציב הקטגוריה הוסר": "Бюджет категории удалён",
    "אין תנועות בחודש זה להפקת דוח": "Нет операций для отчёта", "נא להזין שם ליעד": "Введите название цели",
    "נא להזין סכום יעד חוקי": "Введите корректную сумму цели", "נא להזין שם לקטגוריה": "Введите название категории", "נא להזין סכום": "Введите сумму",
    "למחוק את הקטגוריה?": "Удалить категорию?", "למחוק את היעד?": "Удалить цель?",
    "קטגוריה זו בשימוש בתנועות קיימות. למחוק בכל זאת? התנועות יישארו אך ללא קטגוריה מזוהה.": "Категория используется в операциях. Всё равно удалить? Операции останутся без категории.",
    "להסיר את התנועה הקבועה? תנועות שכבר נוספו יישארו.": "Удалить регулярную операцию? Уже добавленные останутся.",
    "הקובץ מכיל ": "Файл содержит ", " תנועות. אישור = מיזוג עם הקיים · ביטול = החלפה מלאה": " операций. OK = объединить · Отмена = заменить",
    "למחוק את כל הנתונים לצמיתות? פעולה זו אינה הפיכה.\n\nמומלץ לייצא גיבוי קודם.": "Удалить все данные навсегда? Действие необратимо.\n\nСначала лучше сделать экспорт.",
    "בטוח לגמרי? כל התנועות, היעדים, התקציבים והתנועות הקבועות יימחקו.": "Точно уверены? Все операции, цели, бюджеты и регулярные операции будут удалены.",
    // דוח
    "דוח תקציב — ": "Бюджетный отчёт — ", "הופק בתאריך ": "Сформирован ",
    "פילוח הוצאות לפי קטגוריה": "Расходы по категориям", "סכום": "Сумма", "אחוז": "%",
    "אין הוצאות": "Нет расходов", "כל התנועות (": "Все операции (", 'הופק ע"י ': "Сформировано: ",
    // קטגוריות (generic)
    "מזון וסופר": "Продукты", "מסעדות ובתי קפה": "Кафе и рестораны", "תחבורה": "Транспорт",
    "דיור וחשבונות": "Жильё и счета", "קניות": "Покупки", "בריאות": "Здоровье",
    "בילויים": "Развлечения", "חינוך": "Образование", "אחר": "Другое",
    "משכורת": "Зарплата", "דמי כיס": "Карманные деньги", "מתנה": "Подарок",
    "עבודה עצמאית": "Фриланс", "החזר": "Возврат", "הכל": "Все",
    // חודשים
    "ינואר": "Январь", "פברואר": "Февраль", "מרץ": "Март", "אפריל": "Апрель", "מאי": "Май", "יוני": "Июнь",
    "יולי": "Июль", "אוגוסט": "Август", "ספטמבר": "Сентябрь", "אוקטובר": "Октябрь", "נובמבר": "Ноябрь", "דצמבר": "Декабрь",
    "ינו": "Янв", "פבר": "Фев", "אפר": "Апр", "יונ": "Июн", "יול": "Июл", "אוג": "Авг", "ספט": "Сен", "אוק": "Окт", "נוב": "Ноя", "דצמ": "Дек",
    // aria-labels ותוויות נסתרות
    "סיכום החודש": "Сводка за месяц", "מחק תנועה": "Удалить операцию", "בחר אייקון": "Выбрать иконку",
    "גרף עוגה של הוצאות לפי קטגוריה": "Круговая диаграмма расходов по категориям",
    "גרף עמודות של הכנסות והוצאות לפי חודש": "Столбчатая диаграмма доходов и расходов по месяцам",
    "גרף קו של המאזן המצטבר לאורך החודש": "Линейный график накопленного баланса за месяц",
    "מצב הדגמה": "Демо-режим", "— הנתונים שמוצגים הם לדוגמה בלבד": "— показаны демонстрационные данные",
    "יציאה ממצב הדגמה ↩️": "Выйти из демо-режима ↩️", "🏅 ההישגים שלי": "🏅 Мои достижения", "נאספו": "Собрано",
    // סקירת חודש / טבלאות
    "➕ הוספה": "➕ Добавить", "📋 סקירת החודש": "📋 Обзор месяца",
    "📅 סכום חודשי": "📅 Сумма за месяц", "כמה הוצאת החודש על כל נושא? מלא סכום כולל לכל קטגוריה.": "Сколько вы потратили в этом месяце по темам? Укажите итог по каждой категории.",
    "💾 שמור סכומים": "💾 Сохранить суммы", "הסכומים נשמרו ✅": "Суммы сохранены ✅", "סכום חודשי": "Сумма за месяц",
    "פירוט לפי קטגוריה — ": "Расходы по категориям — ", "פירוט לפי קטגוריה": "Расходы по категориям", "כל התנועות": "Все операции",
    'סה"כ': "Итого", "אין הוצאות בחודש זה": "Нет расходов в этом месяце", "אין תנועות בחודש זה": "Нет операций в этом месяце", "התפלגות": "Доля",
    "⤢ הגדל": "⤢ Увеличить", "הגדל למסך מלא": "На весь экран", "✕ סגור": "✕ Закрыть", "מאזן החודש (תקציב − הוצאות)": "Баланс месяца (бюджет − расходы)",
    "תקציב חודשי כולל (₪)": "Общий месячный бюджет (₪)", "תקציב חודשי כולל": "Общий месячный бюджет",
    "תוכנן לחודש": "План на месяц", "הוצא בפועל": "Потрачено", "נשאר החודש": "Остаток на конец месяца", "נשאר": "Остаток",
    "כמה להוסיף להוצאה?": "Сколько добавить к расходу?", "הוסף הוצאה": "Добавить расход",
    "סכום": "Сумма", "+ הוסף": "+ Добавить", "אין תנועות בקטגוריה זו": "Нет операций в этой категории",
    "📊 מעקב": "📊 Учёт", "🎯 תכנון": "🎯 Планирование",
    "שיטת מעקב:": "Способ учёта:", "📝 תנועות": "📝 Операции", "📊 טבלה": "📊 Таблица",
    "הצג את כל ההוצאות בקטגוריה": "Показать все расходы категории", "📊 ייצוא לאקסל (CSV)": "📊 Экспорт в Excel (CSV)", "אין תנועות לייצוא": "Нет операций для экспорта",
    "נושא": "Тема", "כמה": "Сколько", "מתי": "Когда",
    "היום": "Сегодня", "אתמול": "Вчера", "תחילת החודש": "Начало месяца", "תאריך ההוצאה": "Дата расхода", "יום ": "",
    "ראשון": "воскресенье", "שני": "понедельник", "שלישי": "вторник", "רביעי": "среда", "חמישי": "четверг", "שישי": "пятница", "שבת": "суббота",
    "📅 תוצאות לפי חודש": "📅 Итоги по месяцам", "כל החודשים במבט אחד": "Все месяцы в одной таблице",
    "חודש": "Месяц", "תקציב": "Бюджет", "שינוי": "Изменение", "אין נתונים עדיין": "Пока нет данных",
    "נשאר בחודש הקודם": "Остаток за прошлый месяц", "תאריך ההוצאה": "Дата расхода",
    "מחק קטגוריה": "Удалить категорию", "עברנו לחודש חדש — ": "Начался новый месяц — ",
    // תוויות כלליות נוספות
    "ערוך": "Изм.",
  };
  const TR_EN = {
    "מעקב הוצאות והכנסות": "expense & income tracker",
    "📋 סיכום חודשי": "📋 Monthly summary", "סיכום חודשי": "Monthly summary", "סיכום נקי של החודש": "Clean monthly summary",
    "החלף מצב תצוגה": "Toggle theme", "מצב כהה/בהיר": "Dark/light mode",
    "חודש קודם": "Previous month", "בחר חודש": "Select month", "חודש הבא": "Next month",
    "הכנסות החודש": "Income this month", "הוצאות החודש": "Expenses this month",
    "מאזן החודש (הכנסות − הוצאות)": "Monthly balance (income − expenses)",
    "תקציב חודשי": "Monthly budget", "ערוך תקציב": "Edit budget", "✨ תובנות חכמות": "✨ Smart insights",
    "הוספת תנועה": "Add transaction", "➖ הוצאה": "➖ Expense", "➕ הכנסה": "➕ Income",
    "סכום (₪)": "Amount (₪)", "⚙️ נהל קטגוריות": "⚙️ Categories",
    "תיאור (לא חובה)": "Description (optional)", "למשל: קניות בסופר": "e.g. groceries",
    "🔁 הפוך לתנועה קבועה (חוזרת כל חודש)": "🔁 Make recurring (every month)",
    "הוסף הוצאה": "Add expense", "הוסף הכנסה": "Add income",
    "פילוח לפי קטגוריה": "Breakdown by category", "אין הוצאות להצגה בחודש זה.": "No expenses to show this month.",
    "מגמה — 6 חודשים אחרונים": "Trend — last 6 months",
    "מאזן מצטבר לאורך החודש": "Cumulative balance this month", "אין תנועות בחודש זה להצגת מאזן.": "No transactions to show a balance.",
    'סה"כ הוצאות': "Total expenses",
    "התנועות שלי": "My transactions", "🔍 חיפוש...": "🔍 Search...", "חיפוש תנועות": "Search transactions",
    "סינון לפי סוג": "Filter by type", "סינון לפי קטגוריה": "Filter by category", "כל הקטגוריות": "All categories",
    "💡 לחיצה על תנועה פותחת עריכה": "💡 Click a transaction to edit",
    "עדיין אין תנועות בחודש זה. הוסף את הראשונה! 👈": "No transactions yet this month. Add the first! 👈",
    "לא נמצאו תנועות התואמות לסינון.": "No transactions match the filter.", "🔁 קבוע": "🔁 recurring",
    "🎯 יעדי חיסכון": "🎯 Savings goals", "+ יעד חדש": "+ New goal",
    "אין עדיין יעדים. הגדר יעד חיסכון ראשון והתחל לעקוב! 🚀": "No goals yet. Set your first savings goal! 🚀",
    "🎉 הושג!": "🎉 Reached!", "+ הוסף לחיסכון": "+ Add to savings", "מתוך ": "of ",
    "📊 תקציב לפי קטגוריה": "📊 Budget by category", "+ הגדר תקציב לקטגוריה": "+ Set category budget",
    "הגדר תקציב חודשי לקטגוריות ספציפיות (למשל 500₪ למסעדות) ועקוב אחרי כל אחת בנפרד.": "Set a monthly budget for specific categories (e.g. 500₪ for dining).",
    "🔁 תנועות קבועות": "🔁 Recurring transactions", "מתווספות אוטומטית בכל חודש חדש": "Added automatically every new month",
    'אין תנועות קבועות. סמן "הפוך לתנועה קבועה" בעת הוספת תנועה. 🔁': 'No recurring transactions. Check "Make recurring" when adding. 🔁',
    "כל חודש ב-": "Monthly on day ", " לחודש": "",
    "ניהול נתונים": "Data management",
    "הנתונים שלך נשמרים אך ורק בדפדפן הזה, במכשיר שלך. מומלץ לגבות מדי פעם.": "Your data is stored only in this browser, on your device. Back up occasionally.",
    "🎬 טען נתוני הדגמה": "🎬 Load demo data", "🖨️ דוח חודשי (הדפסה/PDF)": "🖨️ Monthly report (print/PDF)",
    "📤 ייצוא (JSON)": "📤 Export (JSON)", "📊 ייצוא (CSV)": "📊 Export (CSV)",
    "📥 ייבוא מקובץ": "📥 Import file", "🗑️ מחיקת הכל": "🗑️ Delete all",
    "💾 כל הנתונים נשמרים במכשיר שלך בלבד — ללא שרת, ללא הרשמה, ללא מעקב.": "💾 All data stays on your device only — no server, no signup, no tracking.",
    "הגדרת תקציב חודשי": "Set monthly budget",
    "קבע כמה אתה מתכנן להוציא החודש. נעדכן אותך כשתתקרב לחריגה.": "Set how much you plan to spend this month.",
    "סכום התקציב (₪)": "Budget amount (₪)", "למשל: 5000": "e.g. 5000",
    "ביטול": "Cancel", "אפס תקציב": "Reset budget", "שמירה": "Save",
    "עריכת תנועה": "Edit transaction", "קטגוריה": "Category", "תיאור": "Description", "תאריך": "Date", "מחק": "Delete",
    "יעד חיסכון חדש": "New savings goal",
    "קבע לעצמך מטרה — נעקוב אחרי ההתקדמות ונחגוג כשתגיע אליה! 🎉": "Set a goal — we'll track it and celebrate when you reach it! 🎉",
    "שם היעד": "Goal name", "למשל: אוזניות חדשות": "e.g. new headphones",
    "סכום היעד (₪)": "Goal amount (₪)", "למשל: 800": "e.g. 800",
    "כמה כבר חסכת? (לא חובה)": "How much saved already? (optional)",
    "הוספה לחיסכון": "Add to savings", "סכום להוספה (₪)": "Amount to add (₪)", "למשל: 50": "e.g. 50", "הוסף": "Add",
    "ניהול קטגוריות": "Manage categories",
    "הוסף קטגוריות משלך. אפשר למחוק רק קטגוריות שיצרת.": "Add your own categories. You can delete only ones you created.",
    "שם הקטגוריה": "Category name", "למשל: חיות מחמד": "e.g. pets",
    "צבע": "Color", "אייקון": "Icon", "סגור": "Close", "+ הוסף קטגוריה": "+ Add category", "מובנה": "built-in",
    "הוצאה": "Expense", "הכנסה": "Income",
    "תקציב לקטגוריה": "Category budget", "קבע תקרת הוצאה חודשית לקטגוריה. חל על כל חודש.": "Set a monthly spending cap for the category.",
    "תקציב חודשי (₪)": "Monthly budget (₪)", "למשל: 500": "e.g. 500",
    "סגירה": "Close", "💸 ההוצאות הגדולות": "💸 Top expenses",
    "אין תנועות בחודש זה. בחר חודש אחר או הוסף תנועות.": "No transactions this month. Pick another month or add some.",
    "ממוצע הוצאה יומית": "Average daily spend", "על פני ": "over ", " ימים": " days",
    "הקטגוריה היקרה ביותר": "Biggest category", "אין הוצאות עדיין": "No expenses yet",
    "תחזית להוצאות החודש": "Projected monthly spend", "בקצב הנוכחי": "at current pace",
    "סך ההוצאות": "Total expenses", "לעומת החודש הקודם": "vs. previous month",
    "יותר ב-": "more by ", "פחות ב-": "less by ", "אין נתונים להשוואה": "No data to compare",
    "מאזן": "Balance", "הכנסות": "Income", "הוצאות": "Expenses",
    "סיכום — ": "Summary — ", "🎯 תקציב: ": "🎯 Budget: ", " · נוצל ": " · used ",
    "⚠️ חריגה של ": "⚠️ over by ", "נותרו מהתקציב ": "Budget left ", "נותרו ": "left ",
    "% נוצל)": "% used)", "לא הוגדר תקציב לחודש זה": "No budget set for this month",
    " תנועות החודש · ": " transactions · ", "חסכת ": "saved ", "% מההכנסות 🌱": "% of income 🌱",
    "החודש ההוצאות עלו על ההכנסות": "This month expenses exceeded income",
    " — נחסך ": " — saved ", " מתוך ": " of ",
    "הוצאה נוספה ✅": "Expense added ✅", "הכנסה נוספה ✅": "Income added ✅",
    "נא להזין סכום חוקי": "Enter a valid amount", "התנועה נמחקה": "Transaction deleted",
    "התנועה עודכנה ✅": "Transaction updated ✅",
    "נוספו ": "Added ", " תנועות קבועות לחודש זה 🔁": " recurring transactions 🔁",
    "התנועה הקבועה הוסרה": "Recurring transaction removed",
    "תקציב ל": "Budget for ", " נשמר": " saved", "התקציב אופס": "Budget reset",
    "הנתונים יוצאו לקובץ JSON": "Data exported to JSON", "אין נתונים לייצוא": "No data to export",
    "הנתונים יוצאו לקובץ CSV": "Data exported to CSV", "הנתונים יובאו בהצלחה ✅": "Data imported ✅",
    "שגיאה: הקובץ אינו תקין": "Error: invalid file", "אין נתונים למחיקה": "No data to delete",
    "כל הנתונים נמחקו": "All data deleted",
    "היעד נשמר 🎯": "Goal saved 🎯", "היעד נמחק": "Goal deleted", "נוסף לחיסכון 💰": "Added to savings 💰",
    'מזל טוב! השגת את היעד "': 'Congrats! You reached the goal "', '" 🎉': '" 🎉',
    "הקטגוריה נוספה 🏷️": "Category added 🏷️", "הקטגוריה נמחקה": "Category deleted",
    "תקציב הקטגוריה נשמר 📊": "Category budget saved 📊", "תקציב הקטגוריה הוסר": "Category budget removed",
    "אין תנועות בחודש זה להפקת דוח": "No transactions for a report", "נא להזין שם ליעד": "Enter a goal name",
    "נא להזין סכום יעד חוקי": "Enter a valid goal amount", "נא להזין שם לקטגוריה": "Enter a category name", "נא להזין סכום": "Enter an amount",
    "למחוק את הקטגוריה?": "Delete the category?", "למחוק את היעד?": "Delete the goal?",
    "קטגוריה זו בשימוש בתנועות קיימות. למחוק בכל זאת? התנועות יישארו אך ללא קטגוריה מזוהה.": "This category is used by existing transactions. Delete anyway? They'll remain uncategorized.",
    "להסיר את התנועה הקבועה? תנועות שכבר נוספו יישארו.": "Remove the recurring transaction? Already-added ones remain.",
    "הקובץ מכיל ": "The file has ", " תנועות. אישור = מיזוג עם הקיים · ביטול = החלפה מלאה": " transactions. OK = merge · Cancel = replace",
    "למחוק את כל הנתונים לצמיתות? פעולה זו אינה הפיכה.\n\nמומלץ לייצא גיבוי קודם.": "Delete all data permanently? This cannot be undone.\n\nExport a backup first.",
    "בטוח לגמרי? כל התנועות, היעדים, התקציבים והתנועות הקבועות יימחקו.": "Absolutely sure? All transactions, goals, budgets and recurring items will be deleted.",
    "דוח תקציב — ": "Budget report — ", "הופק בתאריך ": "Generated ", "פילוח הוצאות לפי קטגוריה": "Expenses by category",
    "סכום": "Amount", "אחוז": "%", "אין הוצאות": "No expenses", "כל התנועות (": "All transactions (", 'הופק ע"י ': "Generated by ",
    "מזון וסופר": "Groceries", "מסעדות ובתי קפה": "Dining & cafés", "תחבורה": "Transport",
    "דיור וחשבונות": "Housing & bills", "קניות": "Shopping", "בריאות": "Health",
    "בילויים": "Entertainment", "חינוך": "Education", "אחר": "Other",
    "משכורת": "Salary", "דמי כיס": "Allowance", "מתנה": "Gift", "עבודה עצמאית": "Freelance", "החזר": "Refund", "הכל": "All",
    "ינואר": "January", "פברואר": "February", "מרץ": "March", "אפריל": "April", "מאי": "May", "יוני": "June",
    "יולי": "July", "אוגוסט": "August", "ספטמבר": "September", "אוקטובר": "October", "נובמבר": "November", "דצמבר": "December",
    "ינו": "Jan", "פבר": "Feb", "מרץ": "Mar", "אפר": "Apr", "מאי": "May", "יונ": "Jun", "יול": "Jul", "אוג": "Aug", "ספט": "Sep", "אוק": "Oct", "נוב": "Nov", "דצמ": "Dec",
    "סיכום החודש": "Monthly summary", "מחק תנועה": "Delete transaction", "בחר אייקון": "Choose icon",
    "גרף עוגה של הוצאות לפי קטגוריה": "Pie chart of expenses by category",
    "גרף עמודות של הכנסות והוצאות לפי חודש": "Bar chart of income and expenses by month",
    "גרף קו של המאזן המצטבר לאורך החודש": "Line chart of cumulative balance",
    "מצב הדגמה": "Demo mode", "— הנתונים שמוצגים הם לדוגמה בלבד": "— showing sample data only",
    "יציאה ממצב הדגמה ↩️": "Exit demo mode ↩️", "🏅 ההישגים שלי": "🏅 My achievements", "נאספו": "Collected",
    "➕ הוספה": "➕ Add", "📋 סקירת החודש": "📋 Month overview",
    "📅 סכום חודשי": "📅 Monthly amount", "כמה הוצאת החודש על כל נושא? מלא סכום כולל לכל קטגוריה.": "How much did you spend this month per topic? Enter a total per category.",
    "💾 שמור סכומים": "💾 Save amounts", "הסכומים נשמרו ✅": "Amounts saved ✅", "סכום חודשי": "Monthly amount",
    "פירוט לפי קטגוריה — ": "Breakdown by category — ", "פירוט לפי קטגוריה": "Breakdown by category", "כל התנועות": "All transactions",
    'סה"כ': "Total", "אין הוצאות בחודש זה": "No expenses this month", "אין תנועות בחודש זה": "No transactions this month", "התפלגות": "Share",
    "⤢ הגדל": "⤢ Enlarge", "הגדל למסך מלא": "Fullscreen", "✕ סגור": "✕ Close", "מאזן החודש (תקציב − הוצאות)": "Monthly balance (budget − expenses)",
    "תקציב חודשי כולל (₪)": "Total monthly budget (₪)", "תקציב חודשי כולל": "Total monthly budget",
    "תוכנן לחודש": "Planned", "הוצא בפועל": "Spent", "נשאר החודש": "Left this month", "נשאר": "Left",
    "כמה להוסיף להוצאה?": "How much to add?", "הוסף הוצאה": "Add expense",
    "סכום": "Amount", "+ הוסף": "+ Add", "אין תנועות בקטגוריה זו": "No transactions in this category",
    "📊 מעקב": "📊 Tracking", "🎯 תכנון": "🎯 Planning",
    "שיטת מעקב:": "Tracking method:", "📝 תנועות": "📝 Transactions", "📊 טבלה": "📊 Table",
    "הצג את כל ההוצאות בקטגוריה": "Show all expenses in this category", "📊 ייצוא לאקסל (CSV)": "📊 Export to Excel (CSV)", "אין תנועות לייצוא": "No transactions to export",
    "נושא": "Topic", "כמה": "Amount", "מתי": "When",
    "היום": "Today", "אתמול": "Yesterday", "תחילת החודש": "Start of month", "תאריך ההוצאה": "Expense date", "יום ": "",
    "ראשון": "Sunday", "שני": "Monday", "שלישי": "Tuesday", "רביעי": "Wednesday", "חמישי": "Thursday", "שישי": "Friday", "שבת": "Saturday",
    "📅 תוצאות לפי חודש": "📅 Results by month", "כל החודשים במבט אחד": "All months at a glance",
    "חודש": "Month", "תקציב": "Budget", "שינוי": "Change", "אין נתונים עדיין": "No data yet",
    "נשאר בחודש הקודם": "Left last month", "תאריך ההוצאה": "Expense date",
    "מחק קטגוריה": "Delete category", "עברנו לחודש חדש — ": "New month started — ",
    "ערוך": "Edit",
  };
  const DICTS = { ru: TR_RU, en: TR_EN };
  const ACTIVE_DICT = DICTS[APP.lang] || null;
  const TR_SORTED = ACTIVE_DICT ? Object.entries(ACTIVE_DICT).sort((a, b) => b[0].length - a[0].length) : [];
  const HE_RE = /[֐-׿]/;
  function tr(s) {
    if (!ACTIVE_DICT || !s || !HE_RE.test(s)) return s;
    for (const [he, ru] of TR_SORTED) if (s.indexOf(he) !== -1) s = s.split(he).join(ru);
    return s;
  }
  function translateDom(root) {
    if (!ACTIVE_DICT) return;
    root = root || document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !HE_RE.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        const p = n.parentNode && n.parentNode.nodeName;
        if (p === "SCRIPT" || p === "STYLE" || p === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => { n.nodeValue = tr(n.nodeValue); });
    root.querySelectorAll("[placeholder],[title],[aria-label]").forEach((elm) => {
      ["placeholder", "title", "aria-label"].forEach((a) => {
        const v = elm.getAttribute(a);
        if (v && HE_RE.test(v)) elm.setAttribute(a, tr(v));
      });
    });
  }
  // תרגום אוטומטי של דיאלוגים native
  if (ACTIVE_DICT) {
    const _c = window.confirm.bind(window); window.confirm = (m) => _c(tr(m));
    const _a = window.alert.bind(window); window.alert = (m) => _a(tr(m));
  }

  const NS = CFG.storeKey || "budgethelper";
  const K = {
    tx: `${NS}.transactions.v1`,
    budget: `${NS}.budgets.v1`,
    goals: `${NS}.goals.v1`,
    recurring: `${NS}.recurring.v1`,
    recApplied: `${NS}.recApplied.v1`,
    customCats: `${NS}.customCats.v1`,
    hiddenCats: `${NS}.hiddenCats.v1`,
    catBudgets: `${NS}.catBudgets.v1`,
    theme: `${NS}.theme`,
    demoActive: `${NS}.demoActive`,
    demoBackup: `${NS}.demoBackup`,
    method: `${NS}.method`,
  };

  /* ---------- קטגוריות (מובנות לפי preset) ---------- */
  const PRESETS = {
    generic: {
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
    },
    kids: {
      expense: [
        { id: "candy", name: "ממתקים וחטיפים", icon: "🍬", color: "#ec4899" },
        { id: "games", name: "משחקים ואפליקציות", icon: "🎮", color: "#8b5cf6" },
        { id: "toys", name: "צעצועים", icon: "🧸", color: "#f59e0b" },
        { id: "outings", name: "בילויים ויציאות", icon: "🎡", color: "#06b6d4" },
        { id: "collect", name: "אספנות (קלפים/מדבקות)", icon: "🃏", color: "#3b82f6" },
        { id: "gift_out", name: "מתנות שקניתי", icon: "🎁", color: "#f43f5e" },
        { id: "kids_other", name: "אחר", icon: "📌", color: "#64748b" },
      ],
      income: [
        { id: "allowance", name: "דמי כיס", icon: "🪙", color: "#22c55e" },
        { id: "chores", name: "עבודות בית", icon: "🧹", color: "#10b981" },
        { id: "birthday", name: "כסף יום הולדת", icon: "🎂", color: "#84cc16" },
        { id: "gift_in", name: "מתנה", icon: "💌", color: "#0ea5e9" },
        { id: "kids_other_in", name: "אחר", icon: "📌", color: "#14b8a6" },
      ],
    },
    coach: {
      expense: [
        { id: "housing", name: "דיור ומשכנתא", icon: "🏠", color: "#8b5cf6" },
        { id: "food", name: "מזון וצריכה", icon: "🛒", color: "#f97316" },
        { id: "transport", name: "תחבורה ורכב", icon: "🚗", color: "#3b82f6" },
        { id: "bills", name: "חשבונות וחובה", icon: "🧾", color: "#0ea5e9" },
        { id: "insurance", name: "ביטוחים", icon: "🛡️", color: "#14b8a6" },
        { id: "debt", name: "החזרי הלוואות", icon: "💳", color: "#f43f5e" },
        { id: "health", name: "בריאות", icon: "💊", color: "#ef4444" },
        { id: "leisure", name: "פנאי ותרבות", icon: "🎭", color: "#f59e0b" },
        { id: "family", name: "משפחה וילדים", icon: "👨‍👩‍👧", color: "#ec4899" },
        { id: "other_exp", name: "אחר", icon: "📌", color: "#64748b" },
      ],
      income: [
        { id: "salary", name: "משכורת", icon: "💼", color: "#16a34a" },
        { id: "business", name: "הכנסה מעסק", icon: "🏢", color: "#22c55e" },
        { id: "investments", name: "השקעות ותשואות", icon: "📈", color: "#0ea5e9" },
        { id: "rental", name: "הכנסה משכירות", icon: "🏘️", color: "#84cc16" },
        { id: "other_inc", name: "אחר", icon: "📌", color: "#10b981" },
      ],
    },
  };
  const BUILTIN = PRESETS[APP.preset] || PRESETS.generic;
  const GOAL_EMOJIS = ["🎯", "🎧", "📱", "💻", "🎮", "✈️", "🚲", "👟", "🎸", "📷", "🏖️", "🎁", "💍", "🚗", "🏠", "💰"];

  // קטגוריות מותאמות אישית (נטענות מ-localStorage) ממוזגות עם המובנות
  let customCats = load(K.customCats, { expense: [], income: [] });
  if (!customCats.expense) customCats = { expense: [], income: [] };
  let hiddenCats = load(`${CFG.storeKey || "budgethelper"}.hiddenCats.v1`, []); // קטגוריות מובנות שהוסתרו
  if (!Array.isArray(hiddenCats)) hiddenCats = [];
  const catsOf = (type) => [...BUILTIN[type], ...(customCats[type] || [])].filter((c) => !hiddenCats.includes(c.id));
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
    localStorage.setItem(K.hiddenCats, JSON.stringify(hiddenCats));
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
    printReport: $("printReport"), demoBtn: $("demoBtn"),
    summaryBtn: $("summaryBtn"), summaryModal: $("summaryModal"), summaryTitle: $("summaryTitle"), summaryBody: $("summaryBody"), summaryClose: $("summaryClose"),
    cardTabs: document.querySelectorAll(".card-tab"), addView: $("addView"), reviewView: $("reviewView"), reviewPanel: $("reviewPanel"),
    monthlyView: $("monthlyView"), monthlyGrid: $("monthlyGrid"), monthlySave: $("monthlySave"), listCard: $("listCard"),
    catTableCard: $("catTableCard"), catTableBody: $("catTableBody"), balanceLabel: $("balanceLabel"),
    chartExpand: $("chartExpand"), chartModal: $("chartModal"), chartModalBody: $("chartModalBody"), chartModalTitle: $("chartModalTitle"), chartClose: $("chartClose"),
    btMonthlyBudget: $("btMonthlyBudget"), budgetTableBody: $("budgetTableBody"), budgetTableFoot: $("budgetTableFoot"), btAddCat: $("btAddCat"), btSummary: $("btSummary"),
    catTxModal: $("catTxModal"), catTxTitle: $("catTxTitle"), catTxList: $("catTxList"), catTxAmount: $("catTxAmount"), catTxDesc: $("catTxDesc"), catTxDate: $("catTxDate"), catTxAdd: $("catTxAdd"), catTxClose: $("catTxClose"), catTxExport: $("catTxExport"),
    btCompare: $("btCompare"), historyBody: $("historyBody"),
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
    translateDom(sel);
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
    const budget = budgets[currentMonth];
    // אם לא הוזנו הכנסות — התקציב משמש ככסף הזמין (מתאים למי שחי על פנסיה/סכום קבוע)
    const usingBudget = income <= 0 && budget > 0;
    const available = usingBudget ? budget : income;
    const bal = available - expense;
    animateValue(el.totalIncome, income);
    animateValue(el.totalExpense, expense);
    animateValue(el.balance, bal);
    el.balance.classList.toggle("negative", bal < 0);
    if (el.balanceLabel) el.balanceLabel.textContent = usingBudget ? "מאזן החודש (תקציב − הוצאות)" : "מאזן החודש (הכנסות − הוצאות)";

    if (budget > 0) {
      el.budgetValue.textContent = fmt(budget);
      el.budgetBar.hidden = false;
      const pct = Math.min(100, (expense / budget) * 100);
      el.budgetBarFill.style.width = pct + "%";
      el.budgetBarFill.style.background = pct >= 100 ? "var(--grad-expense)" : pct >= 80 ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "var(--grad-income)";
      const rem = budget - expense;
      if (rem >= 0) { el.budgetHint.textContent = `נותרו מהתקציב ${fmt(rem)} (${Math.round(pct)}% נוצל)`; el.budgetHint.style.color = pct >= 80 ? "var(--budget)" : "var(--text-muted)"; }
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

    if (el.listCard) el.listCard.hidden = monthTx().length === 0; // מסתתר כשאין תנועות כלל בחודש
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
    translateDom(document.querySelector(".list-card"));
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
    ctx.fillStyle = cssVar("--text-muted"); ctx.font = "12px sans-serif"; ctx.fillText(tr("סה\"כ הוצאות"), cx, cy + 14);

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
      ctx.fillText(tr(label), gx, H - padBottom + 6);
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
  function toast(msg) { el.toast.textContent = tr(msg); el.toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.hidden = true, 2600); }

  /* ---------- ESC סוגר מודלים ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    [el.budgetModal, el.editModal, el.goalModal, el.contribModal, el.catModal, el.catBudgetModal, el.summaryModal, el.chartModal, el.catTxModal].forEach((m) => m && (m.hidden = true));
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
    renderBudgetTable();
    toast("הקטגוריה נוספה 🏷️");
  });
  function deleteCat(id) {
    const used = transactions.some((t) => t.category === id);
    if (used && !confirm("קטגוריה זו בשימוש בתנועות קיימות. למחוק בכל זאת? התנועות יישארו אך ללא קטגוריה מזוהה.")) return;
    else if (!used && !confirm("למחוק את הקטגוריה?")) return;
    const isCustom = ["expense", "income"].some((type) => (customCats[type] || []).some((c) => c.id === id));
    if (isCustom) ["expense", "income"].forEach((type) => { customCats[type] = (customCats[type] || []).filter((c) => c.id !== id); });
    else { if (!hiddenCats.includes(id)) hiddenCats.push(id); } // קטגוריה מובנית — מוסתרת
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
        <p style="color:#999;font-size:12px;margin-top:24px;text-align:center">הופק ע"י ${escapeHtml(APP.brandedBy || APP.name)}</p>
      </div>`;
    root.querySelectorAll(".income").forEach((e) => e.style.color = "#059669");
    root.querySelectorAll(".expense").forEach((e) => e.style.color = "#dc2626");
    root.querySelectorAll("td").forEach((td) => { td.style.padding = "7px 8px"; td.style.borderBottom = "1px solid #eee"; });
    translateDom(root);
    setTimeout(() => window.print(), 100);
  }

  /* ---------- מיתוג (White-Label) ---------- */
  function applyBranding() {
    document.title = APP.name + " — " + tr("מעקב הוצאות והכנסות");
    if (APP.lang && APP.lang !== "he") {
      document.documentElement.setAttribute("lang", APP.lang);
      document.documentElement.setAttribute("dir", "ltr");
    }
    if (APP.hideDemo) { const dbtn = document.getElementById("demoBtn"); if (dbtn) dbtn.style.display = "none"; }
    if (APP.compact) document.body.classList.add("compact");
    if (APP.tableOnly) document.body.classList.add("table-only");
    if (APP.showTable) {
      document.body.classList.add("show-table");
      const m = (localStorage.getItem(K.method) === "table") ? "table" : "tx";
      document.body.classList.add("method-" + m);
      document.querySelectorAll(".method-btn").forEach((b) => b.classList.toggle("active", b.dataset.method === m));
    }
    document.body.dataset.page = "main";
    if (APP.variant) document.body.classList.add("variant-" + APP.variant);
    const logoEl = document.querySelector(".brand-logo");
    const h1 = document.querySelector(".brand h1");
    const sub = document.querySelector(".brand-sub");
    if (logoEl) logoEl.textContent = APP.logo;
    if (h1) h1.textContent = APP.name;
    if (sub) sub.textContent = APP.tagline;
    if (APP.accent) {
      const r = document.documentElement;
      const p = APP.accent.primary, p2 = APP.accent.primary2 || p;
      r.style.setProperty("--primary", p);
      r.style.setProperty("--primary-2", p2);
      r.style.setProperty("--primary-dark", p);
      r.style.setProperty("--grad", `linear-gradient(135deg, ${p} 0%, ${p2} 100%)`);
    }
    if (APP.brandedBy) {
      const foot = document.querySelector(".app-footer .container p");
      if (foot) foot.innerHTML = `מוגש לך ע"י <b>${escapeHtml(APP.brandedBy)}</b> · הנתונים נשמרים במכשיר שלך בלבד`;
    }
    // מצב ילדים: מציג את לוח ההישגים
    const badgesCard = document.querySelector(".badges-card");
    if (badgesCard) badgesCard.hidden = !APP.kids;
  }

  /* ---------- הישגים / מדליות (מצב ילדים) ---------- */
  const BADGES = [
    { id: "first_tx", emoji: "✍️", name: "הצעד הראשון", desc: "רשמת תנועה ראשונה", test: () => transactions.length >= 1 },
    { id: "ten_tx", emoji: "🔟", name: "עשר על עשר", desc: "רשמת 10 תנועות", test: () => transactions.length >= 10 },
    { id: "first_goal", emoji: "🎯", name: "חולם בגדול", desc: "יצרת יעד חיסכון", test: () => goals.length >= 1 },
    { id: "goal_done", emoji: "🏆", name: "הגשמת חלום", desc: "השגת יעד חיסכון", test: () => goals.some((g) => g.saved >= g.target) },
    { id: "saver", emoji: "💰", name: "חסכן על", desc: "חסכת 100₪ סה\"כ ביעדים", test: () => goals.reduce((s, g) => s + g.saved, 0) >= 100 },
    { id: "consistent", emoji: "📅", name: "עקבי", desc: "רשמת תנועות ב-5 ימים שונים", test: () => new Set(transactions.map((t) => t.date)).size >= 5 },
    { id: "budgeter", emoji: "🧠", name: "ראש מתכנן", desc: "הגדרת תקציב חודשי", test: () => Object.keys(budgets).length >= 1 },
    { id: "positive", emoji: "🌱", name: "יותר נכנס מיוצא", desc: "סיימת חודש עם מאזן חיובי", test: () => { const byM = {}; transactions.forEach((t) => byM[ymOf(t.date)] = (byM[ymOf(t.date)] || 0) + (t.type === "income" ? t.amount : -t.amount)); return Object.values(byM).some((v) => v > 0); } },
  ];
  function renderBadges() {
    if (!APP.kids) return;
    const grid = document.getElementById("badgesGrid");
    if (!grid) return;
    let unlocked = 0;
    grid.innerHTML = BADGES.map((b) => {
      const got = b.test();
      if (got) unlocked++;
      return `<div class="badge ${got ? "unlocked" : "locked"}" title="${escapeHtml(b.desc)}">
        <span class="badge-emoji">${got ? b.emoji : "🔒"}</span>
        <span class="badge-name">${escapeHtml(b.name)}</span>
        <span class="badge-desc">${escapeHtml(b.desc)}</span>
      </div>`;
    }).join("");
    const count = document.getElementById("badgesCount");
    if (count) count.textContent = `${unlocked} / ${BADGES.length}`;
  }

  /* ---------- מצב הדגמה (נתונים לדוגמה) ---------- */
  function buildDemoData() {
    const exp = BUILTIN.expense, inc = BUILTIN.income, kid = APP.preset === "kids";
    const now = new Date();
    const MONTHS = 6; // היסטוריה מלאה כדי שגרף 6 החודשים יהיה מלא
    const months = [];
    for (let i = MONTHS - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
    const cur = months[months.length - 1];
    const daysIn = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m, 0).getDate(); };
    const money = (a, b) => Math.round(a + Math.random() * (b - a));
    const day = (ym, d) => `${ym}-${String(Math.min(Math.max(1, d), daysIn(ym), 28)).padStart(2, "0")}`;
    const mk = (ym, type, cat, amount, desc, d) => ({ id: uid(), type, amount, category: cat, description: desc || "", date: day(ym, d) });
    const descs = kid
      ? ["בקיוסק", "עם חברים", "בקניון", "מתנה לחבר", "בקנטינה", ""]
      : ["קניות שבועיות", "דלק", "מנוי חודשי", "ארוחה בחוץ", "חשבון חשמל", "תרופות", ""];
    const tx = [];
    const isCur = (ym) => ym === cur;
    const curDay = now.getDate();
    months.forEach((ym) => {
      const dim = daysIn(ym);
      const maxDay = isCur(ym) ? Math.max(3, curDay) : dim; // בחודש הנוכחי לא ליצור תאריכים עתידיים
      // הכנסות
      const incomes = [mk(ym, "income", inc[0].id, kid ? money(90, 140) : money(7000, 8500), "", 2)];
      if (inc[1]) incomes.push(mk(ym, "income", inc[1].id, kid ? money(30, 80) : money(400, 1400), "", Math.min(12, maxDay)));
      incomes.forEach((t) => tx.push(t));
      const incomeTotal = incomes.reduce((s, t) => s + t.amount, 0);
      // סך ההוצאות = חלק מההכנסה => מאזן חיובי תמיד. חודש נוכחי חלקי => פחות הוצאות.
      const factor = isCur(ym) ? 0.5 : 0.65;
      const target = incomeTotal * factor;
      const n = kid ? Math.min(exp.length, 6) : Math.min(exp.length, 8);
      const weights = Array.from({ length: n }, () => 0.6 + Math.random() * 0.8);
      const wsum = weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < n; i++) {
        const c = exp[i % exp.length];
        const amt = Math.max(kid ? 3 : 15, Math.round(target * weights[i] / wsum));
        tx.push(mk(ym, "expense", c.id, amt, descs[i % descs.length], 2 + Math.floor(Math.random() * Math.max(1, maxDay - 2))));
      }
    });
    const budgets = {};
    months.slice(-3).forEach((ym) => budgets[ym] = kid ? 200 : 8000); // תקציב ל-3 החודשים האחרונים
    const catBudgets = {};
    catBudgets[exp[0].id] = kid ? 70 : 1600;
    if (exp[1]) catBudgets[exp[1].id] = kid ? 50 : 700;
    if (exp[2]) catBudgets[exp[2].id] = kid ? 40 : 900;
    const goals = kid
      ? [{ id: uid(), name: "אופניים חדשים", target: 600, saved: 380, emoji: "🚲" }, { id: uid(), name: "משחק מחשב", target: 150, saved: 150, emoji: "🎮" }, { id: uid(), name: "טלפון חדש", target: 1200, saved: 240, emoji: "📱" }]
      : [{ id: uid(), name: "חופשה בחו\"ל", target: 8000, saved: 5200, emoji: "✈️" }, { id: uid(), name: "מחשב נייד", target: 4500, saved: 4500, emoji: "💻" }, { id: uid(), name: "קרן חירום", target: 15000, saved: 6800, emoji: "🛟" }];
    // תנועה קבועה (מסומנת כבר-הוחלה לחודשים הקיימים כדי לא לשכפל)
    const recId = uid();
    const recurring = [{ id: recId, type: "income", amount: kid ? money(60, 100) : money(6500, 8200), category: inc[0].id, description: kid ? "דמי כיס חודשיים" : "משכורת", day: 2, createdMonth: months[0] }];
    const recApplied = {}; months.forEach((ym) => recApplied[`${recId}:${ym}`] = true);
    return { transactions: tx, budgets, goals, recurring, recApplied, catBudgets };
  }

  function enterDemo() {
    if (isDemo()) return;
    // גיבוי הנתונים האמיתיים
    const backup = { transactions, budgets, goals, recurring, recApplied, customCats, catBudgets };
    localStorage.setItem(K.demoBackup, JSON.stringify(backup));
    const d = buildDemoData();
    transactions = d.transactions; budgets = d.budgets; goals = d.goals; recurring = d.recurring; recApplied = d.recApplied; catBudgets = d.catBudgets;
    localStorage.setItem(K.demoActive, "1");
    save();
    currentMonth = ymNow(); el.monthSelect.value = currentMonth;
    updateDemoBanner(); renderAll();
    toast("נטענו נתוני הדגמה 🎬");
  }
  function exitDemo() {
    let backup = null;
    try { backup = JSON.parse(localStorage.getItem(K.demoBackup)); } catch { backup = null; }
    backup = backup || { transactions: [], budgets: {}, goals: [], recurring: [], recApplied: {}, customCats: { expense: [], income: [] }, catBudgets: {} };
    transactions = backup.transactions || []; budgets = backup.budgets || {}; goals = backup.goals || [];
    recurring = backup.recurring || []; recApplied = backup.recApplied || {};
    customCats = backup.customCats || { expense: [], income: [] }; catBudgets = backup.catBudgets || {};
    localStorage.removeItem(K.demoActive); localStorage.removeItem(K.demoBackup);
    save();
    updateDemoBanner(); renderAll();
    toast("יצאת ממצב הדגמה — הנתונים שלך שוחזרו");
  }
  const isDemo = () => localStorage.getItem(K.demoActive) === "1";
  function updateDemoBanner() {
    const banner = document.getElementById("demoBanner");
    if (banner) banner.hidden = !isDemo();
    if (el.demoBtn) el.demoBtn.style.display = (APP.hideDemo || isDemo()) ? "none" : "";
  }
  if (el.demoBtn) el.demoBtn.addEventListener("click", () => {
    if (transactions.length || goals.length || recurring.length) {
      if (!confirm("לטעון נתוני הדגמה? הנתונים הנוכחיים שלך יישמרו בצד ויוחזרו כשתצא ממצב הדגמה.")) return;
    }
    enterDemo();
  });
  const exitBtn = document.getElementById("exitDemo");
  if (exitBtn) exitBtn.addEventListener("click", exitDemo);

  /* ---------- סיכום חודשי (תצוגה נקייה) ---------- */
  function openSummary() {
    const ym = currentMonth;
    const txs = transactions.filter((t) => ymOf(t.date) === ym);
    const income = sum(txs.filter((t) => t.type === "income"));
    const expense = sum(txs.filter((t) => t.type === "expense"));
    const usingBudgetS = income <= 0 && budgets[ym] > 0;
    const availableS = usingBudgetS ? budgets[ym] : income;
    const bal = availableS - expense;
    el.summaryTitle.textContent = "סיכום — " + monthLabel(ym);

    if (!txs.length) {
      el.summaryBody.innerHTML = `<p class="sum-empty">אין תנועות בחודש זה. בחר חודש אחר או הוסף תנועות.</p>`;
      translateDom(el.summaryModal); el.summaryModal.hidden = false; return;
    }
    const byCat = {};
    txs.filter((t) => t.type === "expense").forEach((t) => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const budget = budgets[ym];
    const saveRate = availableS > 0 ? Math.round(bal / availableS * 100) : 0;

    let html = `<div class="sum-stats">
      <div class="sum-stat inc"><span class="l">הכנסות</span><span class="v">${fmt(income)}</span></div>
      <div class="sum-stat exp"><span class="l">הוצאות</span><span class="v">${fmt(expense)}</span></div>
      <div class="sum-stat bal"><span class="l">מאזן</span><span class="v ${bal < 0 ? "neg" : "pos"}">${fmt(bal)}</span></div>
    </div>`;

    if (budget > 0) {
      const pct = Math.round(expense / budget * 100);
      html += `<div class="sum-budget">🎯 תקציב: <b>${fmt(budget)}</b> · נוצל <b>${pct}%</b> · ${expense > budget ? `⚠️ חריגה של ${fmt(expense - budget)}` : `נותרו ${fmt(budget - expense)}`}</div>`;
    }

    if (top.length) {
      html += `<div class="sum-h">💸 ההוצאות הגדולות</div><div class="sum-cats">`;
      top.forEach(([id, val]) => {
        const c = catById(id), pct = Math.round(val / expense * 100);
        html += `<div class="sum-cat">
          <span class="sum-cat-ico" style="background:${c.color}22">${c.icon}</span>
          <span class="sum-cat-name">${c.name}</span>
          <span class="sum-cat-bar"><i style="width:${pct}%;background:${c.color}"></i></span>
          <span class="sum-cat-val">${fmt(val)} · ${pct}%</span>
        </div>`;
      });
      html += `</div>`;
    }

    html += `<p class="sum-note">${txs.length} תנועות החודש · ${bal >= 0 ? `חסכת ${saveRate}% מההכנסות 🌱` : "החודש ההוצאות עלו על ההכנסות"}</p>`;
    el.summaryBody.innerHTML = html;
    translateDom(el.summaryModal);
    el.summaryModal.hidden = false;
  }
  function closeSummary() { el.summaryModal.hidden = true; }
  if (el.summaryBtn) el.summaryBtn.addEventListener("click", openSummary);
  if (el.summaryClose) el.summaryClose.addEventListener("click", closeSummary);
  if (el.summaryModal) el.summaryModal.addEventListener("click", (e) => { if (e.target === el.summaryModal) closeSummary(); });

  /* ---------- סקירת חודש + טבלאות ---------- */
  function categoryBreakdownHTML(ym) {
    const exp = transactions.filter((t) => t.type === "expense" && ymOf(t.date) === ym);
    const total = sum(exp);
    if (!total) return `<p class="tbl-empty">אין הוצאות בחודש זה</p>`;
    const byCat = {}; exp.forEach((t) => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
    const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([id, v]) => {
      const c = catById(id), pct = Math.round(v / total * 100);
      return `<tr><td><span class="tc-ico" style="background:${c.color}22">${c.icon}</span>${c.name}</td><td class="tc-num">${fmt(v)}</td><td class="tc-num">${pct}%</td></tr>`;
    }).join("");
    return `<table class="data-table"><thead><tr><th>קטגוריה</th><th>סכום</th><th>אחוז</th></tr></thead><tbody>${rows}<tr class="tbl-total"><td>סה"כ</td><td class="tc-num">${fmt(total)}</td><td class="tc-num">100%</td></tr></tbody></table>`;
  }
  function monthTxTableHTML(ym) {
    const txs = transactions.filter((t) => ymOf(t.date) === ym).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    if (!txs.length) return `<p class="tbl-empty">אין תנועות בחודש זה</p>`;
    const rows = txs.map((t) => {
      const c = catById(t.category), sign = t.type === "income" ? "+" : "−";
      return `<tr><td>${t.date.split("-").reverse().join("/")}</td><td><span class="tc-ico" style="background:${c.color}22">${c.icon}</span>${c.name}</td><td class="tc-desc">${escapeHtml(t.description || "")}</td><td class="tc-num ${t.type}">${sign}${fmt(t.amount).replace("₪", "")}₪</td></tr>`;
    }).join("");
    return `<table class="data-table"><thead><tr><th>תאריך</th><th>קטגוריה</th><th>תיאור</th><th>סכום</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function renderReview() {
    if (!el.reviewPanel) return;
    el.reviewPanel.innerHTML =
      `<h3 class="review-h">פירוט לפי קטגוריה — ${monthLabel(currentMonth)}</h3>${categoryBreakdownHTML(currentMonth)}` +
      `<h3 class="review-h">כל התנועות</h3>${monthTxTableHTML(currentMonth)}`;
    translateDom(el.reviewPanel);
  }
  // גרף עמודות אנכי לפי קטגוריה (גדול וברור)
  function categoryColumnChart(ym) {
    const exp = transactions.filter((t) => t.type === "expense" && ymOf(t.date) === ym);
    const total = sum(exp);
    if (!total) return `<p class="tbl-empty">אין הוצאות בחודש זה</p>`;
    const byCat = {}; exp.forEach((t) => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const max = entries[0][1];
    const cols = entries.map(([id, v]) => {
      const c = catById(id), pct = Math.round(v / total * 100), h = Math.max(6, Math.round(v / max * 100));
      return `<div class="col-item">
        <div class="col-val">${fmt(v)}</div>
        <div class="col-bar-area"><div class="col-bar" style="height:${h}%;background:${c.color}"><span class="col-pct">${pct}%</span></div></div>
        <div class="col-ico" style="background:${c.color}22">${c.icon}</div>
        <div class="col-name">${c.name}</div>
      </div>`;
    }).join("");
    return `<div class="col-chart">${cols}</div><div class="col-total">סה"כ: <b>${fmt(total)}</b></div>`;
  }
  function renderCatTableCard() {
    if (!el.catTableBody) return;
    el.catTableBody.innerHTML = categoryColumnChart(currentMonth);
    translateDom(el.catTableCard);
  }
  // הגדלה למסך מלא
  function openChartFull() {
    if (!el.chartModalBody) return;
    el.chartModalBody.innerHTML = categoryColumnChart(currentMonth);
    translateDom(el.chartModal);
    el.chartModal.hidden = false;
  }
  function closeChartFull() { if (el.chartModal) el.chartModal.hidden = true; }
  if (el.chartExpand) el.chartExpand.addEventListener("click", openChartFull);
  if (el.chartClose) el.chartClose.addEventListener("click", closeChartFull);
  if (el.chartModal) el.chartModal.addEventListener("click", (e) => { if (e.target === el.chartModal) closeChartFull(); });
  el.cardTabs.forEach((tab) => tab.addEventListener("click", () => {
    const view = tab.dataset.view;
    el.cardTabs.forEach((t) => t.classList.toggle("active", t === tab));
    if (el.addView) el.addView.hidden = view !== "add";
    if (el.monthlyView) el.monthlyView.hidden = view !== "monthly";
    if (el.reviewView) el.reviewView.hidden = view !== "review";
    if (view === "review") renderReview();
    if (view === "monthly") renderMonthlyPanel();
  }));

  /* ---------- סכום חודשי לפי נושא ---------- */
  const monthlyId = (cat, ym) => `m_${cat}_${ym}`;
  function renderMonthlyPanel() {
    if (!el.monthlyGrid) return;
    const ym = currentMonth;
    el.monthlyGrid.innerHTML = catsOf("expense").map((c) => {
      const tx = transactions.find((t) => t.id === monthlyId(c.id, ym));
      const val = tx ? tx.amount : "";
      return `<div class="monthly-row">
        <span class="m-ico" style="background:${c.color}22">${c.icon}</span>
        <span class="m-name">${c.name}</span>
        <input type="number" min="0" step="1" inputmode="decimal" data-cat="${c.id}" value="${val}" placeholder="0" />
      </div>`;
    }).join("");
    translateDom(el.monthlyView);
  }
  function saveMonthly() {
    const ym = currentMonth;
    el.monthlyGrid.querySelectorAll("input[data-cat]").forEach((inp) => {
      const cat = inp.dataset.cat, id = monthlyId(cat, ym), val = parseFloat(inp.value);
      const idx = transactions.findIndex((t) => t.id === id);
      if (val > 0) {
        const rounded = Math.round(val * 100) / 100;
        if (idx >= 0) transactions[idx].amount = rounded;
        else transactions.push({ id, type: "expense", amount: rounded, category: cat, description: "סכום חודשי", date: `${ym}-15`, monthly: true });
      } else if (idx >= 0) {
        transactions.splice(idx, 1);
      }
    });
    save();
    renderAll();
    toast("הסכומים נשמרו ✅");
  }
  if (el.monthlySave) el.monthlySave.addEventListener("click", saveMonthly);

  /* ---------- מצב טבלת תקציב (רוסית/אנגלית) ---------- */
  const catSpent = (cat, ym) => sum(transactions.filter((t) => t.type === "expense" && t.category === cat && ymOf(t.date) === ym));
  function setCatSpent(cat, value) {
    const ym = currentMonth;
    transactions = transactions.filter((t) => !(t.type === "expense" && t.category === cat && ymOf(t.date) === ym));
    if (value > 0) transactions.push({ id: monthlyId(cat, ym), type: "expense", amount: round2(value), category: cat, description: "סכום חודשי", date: `${ym}-15`, monthly: true });
    save();
  }
  function addCatSpent(cat, amt) {
    transactions.push({ id: uid(), type: "expense", amount: round2(amt), category: cat, description: "הוצאה", date: `${currentMonth}-15` });
    save();
  }
  function renderBudgetTable() {
    if ((!APP.tableOnly && !APP.showTable) || !el.budgetTableBody) return;
    const ym = currentMonth;
    if (el.btMonthlyBudget && document.activeElement !== el.btMonthlyBudget) el.btMonthlyBudget.value = budgets[ym] || "";
    const cats = catsOf("expense");
    el.budgetTableBody.innerHTML = cats.map((c) => {
      const planned = catBudgets[c.id] || 0, spent = catSpent(c.id, ym), remaining = planned - spent;
      return `<tr>
        <td class="bt-cat"><button type="button" class="bt-cat-btn" data-cat="${c.id}" title="הצג את כל ההוצאות בקטגוריה"><span class="bt-ico" style="background:${c.color}22">${c.icon}</span><span class="bt-cat-name">${c.name}</span><span class="bt-cat-hint">👁️</span></button><button class="bt-del" data-delcat="${c.id}" title="מחק קטגוריה">🗑️</button></td>
        <td><input type="number" class="bt-plan" data-cat="${c.id}" value="${planned || ""}" placeholder="0" min="0" /></td>
        <td><button type="button" class="bt-spent-btn" data-cat="${c.id}">${spent ? fmt(spent) : "0"} <span class="bt-spent-plus">＋</span></button></td>
        <td class="bt-remain ${remaining < 0 ? "neg" : "pos"}">${fmt(remaining)}</td>
      </tr>`;
    }).join("");
    const totalPlanned = cats.reduce((s, c) => s + (catBudgets[c.id] || 0), 0);
    const totalSpent = sum(transactions.filter((t) => t.type === "expense" && ymOf(t.date) === ym));
    const planRemain = totalPlanned - totalSpent;
    el.budgetTableFoot.innerHTML = `<tr><td class="bt-cat">סה"כ</td><td class="bt-remain">${fmt(totalPlanned)}</td><td class="bt-remain">${fmt(totalSpent)}</td><td class="bt-remain ${planRemain < 0 ? "neg" : "pos"}">${fmt(planRemain)}</td></tr>`;
    const budget = budgets[ym] || 0, endRemain = budget - totalSpent;
    el.btSummary.innerHTML =
      `<div class="bt-sum-item"><span class="l">תקציב חודשי כולל</span><span class="v">${fmt(budget)}</span></div>` +
      `<div class="bt-sum-item"><span class="l">סה"כ הוצאות</span><span class="v">${fmt(totalSpent)}</span></div>` +
      `<div class="bt-sum-item remain"><span class="l">נשאר החודש</span><span class="v ${endRemain < 0 ? "neg" : "pos"}">${fmt(endRemain)}</span></div>`;
    el.budgetTableBody.querySelectorAll(".bt-plan").forEach((inp) => inp.addEventListener("change", () => { const v = parseFloat(inp.value); if (v > 0) catBudgets[inp.dataset.cat] = Math.round(v); else delete catBudgets[inp.dataset.cat]; save(); renderBudgetTable(); }));
    el.budgetTableBody.querySelectorAll(".bt-spent-btn, .bt-cat-btn").forEach((b) => b.addEventListener("click", () => openCatTx(b.dataset.cat)));
    el.budgetTableBody.querySelectorAll("[data-delcat]").forEach((b) => b.addEventListener("click", () => deleteCat(b.dataset.delcat)));
    translateDom(document.getElementById("budgetTableCard"));
  }
  if (el.btMonthlyBudget) el.btMonthlyBudget.addEventListener("change", () => { const v = parseFloat(el.btMonthlyBudget.value); if (v > 0) budgets[currentMonth] = Math.round(v); else delete budgets[currentMonth]; save(); renderBudgetTable(); });
  if (el.btAddCat) el.btAddCat.addEventListener("click", () => openCatModal());

  /* ---------- בחירת שיטת מעקב (טבלה / תנועות) ---------- */
  document.querySelectorAll(".method-btn").forEach((btn) => btn.addEventListener("click", () => {
    const m = btn.dataset.method;
    document.body.classList.toggle("method-table", m === "table");
    document.body.classList.toggle("method-tx", m === "tx");
    document.querySelectorAll(".method-btn").forEach((b) => b.classList.toggle("active", b === btn));
    localStorage.setItem(K.method, m);
    renderAll();
  }));

  /* ---------- השוואה לחודש קודם + היסטוריית חודשים (אקסל) ---------- */
  function monthTotals(ym) {
    const txs = transactions.filter((t) => ymOf(t.date) === ym);
    const income = sum(txs.filter((t) => t.type === "income"));
    const expense = sum(txs.filter((t) => t.type === "expense"));
    const budget = budgets[ym] || 0;
    const available = income > 0 ? income : budget;
    return { ym, income, expense, budget, left: available - expense, count: txs.length };
  }
  function renderCompare() {
    if (!el.btCompare) return;
    const cur = monthTotals(currentMonth), prev = monthTotals(prevMonthOf(currentMonth));
    if (!prev.expense && !prev.income) { el.btCompare.innerHTML = ""; return; }
    const diff = cur.expense - prev.expense;
    const pct = prev.expense > 0 ? Math.round(Math.abs(diff) / prev.expense * 100) : 0;
    const up = diff > 0;
    el.btCompare.innerHTML =
      `<div class="cmp-item"><span class="cmp-ico">${up ? "📈" : "📉"}</span><span class="cmp-body"><span class="cmp-l">לעומת החודש הקודם</span><span class="cmp-v ${up ? "up" : "down"}">${up ? "+" : "−"}${fmt(Math.abs(diff))} (${pct}%)</span></span></div>` +
      `<div class="cmp-item"><span class="cmp-ico">🗓️</span><span class="cmp-body"><span class="cmp-l">${monthLabel(prev.ym)}</span><span class="cmp-v">${fmt(prev.expense)}</span></span></div>` +
      `<div class="cmp-item"><span class="cmp-ico">💰</span><span class="cmp-body"><span class="cmp-l">נשאר בחודש הקודם</span><span class="cmp-v ${prev.left < 0 ? "up" : "down"}">${fmt(prev.left)}</span></span></div>`;
    translateDom(el.btCompare);
  }
  function renderHistory() {
    if (!el.historyBody) return;
    const months = [...new Set(transactions.map((t) => ymOf(t.date)).concat(Object.keys(budgets)))].filter(Boolean).sort();
    if (!months.includes(ymNow())) months.push(ymNow());
    months.sort();
    if (!months.length) { el.historyBody.innerHTML = `<p class="tbl-empty">אין נתונים עדיין</p>`; return; }
    const rows = months.slice().reverse().map((ym) => {
      const t = monthTotals(ym);
      const prev = monthTotals(prevMonthOf(ym));
      const d = prev.expense > 0 ? Math.round((t.expense - prev.expense) / prev.expense * 100) : null;
      const dTxt = d === null ? "—" : `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)}%`;
      return `<tr class="${ym === ymNow() ? "is-current" : ""}">
        <td class="h-month">${monthLabel(ym)}</td>
        <td>${fmt(t.budget)}</td>
        <td>${fmt(t.income)}</td>
        <td>${fmt(t.expense)}</td>
        <td class="${t.left < 0 ? "h-neg" : "h-pos"}">${fmt(t.left)}</td>
        <td class="${d > 0 ? "h-neg" : d < 0 ? "h-pos" : ""}">${dTxt}</td>
      </tr>`;
    }).join("");
    const tot = months.reduce((a, ym) => { const t = monthTotals(ym); a.income += t.income; a.expense += t.expense; a.left += t.left; return a; }, { income: 0, expense: 0, left: 0 });
    el.historyBody.innerHTML = `<table class="history-table">
      <thead><tr><th>חודש</th><th>תקציב</th><th>הכנסות</th><th>הוצאות</th><th>נשאר</th><th>שינוי</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td class="h-month">סה"כ</td><td>—</td><td>${fmt(tot.income)}</td><td>${fmt(tot.expense)}</td><td class="${tot.left < 0 ? "h-neg" : "h-pos"}">${fmt(tot.left)}</td><td>—</td></tr></tfoot>
    </table>`;
    translateDom(document.getElementById("historyCard"));
  }

  /* ---------- מעבר אוטומטי לחודש חדש ---------- */
  let lastSeenMonth = ymNow();
  function checkMonthRollover() {
    const now = ymNow();
    if (now === lastSeenMonth) return;
    const wasOnPrev = currentMonth === lastSeenMonth;
    lastSeenMonth = now;
    if (wasOnPrev) { // המשתמש צפה בחודש שהסתיים — מעבירים אותו לחודש החדש
      currentMonth = now;
      if (el.monthSelect) el.monthSelect.value = now;
      applyRecurring();
      renderAll();
      toast(`עברנו לחודש חדש — ${monthLabel(now)} 🗓️`);
    }
  }
  setInterval(checkMonthRollover, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkMonthRollover(); });

  /* ---------- ניווט בין דפים (מעקב / תכנון) ---------- */
  document.querySelectorAll(".page-tab").forEach((tab) => tab.addEventListener("click", () => {
    document.querySelectorAll(".page-tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.body.dataset.page = tab.dataset.page;
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));

  /* ---------- חלון תנועות של קטגוריה (הוספה עם תיאור + צפייה בכל התנועות) ---------- */
  let catTxCat = null;
  function openCatTx(cat) {
    if (!el.catTxModal) return;
    catTxCat = cat;
    const c = catById(cat);
    el.catTxTitle.textContent = `${c.icon} ${c.name}`;
    el.catTxAmount.value = ""; el.catTxDesc.value = "";
    if (el.catTxDate) { el.catTxDate.value = defaultDateForMonth(); setupDateField(); }
    renderCatTxList();
    el.catTxModal.hidden = false; el.catTxAmount.focus();
  }
  function renderCatTxList() {
    const ym = currentMonth;
    const txs = transactions.filter((t) => t.type === "expense" && t.category === catTxCat && ymOf(t.date) === ym).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    if (!txs.length) el.catTxList.innerHTML = `<p class="tbl-empty">אין תנועות בקטגוריה זו</p>`;
    else {
      const rows = txs.map((t) => {
        const [, mo, da] = t.date.split("-");
        return `<tr>
          <td class="ct-topic">${escapeHtml(t.description || "—")}</td>
          <td class="ct-amt">${fmt(t.amount)}</td>
          <td class="ct-when">${+da}/${+mo}</td>
          <td class="ct-act"><button class="cattx-del" data-del="${t.id}" title="מחק">🗑️</button></td>
        </tr>`;
      }).join("");
      el.catTxList.innerHTML = `<table class="cattx-table">
        <thead><tr><th>נושא</th><th>כמה</th><th>מתי</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>סה"כ</td><td class="ct-amt">${fmt(sum(txs))}</td><td colspan="2"></td></tr></tfoot>
      </table>`;
    }
    el.catTxList.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { transactions = transactions.filter((t) => t.id !== b.dataset.del); save(); renderCatTxList(); renderAll(); }));
    translateDom(el.catTxModal);
  }
  function closeCatTx() { toggleCalendar(false); if (el.catTxModal) el.catTxModal.hidden = true; catTxCat = null; renderAll(); }
  function defaultDateForMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    const dim = new Date(y, m, 0).getDate();
    const d = currentMonth === ymNow() ? Math.min(new Date().getDate(), dim) : Math.min(15, dim);
    return `${currentMonth}-${String(d).padStart(2, "0")}`;
  }
  // מגביל את בורר התאריך לחודש המוצג, ומציג את יום השבוע
  const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  function setupDateField() {
    if (!el.catTxDate) return;
    updateWeekday();
    toggleCalendar(false);
    // כפתורי הבחירה המהירה — מסתירים אפשרויות שלא שייכות לחודש המוצג
    const isCur = currentMonth === ymNow();
    const yst = new Date(); yst.setDate(yst.getDate() - 1);
    const ystYm = `${yst.getFullYear()}-${String(yst.getMonth() + 1).padStart(2, "0")}`;
    const q = document.getElementById("catTxQuick");
    if (q) {
      q.querySelector('[data-quick="today"]').hidden = !isCur;
      q.querySelector('[data-quick="yesterday"]').hidden = ystYm !== currentMonth;
    }
  }
  function updateWeekday() {
    const w = document.getElementById("catTxWeekday");
    if (!w || !el.catTxDate) return;
    const v = el.catTxDate.value;
    if (!v) { w.textContent = ""; return; }
    const [yy, mm, dd] = v.split("-").map(Number);
    w.textContent = tr("יום ") + tr(WEEKDAYS[new Date(yy, mm - 1, dd).getDay()]);
    const btn = document.getElementById("catTxDateBtn");
    if (btn) btn.innerHTML = `<span class="dd-ico">📅</span>${dd}/${mm}/${yy}`;
    renderCalendar();
  }

  /* ---------- לוח שנה מובנה (לא של הדפדפן — כדי לשלוט בגודל ובשפה) ---------- */
  const WEEK_SHORT = {
    he: ["א", "ב", "ג", "ד", "ה", "ו", "ש"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  };
  const weekStart = () => (APP.lang === "ru" ? 1 : 0); // ברוסית השבוע מתחיל בשני
  function renderCalendar() {
    const head = document.getElementById("catTxCalHead");
    const week = document.getElementById("catTxCalWeek");
    const grid = document.getElementById("catTxCalGrid");
    if (!head || !week || !grid) return;
    const names = WEEK_SHORT[APP.lang] || WEEK_SHORT.he;
    const ws = weekStart();
    head.textContent = tr(monthLabel(currentMonth));
    week.innerHTML = Array.from({ length: 7 }, (_, i) => `<span>${names[(ws + i) % 7]}</span>`).join("");
    const [y, m] = currentMonth.split("-").map(Number);
    const dim = new Date(y, m, 0).getDate();
    const firstDow = new Date(y, m - 1, 1).getDay();
    const blanks = (firstDow - ws + 7) % 7;
    const sel = (el.catTxDate && el.catTxDate.value) ? +el.catTxDate.value.split("-")[2] : -1;
    const todayStrNow = todayStr();
    let html = "";
    for (let i = 0; i < blanks; i++) html += `<span class="cal-blank"></span>`;
    for (let d = 1; d <= dim; d++) {
      const iso = `${currentMonth}-${String(d).padStart(2, "0")}`;
      const cls = ["cal-day"];
      if (d === sel) cls.push("is-selected");
      if (iso === todayStrNow) cls.push("is-today");
      html += `<button type="button" class="${cls.join(" ")}" data-day="${d}">${d}</button>`;
    }
    grid.innerHTML = html;
  }
  function toggleCalendar(show) {
    const pop = document.getElementById("catTxCal");
    if (!pop) return;
    pop.hidden = show === undefined ? !pop.hidden : !show;
    if (!pop.hidden) renderCalendar();
  }
  const dateBtn = document.getElementById("catTxDateBtn");
  if (dateBtn) dateBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleCalendar(); });
  const calPop = document.getElementById("catTxCal");
  if (calPop) calPop.addEventListener("click", (e) => {
    e.stopPropagation();
    const b = e.target.closest("[data-day]");
    if (!b || !el.catTxDate) return;
    el.catTxDate.value = `${currentMonth}-${String(b.dataset.day).padStart(2, "0")}`;
    updateWeekday();
    toggleCalendar(false);
  });
  document.addEventListener("click", () => toggleCalendar(false));
  const quickWrap = document.getElementById("catTxQuick");
  if (quickWrap) quickWrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-quick]");
    if (!b || !el.catTxDate) return;
    const [y, m] = currentMonth.split("-").map(Number);
    const dim = new Date(y, m, 0).getDate();
    let day;
    if (b.dataset.quick === "today") day = Math.min(new Date().getDate(), dim);
    else if (b.dataset.quick === "yesterday") { const d = new Date(); d.setDate(d.getDate() - 1); day = d.getDate(); }
    else day = 1;
    el.catTxDate.value = `${currentMonth}-${String(day).padStart(2, "0")}`;
    updateWeekday();
  });
  function addCatTx() {
    const a = parseFloat(el.catTxAmount.value);
    if (!(a > 0)) { toast("נא להזין סכום חוקי"); return; }
    let date = (el.catTxDate && el.catTxDate.value) || defaultDateForMonth();
    if (ymOf(date) !== currentMonth) date = defaultDateForMonth(); // שומר על החודש הנבחר
    transactions.push({ id: uid(), type: "expense", amount: round2(a), category: catTxCat, description: el.catTxDesc.value.trim(), date });
    save();
    el.catTxAmount.value = ""; el.catTxDesc.value = "";
    if (el.catTxDate) { el.catTxDate.value = defaultDateForMonth(); setupDateField(); }
    renderCatTxList(); renderAll(); el.catTxAmount.focus();
    toast("התנועה נוספה ✅");
  }
  if (el.catTxAdd) el.catTxAdd.addEventListener("click", addCatTx);
  if (el.catTxClose) el.catTxClose.addEventListener("click", closeCatTx);
  if (el.catTxExport) el.catTxExport.addEventListener("click", () => {
    const c = catById(catTxCat);
    const txs = transactions.filter((t) => t.type === "expense" && t.category === catTxCat && ymOf(t.date) === currentMonth).sort((a, b) => a.date.localeCompare(b.date));
    if (!txs.length) { toast("אין תנועות לייצוא"); return; }
    const rows = [[tr("תאריך"), tr("קטגוריה"), tr("תיאור"), tr("סכום")]];
    txs.forEach((t) => rows.push([t.date, tr(c.name), t.description || "", t.amount]));
    rows.push([tr('סה"כ'), "", "", sum(txs)]);
    downloadFile("﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n"), `${c.id}-${currentMonth}.csv`, "text/csv");
    toast("הנתונים יוצאו לקובץ CSV");
  });
  if (el.catTxModal) el.catTxModal.addEventListener("click", (e) => { if (e.target === el.catTxModal) closeCatTx(); });

  /* ---------- רינדור כללי ---------- */
  function renderAll() {
    renderSummary(); renderInsights(); renderList(); renderCharts(); renderGoals(); renderRecurring(); renderCatBudgets(); renderBadges();
    renderCatTableCard(); renderBudgetTable(); renderCompare(); renderHistory();
    if (el.reviewView && !el.reviewView.hidden) renderReview();
    if (el.monthlyView && !el.monthlyView.hidden) renderMonthlyPanel();
    translateDom(document.body);
  }

  /* ---------- גרסת הדגמה נעולה (לשליחה ללקוח) ---------- */
  function lockDemo() {
    // מזרימים נתוני דוגמה אם ריק
    if (!transactions.length) {
      const d = buildDemoData();
      transactions = d.transactions; budgets = d.budgets; goals = d.goals; recurring = d.recurring; recApplied = d.recApplied; catBudgets = d.catBudgets;
      save();
    }
    document.body.classList.add("demo-locked");
    // סימן מים
    const wm = document.createElement("div");
    wm.className = "demo-watermark"; wm.setAttribute("aria-hidden", "true"); wm.textContent = "גרסת הדגמה";
    document.body.appendChild(wm);
    // באנר רכישה עליון
    const bb = document.createElement("div");
    bb.className = "buy-banner";
    const c = APP.contact;
    const contactHtml = (c && c.includes("@"))
      ? `<a class="buy-contact" href="mailto:${escapeHtml(c)}">📩 ${escapeHtml(c)}</a>`
      : `<b class="buy-contact">${escapeHtml(c || "צרו קשר לרכישה 📩")}</b>`;
    bb.innerHTML = `<span>✨ זוהי <b>גרסת הדגמה</b> — רוצים גרסה מלאה, ממותגת אישית עבורכם?</span>${contactHtml}`;
    const main = document.querySelector("main.container");
    if (main) main.insertBefore(bb, main.firstChild);
    // מבטלים חילוץ נתונים ופעולות הרסניות
    ["exportJson", "exportCsv", "printReport", "importBtn", "clearAll", "demoBtn"].forEach((id) => { const e = document.getElementById(id); if (e) e.style.display = "none"; });
    const dataCard = document.querySelector(".data-card");
    if (dataCard) dataCard.hidden = true;
  }

  /* ---------- אתחול ---------- */
  function init() {
    applyBranding();
    initTheme();
    el.date.value = todayStr();
    el.monthSelect.value = currentMonth;
    fillCatSelect(el.category, currentType);
    fillCatSelect(el.editCategory, editType);
    // ריפוי-עצמי: אם מצב הדגמה פעיל אך הנתונים ריקים — טוענים מחדש
    if (!APP.demoLock && isDemo() && !transactions.length) {
      const d = buildDemoData();
      transactions = d.transactions; budgets = d.budgets; goals = d.goals; recurring = d.recurring; recApplied = d.recApplied; catBudgets = d.catBudgets;
      save();
    }
    if (APP.demoLock) lockDemo(); else updateDemoBanner();
    const added = APP.demoLock ? 0 : applyRecurring();
    renderAll();
    if (added > 0) toast(`נוספו ${added} תנועות קבועות לחודש זה 🔁`);
  }
  init();
})();
