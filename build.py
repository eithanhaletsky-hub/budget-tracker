#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""בונה גרסאות standalone ממותגות מקוד המקור (index/style/app).
   כל גרסה = אותו קוד עם window.BUDGET_CONFIG שונה שמוזרק לפני האפליקציה."""
import json, os

SW_JS = """/* BudgetHelper service worker — offline + installable (always-fresh) */
const CACHE = 'bh-v3';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isNav = e.request.mode === 'navigate';
  e.respondWith(
    fetch(e.request, isNav ? { cache: 'no-store' } : {}).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
"""

def build(config, out_path, pwa=False):
    html = open('src/index.html', encoding='utf-8').read()
    css = open('src/style.css', encoding='utf-8').read()
    js = open('src/app.js', encoding='utf-8').read()
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
    if pwa:
        base = os.path.splitext(os.path.basename(out_path))[0]
        cfg = config or {}
        name = cfg.get('name', 'התקציב שלי')
        theme = (cfg.get('accent') or {}).get('primary', '#6366f1')
        manifest = {
            "name": name, "short_name": name,
            "start_url": os.path.basename(out_path), "scope": "./",
            "display": "standalone", "background_color": "#ffffff", "theme_color": theme,
            "icons": [
                {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
                {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
            ],
        }
        os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
        open(os.path.join(os.path.dirname(out_path), base + '.webmanifest'), 'w', encoding='utf-8').write(json.dumps(manifest, ensure_ascii=False, indent=2))
        head = (
            f'<link rel="manifest" href="{base}.webmanifest" />\n'
            f'  <meta name="theme-color" content="{theme}" />\n'
            '  <meta name="apple-mobile-web-app-capable" content="yes" />\n'
            '  <meta name="apple-mobile-web-app-status-bar-style" content="default" />\n'
            '  <link rel="apple-touch-icon" href="icons/icon-192.png" />\n  <link rel="icon"'
        )
        html = html.replace('<link rel="icon"', head, 1)
        html = html.replace('</body>', "  <script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}</script>\n</body>")
    if os.path.dirname(out_path):
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, 'w', encoding='utf-8').write(html)
    injected = 'BUDGET_CONFIG' in html
    line = f'  {out_path}: {len(html)} bytes  config_injected={injected if config else "n/a"}{"  +PWA" if pwa else ""}'
    print(line.encode('ascii', 'replace').decode('ascii'))

# =====================================================================
# Deployment: sources live in src/; the published site is the repo ROOT
# (GitHub Pages source = /). The base URL serves only a neutral placeholder, so the app
# is reachable ONLY via the unguessable token links below. Source files
# (index.html/style.css/app.js) stay in the repo root and are NOT served.
# Tokens are FIXED so the secret links stay stable across rebuilds.
# =====================================================================
CONTACT = "eithan.haletsky@gmail.com"

# --- Protected editions: unguessable token filenames (installable PWAs) ---
build({"showTable": True}, 'he-7k2p9m.html', pwa=True)  # Hebrew (with tracking table)

build({
    "name": "הכסף שלי", "tagline": "לומדים לנהל כסף — בכיף! 🌟", "logo": "🐷",
    "accent": {"primary": "#ec4899", "primary2": "#f59e0b"},
    "preset": "kids", "kids": True, "variant": "kids", "storeKey": "budgetkids",
}, 'kids-2v8z5b.html', pwa=True)

build({
    "name": "התקציב שלי", "tagline": "ניהול פיננסי חכם — בליווי מקצועי", "logo": "📊",
    "accent": {"primary": "#0f766e", "primary2": "#0891b2"},
    "preset": "coach", "variant": "coach", "brandedBy": "דנה כהן · מאמנת פיננסית", "storeKey": "budgetcoach",
}, 'coach-9r7w4t.html', pwa=True)

build({
    "name": "Мой бюджет", "tagline": "Учёт доходов и расходов — просто и удобно", "logo": "💰",
    "lang": "ru", "tableOnly": True, "storeKey": "budgetru",
}, 'ru-6n1x5q.html', pwa=True)

build({
    "name": "My Budget", "tagline": "Income & expense tracker — simple and handy", "logo": "💰",
    "lang": "en", "tableOnly": True, "storeKey": "budgeten",
}, 'en-4w8r3t.html', pwa=True)

# --- Locked demo editions (meant for sharing with clients — predictable names OK) ---
build({
    "name": "התקציב שלי", "logo": "💰",
    "preset": "generic", "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemo",
}, 'demo-generic.html')

build({
    "name": "הכסף שלי", "tagline": "לומדים לנהל כסף — בכיף! 🌟", "logo": "🐷",
    "accent": {"primary": "#ec4899", "primary2": "#f59e0b"},
    "preset": "kids", "kids": True, "variant": "kids",
    "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemokids",
}, 'demo-kids.html')

build({
    "name": "התקציב שלי", "tagline": "ניהול פיננסי חכם — בליווי מקצועי", "logo": "📊",
    "accent": {"primary": "#0f766e", "primary2": "#0891b2"},
    "preset": "coach", "variant": "coach", "brandedBy": "דנה כהן · מאמנת פיננסית",
    "demoLock": True, "contact": CONTACT, "storeKey": "budgetdemocoach",
}, 'demo-coach.html')

# --- Neutral placeholder at the site root + skip Jekyll ---
import os

open('.nojekyll', 'w').close()
open('sw.js', 'w', encoding='utf-8').write(SW_JS)
print('  sw.js: service worker')
placeholder = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
               '<meta name="robots" content="noindex,nofollow">'
               '<title>Private</title><style>body{font-family:system-ui,sans-serif;'
               'display:grid;place-items:center;height:100vh;margin:0;color:#667;background:#f5f6fa}'
               '</style></head><body><p>This page is private. Access is by invitation only.</p></body></html>')
open('index.html', 'w', encoding='utf-8').write(placeholder)
print('  index.html: private placeholder')

print('done.')
