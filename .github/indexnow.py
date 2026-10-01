"""Сообщает Яндексу (и Bing) через IndexNow об изменившихся страницах greklama.ru.

Запуск из GitHub Actions после push в greklama-direct.
  python3 .github/indexnow.py <before_sha>   — только страницы, изменённые в push
  python3 .github/indexnow.py --all          — все адреса из sitemap.xml
Отправляются только адреса, которые есть в sitemap.xml.
"""
import glob
import json
import os
import re
import subprocess
import sys
import time
import urllib.request

HOST = "greklama.ru"
SITE = "https://" + HOST
ENDPOINTS = ["https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"]


def key():
    for path in glob.glob("*.txt"):
        name = os.path.basename(path)[:-4]
        if re.fullmatch(r"[0-9a-f]{32}", name):
            return name
    sys.exit("Нет файла-ключа IndexNow (<32 hex>.txt) в корне сайта")


def sitemap_urls():
    with open("sitemap.xml", encoding="utf-8") as f:
        return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", f.read())


def changed_urls(before):
    if not before or set(before) == {"0"}:
        return None
    out = subprocess.run(["git", "diff", "--name-only", before, "HEAD"],
                         capture_output=True, text=True, check=True).stdout
    urls = set()
    for path in out.split():
        if path == "sitemap.xml":
            continue
        if path.endswith("index.html"):
            urls.add(SITE + "/" + path[: -len("index.html")])
        elif path.endswith(".html"):
            urls.add(SITE + "/" + path)
    return urls


def fetch_ok(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "indexnow-ping"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200, r.read().decode("utf-8", "replace")
    except Exception:
        return False, ""


def wait_deployed(k, urls):
    """Сервер подтягивает ветку сам; ждём, пока появятся ключ и страницы."""
    for _ in range(30):
        ok, body = fetch_ok(f"{SITE}/{k}.txt")
        if ok and body.strip() == k and all(fetch_ok(u)[0] for u in urls[:5]):
            return True
        time.sleep(10)
    return False


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    in_sitemap = sitemap_urls()
    changed = None if arg == "--all" else changed_urls(arg)
    urls = in_sitemap if changed is None else [u for u in in_sitemap if u in changed]
    if not urls:
        print("Изменённых страниц из sitemap нет — отправлять нечего")
        return
    k = key()
    if not wait_deployed(k, urls):
        sys.exit("Сайт не обновился за 5 минут — IndexNow не отправлен")
    payload = json.dumps({"host": HOST, "key": k, "keyLocation": f"{SITE}/{k}.txt",
                          "urlList": urls}).encode()
    failed = False
    for ep in ENDPOINTS:
        req = urllib.request.Request(ep, data=payload, method="POST",
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                print(f"{ep}: {r.status}")
        except urllib.error.HTTPError as e:
            print(f"{ep}: {e.code} {e.read()[:300]!r}")
            failed = failed or ep.startswith("https://yandex")
        except Exception as e:
            print(f"{ep}: {e}")
    print("Отправлено:", *urls, sep="\n  ")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
