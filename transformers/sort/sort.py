import json
import re
import sys
from unidecode import unidecode


def process_name(e):
    prefix = e["type"]
    if e["type"] == "Thành phố Trung ương":
        prefix = "Thành phố"
    if e["type"] == "Thị xã" or e["type"] == "Huyện":
        prefix = "(Thị xã|Huyện)"
    if e["type"] == "Xã" or e["type"] == "Phường":
        prefix = "(Xã|Phường)"

    pattern = "^{} ".format(prefix)
    match = re.match(pattern, e['name'], re.IGNORECASE)

    name_full = e['name']
    name_prefix_only = match.group(0).strip()
    name_without_prefix = name_full[match.end(0):]
    if len(name_without_prefix) == 0 or name_without_prefix == name_full:
        raise Exception("Cannot strip '{}' from '{}'".format(
            prefix, e['name']))

    name_normalized = unidecode(name_without_prefix)

    return [name_without_prefix, name_prefix_only, name_normalized]


def sort_by_normalized(normalized_level1s):
    return sorted(normalized_level1s, key=lambda k: "%03d" % int(k[3]) if k[3].isnumeric() else k[3])


def serialize_json(obj):
    dump = json.dumps(obj, ensure_ascii=False, indent=4)
    dump = re.sub(
        r'("[^"]+"),\s+("[^"]+"),\s+("[^"]+"),\s+("[^"]+"),', r"\1, \2, \3, \4,", dump)
    dump = re.sub(
        r'\[\s+("[^"]+"),\s+("[^"]+"),\s+("[^"]+"),\s+("[^"]+")\s+\]', r"[\1, \2, \3, \4]", dump)
    return dump


if __name__ == "__main__":
    data = json.load(sys.stdin)
    level1s = []

    for _level1 in data['data']:
        level2s = []
        for _level2 in _level1['level2s']:
            level3s = []
            for _level3 in _level2['level3s']:
                level3s.append(
                    [_level3['level3_id']] +
                    process_name(_level3)
                )

            level2s.append(
                [_level2['level2_id']] +
                process_name(_level2) +
                [sort_by_normalized(level3s)]
            )

        level1s.append(
            [_level1['level1_id']] +
            process_name(_level1) +
            [sort_by_normalized(level2s)]
        )

    sorted_level1s = sort_by_normalized(level1s)
    print(serialize_json(sorted_level1s))
