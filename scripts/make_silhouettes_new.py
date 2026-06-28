import json
import requests
from pathlib import Path
from rembg import remove
from PIL import Image
import io

SUPABASE_URL = "https://hqilycrzmzefzozjuhrw.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxaWx5Y3J6bXplZnpvemp1aHJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU0ODExMywiZXhwIjoyMDk4MTI0MTEzfQ.u3fRHxMEWhBeTqr8PNY6AlZT6SJRQ4QW4SxWwcbQJ0s"
BUCKET = "silhouettes"

TARGET_BIRDS = ['집비둘기', '꿩', '방울새', '개똥지빠귀', '멧새', '흰배지빠귀']

BIRDS_JSON = Path(__file__).parent.parent / "src" / "data" / "birds.json"
OUTPUT_DIR = Path(__file__).parent / "silhouette_output"
OUTPUT_DIR.mkdir(exist_ok=True)

def download_image(url):
    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "BirdDex/1.0"})
        r.raise_for_status()
        return r.content
    except Exception as e:
        print(f"  다운로드 실패: {e}")
        return None

def make_silhouette(img_bytes):
    output = remove(img_bytes)
    img = Image.open(io.BytesIO(output)).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 10:
                pixels[x, y] = (0, 0, 0, a)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def upload_to_supabase(filename, data):
    headers = {
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "image/png",
    }
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
    r = requests.post(url, headers=headers, data=data)
    if r.status_code in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    r = requests.put(url, headers=headers, data=data)
    if r.status_code in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    print(f"  업로드 실패: {r.status_code} {r.text}")
    return None

def main():
    with open(BIRDS_JSON, encoding="utf-8") as f:
        birds = json.load(f)

    targets = [b for b in birds if b["name_ko"] in TARGET_BIRDS]
    sql_lines = []

    for bird in targets:
        name = bird["name_ko"]
        url = bird.get("image_url")
        print(f"[{name}]", end=" ")

        if not url:
            print("image_url 없음, 건너뜀")
            continue

        sci_name = bird.get("name_sci", name)
        filename = sci_name.replace(" ", "_").replace("/", "_") + ".png"
        local_path = OUTPUT_DIR / filename

        if local_path.exists():
            print("캐시 사용", end=" ")
            with open(local_path, "rb") as f:
                sil_bytes = f.read()
        else:
            img_bytes = download_image(url)
            if not img_bytes:
                continue
            print("배경 제거 중...", end=" ")
            sil_bytes = make_silhouette(img_bytes)
            with open(local_path, "wb") as f:
                f.write(sil_bytes)

        pub_url = upload_to_supabase(filename, sil_bytes)
        if pub_url:
            escaped = name.replace("'", "''")
            sql_lines.append(f"UPDATE birds SET silhouette_url = '{pub_url}' WHERE name_ko = '{escaped}';")
            print(f"완료 → {pub_url}")

    if sql_lines:
        sql_path = Path(__file__).parent / "update_silhouettes_new.sql"
        with open(sql_path, "w", encoding="utf-8") as f:
            f.write("\n".join(sql_lines))
        print(f"\nSQL 저장됨: {sql_path}")
        print("\n--- SQL 내용 (Supabase에서 실행) ---")
        for line in sql_lines:
            print(line)

if __name__ == "__main__":
    main()
