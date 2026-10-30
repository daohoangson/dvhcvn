"""Build data/dvhcvn.json for the two-level structure in effect since 01/07/2025.

The GSO web service used by 01_gso.gov.vn.php is no longer reachable, so this reads
the official lists instead:
- 915_CTK-CSCL.csv: codes of the 34 provinces
- 1027_CTK-CSCL.md: codes of the communes (Phụ lục I of Công văn 1027/CTK-CSCL)

Both files were converted from the PDFs by https://github.com/dvhcvn/20250701.
"""

import csv
import json
import os
import re
import sys
import time

DATA_DATE = "01/07/2025"
LEVEL1_CITY_PREFIX = "Thành phố "
COMMUNE_TYPES = ("Phường", "Xã", "Đặc khu")

_dir = os.path.dirname(os.path.abspath(__file__))


def read_level1s():
    with open(os.path.join(_dir, "915_CTK-CSCL.csv"), encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    level1s = []
    for row in rows:
        name = row["Tên 34 tỉnh sau sáp nhập"].strip()
        if name.startswith(LEVEL1_CITY_PREFIX):
            level1_type = "Thành phố Trung ương"
        else:
            level1_type = "Tỉnh"
            name = "Tỉnh " + name
        level1s.append({"level1_id": row["Mã số"].strip(), "name": name, "type": level1_type})
    return level1s


def clean(cell):
    # the PDF conversion keeps line breaks of wrapped cells as <br>
    return re.sub(r"\s+", " ", re.sub(r"\s*<br>\s*", " ", cell)).strip()


def read_communes():
    with open(os.path.join(_dir, "1027_CTK-CSCL.md"), encoding="utf-8") as f:
        lines = f.read().splitlines()

    communes = []
    for line in lines:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != 4 or not re.fullmatch(r"\d{5}", cells[1]):
            # table headers, separators and the upper-case province rows
            continue

        name = clean(cells[2])
        commune_type = next((t for t in COMMUNE_TYPES if name.startswith(t + " ")), None)
        if commune_type is None:
            raise ValueError(f"Unknown commune type: {line}")

        communes.append(
            {
                "id": cells[1],
                "name": name,
                "type": commune_type,
                # some pages abbreviate "Thành phố" as "Tp"
                "level1_name": re.sub(r"^Tp ", LEVEL1_CITY_PREFIX, clean(cells[3])),
            }
        )
    return communes


def main():
    level1s = read_level1s()
    by_name = {level1["name"]: level1 for level1 in level1s}
    for level1 in level1s:
        level1["level2s"] = []

    seen = set()
    for commune in read_communes():
        if commune["id"] in seen:
            raise ValueError(f"Duplicate commune id: {commune['id']}")
        seen.add(commune["id"])

        level1 = by_name.get(commune["level1_name"])
        if level1 is None:
            raise ValueError(f"Unknown province for {commune['id']}: {commune['level1_name']}")
        level1["level2s"].append({"level2_id": commune["id"], "name": commune["name"], "type": commune["type"]})

    empty = [level1["name"] for level1 in level1s if not level1["level2s"]]
    if empty:
        raise ValueError(f"Provinces without communes: {empty}")

    output = {
        "data": level1s,
        "data_date": DATA_DATE,
        "generate_date": int(time.time()),
        "stats": {
            "level1_count": len(level1s),
            "level2_count": len(seen),
        },
    }
    sys.stdout.write(json.dumps(output, ensure_ascii=False, indent=4) + "\n")


if __name__ == "__main__":
    main()
