#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""בונה גרסאות standalone ממותגות מקוד המקור (index/style/app).
   כל גרסה = אותו קוד עם window.BUDGET_CONFIG שונה שמוזרק לפני האפליקציה."""
import json, os

def build(config, out_path):
    html = open('index.html', encoding='utf-8').read()
    css = open('style.css', encoding='utf-8').read()
    js = open('app.js', encoding='utf-8').read()
    cfg_js = ''
    if config is not None:
        cfg_js = 'window.BUDGET_CONFIG = ' + json.dumps(config, ensure_ascii=False) + ';\n'
    html = html.replace('<link rel="stylesheet" href="style.css" />', '<style>\n' + css + '\n</style>')
    # prepend the config assignment inside the same script tag, before the IIFE runs
    html = html.replace('<script src="app.js"></script>', '<script>\n' + cfg_js + js + '\n</script>')
    # non-Hebrew languages: LTR + lang + translated <title> for correct initial paint / SEO
    if config and config.get('lang') and config.get('lang') != 'he':
        html = html.replace('lang="he" dir="rtl"', 'lang="%s" dir="ltr"' % config['lang'])
        if config['lang'] == 'ru':
            title = '%s — учёт доходов и расходов' % config.get('name', 'Мой бюджет')
            html = html.replace('<title>ניהול תקציב — מעקב הוצאות והכנסות</title>', '<title>%s</title>' % title)
    if os.path.dirname(out_path):
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, 'w', encoding='utf-8').write(html)
    injected = 'BUDGET_CONFIG' in html
    line = f'  {out_path}: {len(html)} bytes  config_injected={injected if config else "n/a"}'
    print(line.encode('ascii', 'replace').decode('ascii'))

# 1) Generic (current) — no config
build(None, 'standalone.html')

# 2) Kids / youth financial-education edition
build({
    "name": "הכסף שלי",
    "tagline": "לומדים לנהל כסף — בכיף! 🌟",
    "logo": "🐷",
    "accent": {"primary": "#ec4899", "primary2": "#f59e0b"},
    "preset": "kids",
    "kids": True,
    "variant": "kids",
    "storeKey": "budgetkids",
}, 'versions/kids.html')

# 3) Financial-coach white-label edition (brandedBy is the one line a coach edits)
build({
    "name": "התקציב שלי",
    "tagline": "ניהול פיננסי חכם — בליווי מקצועי",
    "logo": "📊",
    "accent": {"primary": "#0f766e", "primary2": "#0891b2"},
    "preset": "coach",
    "variant": "coach",
    "brandedBy": "דנה כהן · מאמנת פיננסית",
    "storeKey": "budgetcoach",
}, 'versions/coach.html')

# ---- גרסאות הדגמה נעולות (לשליחה ללקוח) ----
# ערוך את "contact" עם הטלפון/מייל שלך לפני שליחה.
CONTACT = "eithan.haletsky@gmail.com"

# 4) Demo — generic
build({
    "name": "התקציב שלי", "logo": "💰",
    "preset": "generic", "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemo",
}, 'versions/demo-generic.html')

# 5) Demo — kids
build({
    "name": "הכסף שלי", "tagline": "לומדים לנהל כסף — בכיף! 🌟", "logo": "🐷",
    "accent": {"primary": "#ec4899", "primary2": "#f59e0b"},
    "preset": "kids", "kids": True, "variant": "kids",
    "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemokids",
}, 'versions/demo-kids.html')

# 6) Demo — coach
build({
    "name": "התקציב שלי", "tagline": "ניהול פיננסי חכם — בליווי מקצועי", "logo": "📊",
    "accent": {"primary": "#0f766e", "primary2": "#0891b2"},
    "preset": "coach", "variant": "coach", "brandedBy": "דנה כהן · מאמנת פיננסית",
    "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemocoach",
}, 'versions/demo-coach.html')

# 7) Russian edition (no demo)
build({
    "name": "Мой бюджет",
    "tagline": "Учёт доходов и расходов — просто и удобно",
    "logo": "💰",
    "lang": "ru",
    "hideDemo": True,
    "storeKey": "budgetru",
}, 'versions/ru.html')

print('done.')
