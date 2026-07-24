#!/usr/bin/env python3
"""
Отчёт по Яндекс.Метрике: сводка визитов, источники трафика, цели, топ страниц.

Использование:
    export METRIKA_TOKEN=...
    export METRIKA_COUNTER=...
    python metrika.py [--days N]

Токен и id счётчика также можно передать флагами --token / --counter.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta

API_STAT = "https://api-metrika.yandex.net/stat/v1/data"
API_GOALS = "https://api-metrika.yandex.net/management/v1/counter/{counter}/goals"


def api_get(url, token, params=None):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": f"OAuth {token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"Ошибка API ({e.code}) при запросе {url}:\n{body}", file=sys.stderr)
        sys.exit(1)


def fmt_num(value):
    if isinstance(value, float):
        return f"{value:,.1f}".replace(",", " ")
    return f"{value:,}".replace(",", " ")


def print_table(headers, rows):
    widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(str(cell)))
    line = "  ".join(h.ljust(widths[i]) for i, h in enumerate(headers))
    print(line)
    print("-" * len(line))
    for row in rows:
        print("  ".join(str(cell).ljust(widths[i]) for i, cell in enumerate(row)))


def visits_summary(token, counter, date_from, date_to):
    metrics = ",".join([
        "ym:s:visits",
        "ym:s:users",
        "ym:s:pageviews",
        "ym:s:bounceRate",
        "ym:s:avgVisitDurationSeconds",
    ])
    data = api_get(API_STAT, token, {
        "id": counter,
        "date1": date_from,
        "date2": date_to,
        "metrics": metrics,
    })
    totals = data.get("totals", [0, 0, 0, 0, 0])
    print(f"\n=== Сводка визитов ({date_from} — {date_to}) ===")
    print_table(
        ["Визиты", "Посетители", "Просмотры", "Отказы, %", "Ср. длительность, сек"],
        [[
            fmt_num(totals[0]),
            fmt_num(totals[1]),
            fmt_num(totals[2]),
            fmt_num(round(totals[3], 1)),
            fmt_num(round(totals[4], 1)),
        ]],
    )


def traffic_sources(token, counter, date_from, date_to):
    data = api_get(API_STAT, token, {
        "id": counter,
        "date1": date_from,
        "date2": date_to,
        "metrics": "ym:s:visits,ym:s:users",
        "dimensions": "ym:s:lastTrafficSource",
        "sort": "-ym:s:visits",
    })
    rows = []
    for item in data.get("data", []):
        name = item["dimensions"][0].get("name", "—")
        visits, users = item["metrics"]
        rows.append([name, fmt_num(visits), fmt_num(users)])
    print(f"\n=== Источники трафика ({date_from} — {date_to}) ===")
    if rows:
        print_table(["Источник", "Визиты", "Посетители"], rows)
    else:
        print("Нет данных.")


def goals_report(token, counter, date_from, date_to):
    goals_data = api_get(API_GOALS.format(counter=counter), token)
    goals = goals_data.get("goals", [])
    print(f"\n=== Цели ({date_from} — {date_to}) ===")
    if not goals:
        print("В счётчике не настроено ни одной цели.")
        return

    rows = []
    for goal in goals:
        goal_id = goal["id"]
        goal_name = goal.get("name", str(goal_id))
        data = api_get(API_STAT, token, {
            "id": counter,
            "date1": date_from,
            "date2": date_to,
            "metrics": f"ym:s:goal{goal_id}reaches,ym:s:goal{goal_id}conversionRate",
        })
        totals = data.get("totals", [0, 0])
        rows.append([goal_name, fmt_num(totals[0]), f"{round(totals[1], 2)}%"])
    print_table(["Цель", "Достижения", "Конверсия"], rows)


def top_pages(token, counter, date_from, date_to, limit=10):
    data = api_get(API_STAT, token, {
        "id": counter,
        "date1": date_from,
        "date2": date_to,
        "metrics": "ym:pv:pageviews",
        "dimensions": "ym:pv:URLPathFull",
        "sort": "-ym:pv:pageviews",
        "limit": limit,
    })
    rows = []
    for item in data.get("data", []):
        path = item["dimensions"][0].get("name", "—")
        if len(path) > 60:
            path = path[:57] + "..."
        pageviews = item["metrics"][0]
        rows.append([path, fmt_num(pageviews)])
    print(f"\n=== Топ страниц ({date_from} — {date_to}) ===")
    if rows:
        print_table(["Страница", "Просмотры"], rows)
    else:
        print("Нет данных.")


def keyword_dimension_report(token, counter, date_from, date_to, dimension, title, limit=15, extra_metric=None):
    metrics = "ym:s:visits" if not extra_metric else f"ym:s:visits,{extra_metric}"
    data = api_get(API_STAT, token, {
        "id": counter,
        "date1": date_from,
        "date2": date_to,
        "metrics": metrics,
        "dimensions": dimension,
        "sort": "-ym:s:visits",
        "limit": limit,
    })
    rows = []
    for item in data.get("data", []):
        name = item["dimensions"][0].get("name") or "(не задано)"
        metric_values = item["metrics"]
        rows.append([name] + [fmt_num(v) for v in metric_values])
    print(f"\n=== {title} ({date_from} — {date_to}) ===")
    if rows:
        headers = ["Значение", "Визиты"] + (["Доп. метрика"] if extra_metric else [])
        print_table(headers, rows)
    else:
        print("Нет данных.")


def leads_by_keyword(token, counter, date_from, date_to, goal_id, goal_name, dimension, title, limit=20):
    data = api_get(API_STAT, token, {
        "id": counter,
        "date1": date_from,
        "date2": date_to,
        "metrics": f"ym:s:visits,ym:s:goal{goal_id}reaches",
        "dimensions": dimension,
        "sort": f"-ym:s:goal{goal_id}reaches",
        "limit": limit,
    })
    rows = []
    for item in data.get("data", []):
        name = item["dimensions"][0].get("name") or "(не задано)"
        visits, reaches = item["metrics"]
        if reaches and reaches > 0:
            rows.append([name, fmt_num(visits), fmt_num(reaches)])
    print(f"\n=== {title}: заявки по цели «{goal_name}» ({date_from} — {date_to}) ===")
    if rows:
        print_table(["Значение", "Визиты", "Заявки"], rows)
    else:
        print("Заявок с этим срезом не найдено.")


def pick_lead_goal(goals):
    priority = ["отправка формы", "заявк", "форм"]
    for keyword in priority:
        for g in goals:
            if keyword in g.get("name", "").lower():
                return g
    for g in goals:
        if g.get("type") == "form":
            return g
    return goals[0] if goals else None


def demographics_report(token, counter, date_from, date_to):
    for dimension, title in [
        ("ym:s:regionCity", "Города"),
        ("ym:s:gender", "Пол"),
        ("ym:s:ageInterval", "Возраст"),
    ]:
        keyword_dimension_report(token, counter, date_from, date_to, dimension, title, limit=15)


def full_report(token, counter, date_from, date_to):
    keyword_dimension_report(token, counter, date_from, date_to, "ym:s:UTMCampaign", "UTM-кампании")
    keyword_dimension_report(token, counter, date_from, date_to, "ym:s:UTMTerm", "Ключевые слова (UTM Term)")
    keyword_dimension_report(token, counter, date_from, date_to, "ym:s:searchPhrase", "Поисковые фразы (органика)")

    goals_data = api_get(API_GOALS.format(counter=counter), token)
    goals = goals_data.get("goals", [])
    lead_goal = pick_lead_goal(goals)
    if lead_goal:
        leads_by_keyword(token, counter, date_from, date_to, lead_goal["id"], lead_goal["name"], "ym:s:UTMTerm", "Ключевые слова (UTM Term)")
        leads_by_keyword(token, counter, date_from, date_to, lead_goal["id"], lead_goal["name"], "ym:s:UTMCampaign", "UTM-кампании")
        leads_by_keyword(token, counter, date_from, date_to, lead_goal["id"], lead_goal["name"], "ym:s:lastTrafficSource", "Источники трафика")

    demographics_report(token, counter, date_from, date_to)


def main():
    parser = argparse.ArgumentParser(description="Отчёт по Яндекс.Метрике")
    parser.add_argument("--days", type=int, default=7, help="Период в днях (по умолчанию 7)")
    parser.add_argument("--token", default=os.environ.get("METRIKA_TOKEN"))
    parser.add_argument("--counter", default=os.environ.get("METRIKA_COUNTER"))
    parser.add_argument("--full", action="store_true", help="Добавить ключевые слова, заявки по ключам и демографию")
    args = parser.parse_args()

    if not args.token or not args.counter:
        print("Нужны METRIKA_TOKEN и METRIKA_COUNTER (env или флаги --token/--counter).", file=sys.stderr)
        sys.exit(1)

    date_to = date.today()
    date_from = date_to - timedelta(days=args.days - 1)
    d1, d2 = date_from.isoformat(), date_to.isoformat()

    visits_summary(args.token, args.counter, d1, d2)
    traffic_sources(args.token, args.counter, d1, d2)
    goals_report(args.token, args.counter, d1, d2)
    top_pages(args.token, args.counter, d1, d2)

    if args.full:
        full_report(args.token, args.counter, d1, d2)


if __name__ == "__main__":
    main()
