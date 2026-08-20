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
        titles = {'ru': '%s — учёт доходов и расходов', 'en': '%s — income & expense tracker'}
        if config['lang'] in titles:
            title = titles[config['lang']] % config.get('name', '')
            html = html.replace('<title>ניהול תקציב — מעקב הוצאות והכנסות</title>', '<title>%s</title>' % title)
    if os.path.dirname(out_path):
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, 'w', encoding='utf-8').write(html)
    injected = 'BUDGET_CONFIG' in html
    line = f'  {out_path}: {len(html)} bytes  config_injected={injected if config else "n/a"}'
    print(line.encode('ascii', 'replace').decode('ascii'))

# =====================================================================
# Deployment: everything published lives in docs/ (GitHub Pages source
# = /docs). The base URL serves only a neutral placeholder, so the app
# is reachable ONLY via the unguessable token links below. Source files
# (index.html/style.css/app.js) stay in the repo root and are NOT served.
# Tokens are FIXED so the secret links stay stable across rebuilds.
# =====================================================================
CONTACT = "eithan.haletsky@gmail.com"

# --- Protected editions: unguessable token filenames (do not publish these paths) ---
build(None, 'docs/he-3f9a7k2c8d.html')  # Hebrew (generic)

build({
    "name": "הכסף שלי", "tagline": "לומדים לנהל כסף — בכיף! 🌟", "logo": "🐷",
    "accent": {"primary": "#ec4899", "primary2": "#f59e0b"},
    "preset": "kids", "kids": True, "variant": "kids", "storeKey": "budgetkids",
}, 'docs/kids-2v8z5b3k7m.html')

build({
    "name": "התקציב שלי", "tagline": "ניהול פיננסי חכם — בליווי מקצועי", "logo": "📊",
    "accent": {"primary": "#0f766e", "primary2": "#0891b2"},
    "preset": "coach", "variant": "coach", "brandedBy": "דנה כהן · מאמנת פיננסית", "storeKey": "budgetcoach",
}, 'docs/coach-9r7w4t6y1p.html')

build({
    "name": "Мой бюджет", "tagline": "Учёт доходов и расходов — просто и удобно", "logo": "💰",
    "lang": "ru", "tableOnly": True, "storeKey": "budgetru",
}, 'docs/ru-6p4n9m1x5q.html')

build({
    "name": "My Budget", "tagline": "Income & expense tracker — simple and handy", "logo": "💰",
    "lang": "en", "tableOnly": True, "storeKey": "budgeten",
}, 'docs/en-8w2q5r7t3v.html')

# --- Locked demo editions (meant for sharing with clients — predictable names OK) ---
build({
    "name": "התקציב שלי", "logo": "💰",
    "preset": "generic", "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemo",
}, 'docs/demo-generic.html')

build({
    "name": "הכסף שלי", "tagline": "לומדים לנהל כסף — בכיף! 🌟", "logo": "🐷",
    "accent": {"primary": "#ec4899", "primary2": "#f59e0b"},
    "preset": "kids", "kids": True, "variant": "kids",
    "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemokids",
}, 'docs/demo-kids.html')

build({
    "name": "התקציב שלי", "tagline": "ניהול פיננסי חכם — בליווי מקצועי", "logo": "📊",
    "accent": {"primary": "#0f766e", "primary2": "#0891b2"},
    "preset": "coach", "variant": "coach", "brandedBy": "דנה כהן · מאמנת פיננסית",
    "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemocoach",
}, 'docs/demo-coach.html')

# --- Neutral placeholder at the site root + skip Jekyll ---
import os
os.makedirs('docs', exist_ok=True)
open('docs/.nojekyll', 'w').close()
placeholder = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
               '<meta name="robots" content="noindex,nofollow">'
               '<title>Private</title><style>body{font-family:system-ui,sans-serif;'
               'display:grid;place-items:center;height:100vh;margin:0;color:#667;background:#f5f6fa}'
               '</style></head><body><p>This page is private. Access is by invitation only.</p></body></html>')
open('docs/index.html', 'w', encoding='utf-8').write(placeholder)
print('  docs/index.html: placeholder')

print('done.')
