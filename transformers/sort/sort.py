import json
import re
import sys
from unidecode import unidecode


def processName(e):
    prefix = e["type"]
    if e["type"] == "Thành phố Trung ương":
        prefix = "Thành phố"
    if e["type"] == "Thị xã" or e["type"] == "Huyện":
        prefix = "(Thị xã|Huyện)"
    if e["type"] == "Xã" or e["type"] == "Phường":
        prefix = "(Xã|Phường)"

    pattern = "^{} ".format(prefix)
    match = re.match(pattern, e['name'], re.IGNORECASE)

    nameFull = e['name']
    namePrefixOnly = match.group(0).strip()
    nameWithoutPrefix = nameFull[match.end(0):]
    if len(nameWithoutPrefix) == 0 or nameWithoutPrefix == nameFull:
        raise Exception("Cannot strip '{}' from '{}'".format(
            prefix, e['name']))

    nameNormalized = unidecode(nameWithoutPrefix)

    return [nameWithoutPrefix, namePrefixOnly, nameNormalized]


def sortByNormalized(l):
    return sorted(l, key=lambda k: "%03d" % int(k[3]) if k[3].isnumeric() else k[3])


def serializeJson(data):
    dump = json.dumps(output, ensure_ascii=False, indent=4)
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
                    processName(_level3)
                )

            level2s.append(
                [_level2['level2_id']] +
                processName(_level2) +
                [sortByNormalized(level3s)]
            )

        level1s.append(
            [_level1['level1_id']] +
            processName(_level1) +
            [sortByNormalized(level2s)]
        )

    output = sortByNormalized(level1s)
    print(serializeJson(output))
