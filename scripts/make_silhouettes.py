import json
import os
import requests
from pathlib import Path
from rembg import remove
from PIL import Image
import io

SUPABASE_URL = "https://hqilycrzmzefzozjuhrw.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxaWx5Y3J6bXplZnpvemp1aHJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU0ODExMywiZXhwIjoyMDk4MTI0MTEzfQ.u3fRHxMEWhBeTqr8PNY6AlZT6SJRQ4QW4SxWwcbQJ0s"
BUCKET = "silhouettes"

BIRDS_JSON = Path(__file__).parent.parent / "src" / "data" / "birds.json"
OUTPUT_DIR = Path(__file__).parent / "silhouette_output"
OUTPUT_DIR.mkdir(exist_ok=True)

def download_image(url: str) -> bytes | None:
    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "BirdDex/1.0"})
        r.raise_for_status()
        return r.content
    except Exception as e:
        print(f"  다운로드 실패: {e}")
        return None

def make_silhouette(img_bytes: bytes) -> bytes:
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

def upload_to_supabase(filename: str, data: bytes) -> str | None:
    headers = {
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "image/png",
    }
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
    r = requests.post(url, headers=headers, data=data)
    if r.status_code in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    # 이미 존재하면 upsert
    r = requests.put(url, headers=headers, data=data)
    if r.status_code in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    print(f"  업로드 실패: {r.status_code} {r.text}")
    return None

def main():
    with open(BIRDS_JSON, encoding="utf-8") as f:
        birds = json.load(f)

    sql_lines = []
    failed = []

    for i, bird in enumerate(birds):
        name = bird["name_ko"]
        url = bird.get("image_url")
        print(f"[{i+1}/{len(birds)}] {name}", end=" ... ")

        if not url:
            print("image_url 없음, 건너뜀")
            failed.append(name)
            continue

        sci_name = bird.get("name_sci", name)
        filename = sci_name.replace(" ", "_").replace("/", "_") + ".png"
        local_path = OUTPUT_DIR / filename

        if local_path.exists():
            print("로컬 캐시 사용")
            with open(local_path, "rb") as f:
                sil_bytes = f.read()
        else:
            img_bytes = download_image(url)
            if not img_bytes:
                failed.append(name)
                continue
            print("배경 제거 중...", end=" ")
            sil_bytes = make_silhouette(img_bytes)
            with open(local_path, "wb") as f:
                f.write(sil_bytes)
            print("저장 완료", end=" ")

        if SERVICE_ROLE_KEY != "여기에_서비스롤_키_붙여넣기":
            pub_url = upload_to_supabase(filename, sil_bytes)
            if pub_url:
                escaped = name.replace("'", "''")
                sql_lines.append(
                    f"UPDATE birds SET silhouette_url = '{pub_url}' WHERE name_ko = '{escaped}';"
                )
                print(f"업로드 완료")
            else:
                failed.append(name)
        else:
            print("(업로드 건너뜀 - 키 미입력)")

    if sql_lines:
        sql_path = Path(__file__).parent / "update_silhouettes.sql"
        with open(sql_path, "w", encoding="utf-8") as f:
            f.write("\n".join(sql_lines))
        print(f"\nSQL 저장: {sql_path}")

    print(f"\n완료: 성공 {len(birds) - len(failed)}종 / 실패 {len(failed)}종")
    if failed:
        print("실패 목록:", ", ".join(failed))

if __name__ == "__main__":
    main()
