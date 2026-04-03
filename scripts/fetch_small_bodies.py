#!/usr/bin/env python3
"""
一次性腳本：從 JPL SBDB 抓取小天體軌道要素，存入 Supabase

用法：
  export SUPABASE_URL=https://xxx.supabase.co
  export SUPABASE_SERVICE_KEY=eyJ...   # service_role key（有寫入權限）
  python3 scripts/fetch_small_bodies.py

資料來源：https://ssd-api.jpl.nasa.gov/sbdb_query.api
"""

import json
import math
import os
import ssl
import sys
import time
import urllib.request
import urllib.parse

# macOS Python SSL 憑證問題 workaround
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("請設定 SUPABASE_URL 和 SUPABASE_SERVICE_KEY 環境變數")
    sys.exit(1)

# JPL SBDB Query API
JPL_API = "https://ssd-api.jpl.nasa.gov/sbdb_query.api"
FIELDS = "full_name,e,a,i,om,w,ma,epoch"

# 各類別抓取配置：(class, sb-class, limit)
CATEGORIES = [
    ("MBA", "MBA", 40000),    # 主帶小行星（取樣 40k）
    ("TJN", "TJN", 20000),    # 木星特洛伊（全撈）
    ("NEO", "APO", 25000),    # 近地天體 Apollo 型（全撈）
    ("TNO", "TNO", 10000),    # 海王星外天體（全撈）
    ("CEN", "CEN", 2000),     # 半人馬（全撈）
    ("HTC", "HTC", 200),      # 哈雷型彗星（全撈）
    ("JFC", "JFC", 50),       # 木星族彗星（全撈）
]


def fetch_from_jpl(sb_class: str, limit: int) -> list[dict]:
    """從 JPL SBDB 抓取指定類別的小天體"""
    params = urllib.parse.urlencode({
        "fields": FIELDS,
        "sb-class": sb_class,
        "limit": limit,
    })
    url = f"{JPL_API}?{params}"
    print(f"  Fetching {url}")

    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=60, context=SSL_CTX) as resp:
        data = json.loads(resp.read())

    fields = data.get("fields", [])
    rows = data.get("data", [])
    print(f"  Got {len(rows)} rows, fields: {fields}")

    results = []
    for row in rows:
        try:
            name = row[0].strip() if row[0] else "Unknown"
            e = float(row[1])
            a = float(row[2])
            i = float(row[3])
            om = float(row[4])
            w = float(row[5])
            ma = float(row[6])
            epoch_jd = float(row[7])

            # 計算週期：T = 2π × √(a³) 年 → 天
            period_years = math.sqrt(a ** 3) if a > 0 else 0
            period_days = period_years * 365.25

            results.append({
                "name": name[:200],  # 截斷過長名稱
                "a": round(a, 6),
                "e": round(e, 6),
                "i": round(i, 4),
                "om": round(om, 4),
                "w": round(w, 4),
                "ma": round(ma, 4),
                "epoch_jd": round(epoch_jd, 1),
                "period_days": round(period_days, 1),
            })
        except (ValueError, IndexError, TypeError):
            continue

    return results


def upsert_to_supabase(records: list[dict], body_class: str):
    """批次寫入 Supabase（每批 500 筆）"""
    endpoint = f"{SUPABASE_URL}/rest/v1/small_bodies"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    # 加上 class 欄位
    for r in records:
        r["class"] = body_class

    batch_size = 500
    total = len(records)
    for start in range(0, total, batch_size):
        batch = records[start:start + batch_size]
        body = json.dumps(batch).encode("utf-8")

        req = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as resp:
                status = resp.status
            print(f"    Batch {start}-{start+len(batch)}: HTTP {status}")
        except Exception as ex:
            print(f"    Batch {start} failed: {ex}")
            # 繼續下一批
        time.sleep(0.3)  # 避免 rate limit


def main():
    print("=" * 60)
    print("JPL SBDB → Supabase 小天體資料匯入")
    print("=" * 60)

    total = 0
    for body_class, sb_class, limit in CATEGORIES:
        print(f"\n[{body_class}] 抓取 {sb_class}（limit={limit}）...")
        records = fetch_from_jpl(sb_class, limit)
        print(f"  解析成功：{len(records)} 筆")

        if records:
            print(f"  寫入 Supabase...")
            upsert_to_supabase(records, body_class)
            total += len(records)

        time.sleep(1)  # 間隔 1 秒，避免 JPL rate limit

    print(f"\n完成！共匯入 {total} 筆小天體資料")


if __name__ == "__main__":
    main()
