<?php declare(strict_types=1);

function main()
{
    $startTime = microtime(true);

    $stdin = file_get_contents('php://stdin');
    $full = json_decode($stdin, true);
    $level1Data = $full['data'];
    $level1Count = 0;
    $level2Count = 0;
    $level3Count = 0;
    $level3FullCount = $full['stats']['level3_count'];
    $level1PostcodeCount = 0;
    $level2PostcodeCount = 0;
    $level3PostcodeCount = 0;

    $treeJsonPath = __DIR__ . '/../history/data/tree.json';
    $tree = json_decode(file_get_contents($treeJsonPath), true);

    $data = [];
    if ($GLOBALS['argc'] > 1) {
        $data = json_decode(file_get_contents($GLOBALS['argv'][1]), true)['data'];
    }

    foreach ($level1Data as $_level1) {
        $level1Count++;
        $level1Tree = !empty($tree[$_level1['level1_id']]) ? $tree[$_level1['level1_id']] : [];
        $level1Name = _splitName($_level1, 1, $level1Tree);
        $level1Postcode = !empty($data[$_level1['level1_id']])
            ? $data[$_level1['level1_id']]
            : _request([$level1Name], 1, '');
        if (!empty($level1Postcode)) {
            $level1PostcodeCount++;
        }

        $data[$_level1['level1_id']] = $level1Postcode;

        foreach ($_level1['level2s'] as $_level2) {
            $level2Count++;
            $level2Tree = !empty($level1Tree[1][$_level2['level2_id']]) ? $level1Tree[1][$_level2['level2_id']] : [];
            $level2Name = _splitName($_level2, 2, $level2Tree);
            $level2Names = [$level2Name, $level1Name];
            $level2Postcode = !empty($data[$_level2['level2_id']])
                ? $data[$_level2['level2_id']]
                : _request($level2Names, 2, $level1Postcode);
            if (!empty($level2Postcode)) {
                $level2PostcodeCount++;
            }

            $data[$_level2['level2_id']] = $level2Postcode;

            foreach ($_level2['level3s'] as $_level3) {
                $level3Count++;
                $level3Tree = !empty($level2Tree[1][$_level3['level3_id']]) ? $level2Tree[1][$_level3['level3_id']] : [];
                $level3Name = _splitName($_level3, 3, $level3Tree);
                $level3Names = [$level3Name, $level2Name, $level1Name];
                $level3Postcode = !empty($data[$_level3['level3_id']])
                    ? $data[$_level3['level3_id']]
                    : _request($level3Names, 3, $level2Postcode);
                if (!empty($level3Postcode)) {
                    $level3PostcodeCount++;
                }

                $data[$_level3['level3_id']] = $level3Postcode;

                if ($level3Count % 10 === 0) {
                    fwrite(STDERR, sprintf('%.1f%% ', $level3Count / $level3FullCount * 100));
                }
            }
        }
    }

    $output = [
        'data' => $data,
        'stdin_md5' => md5($stdin),
        'generate_date' => time(),
        'stats' => [
            'elapsed_time' => microtime(true) - $startTime,
            'level1_postcode_count' => $level1PostcodeCount,
            'level2_postcode_count' => $level2PostcodeCount,
            'level3_postcode_count' => $level3PostcodeCount,
        ],
    ];

    echo(json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function _postcodeHasPrefix($postcode, $prefixes): bool
{
    if (!is_array($prefixes)) {
        $prefixes = [$prefixes];
    }

    foreach ($prefixes as $prefix) {
        if (strlen($prefix) < 2 || substr($postcode, 0, 2) === substr($prefix, 0, 2)) {
            return true;
        }
    }

    return false;
}

function _request(array $entities, int $level, $parentPostcode)
{
    $ids = [];
    $combinations = [['name' => [], 0 => []]];
    foreach ($entities as $entity) {
        $ids[] = $entity['id'];

        $before = $combinations;
        $combinations = [];
        foreach (array_reverse($entity['names']) as $name) {
            foreach ($before as $b) {
                $combination = $b;
                $combination['name'][] = $name['name'];
                $combination[0][] = $name[0];
                $combinations[] = $combination;
            }
        }
    }

    foreach ($combinations as $combination) {
        $postcode = __request(
            $ids,
            implode(' ', $combination['name']),
            implode(' ', $combination['0']),
            $level,
            $parentPostcode
        );

        if (!empty($postcode)) {
            return $postcode;
        }
    }

    return '';
}

function __request(array $ids, string $names, string $fullNames, int $level, $parentPostcode, array $options = [])
{
    static $expectedPostcodeLength = [1 => 2, 2 => 3, 3 => 5];
    static $queryMaxLength = 45;
    static $postOfficePrefix = 'buu cuc trung tam ';

    if (!isset($options['useFullNames'])) {
        $useFullNamesFalse = __request($ids, $names, $fullNames, $level, $parentPostcode,
            $options + ['useFullNames' => false]);
        if (!empty($useFullNamesFalse)) {
            return $useFullNamesFalse;
        }

        return __request($ids, $names, $fullNames, $level, $parentPostcode, $options + ['useFullNames' => true]);
    }

    $transliterator = Transliterator::createFromRules(
        ':: Any-Latin; :: Latin-ASCII; :: NFD; :: [:Nonspacing Mark:] Remove; :: Lower(); :: NFC;',
        Transliterator::FORWARD
    );
    $namesSafe = $transliterator->transliterate($names);
    $fullNamesSafe = $transliterator->transliterate($fullNames);
    if ($level > 1 && empty($parentPostcode)) {
        fwrite(STDERR, "Skipped searching for '$fullNamesSafe' without parent postcode\n");
        return '';
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://mabuuchinh.vn/API/serviceApi/v1/MBC');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    $query = $options['useFullNames'] ? $fullNamesSafe : $namesSafe;
    if (!$options['useFullNames'] && $level === 2 && strlen($query) < ($queryMaxLength - strlen($postOfficePrefix))) {
        $query = $postOfficePrefix . $query;
    }
    $query = substr($query, 0, $queryMaxLength);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['textsearch' => $query]));
    curl_setopt($ch, CURLOPT_POST, true);

    fwrite(STDERR, 'r');
    $json = curl_exec($ch);
    curl_close($ch);

    $data = @json_decode($json, true);
    if (!is_array($data)) {
        fwrite(STDERR, "Data could not be extracted for '$query' json=$json\n");
        return '';
    }

    $ignored = [];
    $pattern = '/^(?<postcode>\d+' . ($level === 1 ? '(-\d+)?' : '') . ') - (?<name>.+)$/';
    $postcode = null;
    $similarityMax = strlen($namesSafe);
    foreach ($data as $found) {
        if (!is_array($found) || !isset($found['name'])) {
            continue;
        }

        $foundNameFullSafe = $transliterator->transliterate($found['name']);
        if (preg_match($pattern, $found['name'], $matches) !== 1) {
            $ignored[] = "Ignored pattern: $foundNameFullSafe";
            continue;
        }
        $foundName = $matches['name'];
        $foundNameSafe = $transliterator->transliterate($foundName);

        if (is_numeric($matches['postcode'])) {
            $foundPostcode = $matches['postcode'];

            if ($level === 2 &&
                substr($foundPostcode, -2) === '00' &&
                substr($foundNameSafe, 0, strlen($postOfficePrefix)) == $postOfficePrefix
            ) {
                $foundPostcode = substr($foundPostcode, 0, -2);
                $foundName = mb_substr($foundName, strlen($postOfficePrefix));
                $foundNameSafe = substr($foundNameSafe, strlen($postOfficePrefix));
            }

            if (strlen($foundPostcode) !== $expectedPostcodeLength[$level]) {
                $ignored[] = "Ignored postcode length: $foundNameFullSafe";
                continue;
            }
        } else {
            $foundPostcode = [];
            $range = array_map('intval', explode('-', $matches['postcode']));
            for ($i = $range[0]; $i <= $range[1]; $i++) {
                $foundPostcode[] = str_pad(strval($i), 2, '0', STR_PAD_LEFT);
            }
        }

        if (is_array($foundPostcode)) {
            if ($level !== 1) {
                // ignore range if level > 1
                $ignored[] = "Ignored range at level $level: $foundNameFullSafe";
                continue;
            }
        } else {
            if (!_postcodeHasPrefix($foundPostcode, $parentPostcode)) {
                // ignore postcode with wrong prefix
                $ignored[] = "Ignored wrong prefix: $foundNameFullSafe";
                continue;
            }
        }

        $similarity = similar_text($fullNamesSafe, $foundNameSafe);
        if ($similarity <= $similarityMax) {
            // ignore low similarity with full names
            $ignored[] = "Ignored low similarity: $foundNameFullSafe ($fullNamesSafe, $foundNameSafe, $similarity / $similarityMax)";
            continue;
        }

        if (!_verify($ids, $foundName)) {
            // ignore failed verification
            $ignored[] = "Ignored failed verification: $foundNameFullSafe";
            continue;
        }

        $postcode = $foundPostcode;
        $similarityMax = $similarity;
    }

    if ($postcode !== null) {
        return $postcode;
    }

    fwrite(STDERR, "$query:\n\t" . implode("\n\t", $ignored) . "\n\n");
    return '';
}

function _splitName(array $data, int $level, array $tree): array
{
    static $pattern = '/^(?<type>(Huyện|Quận|Phường|Thành phố|Thị (trấn|xã)|Tỉnh|Xã))\s+(?<name>.+)$/i';

    $names = !empty($tree[0]) ? $tree[0] : [$data['name']];
    $output = ['id' => $data["level{$level}_id"], 'names' => []];
    foreach ($names as $name) {
        if (preg_match($pattern, $name, $matches) !== 1) {
            fwrite(STDERR, "Could not split name: $name\n");
            exit(1);
        }

        $output['names'][] = $matches;
    }

    return $output;
}

function _verify(array $ids, string $foundName): bool
{
    static $caches = [];

    if (!isset($caches[$foundName])) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://dvhcvn-git-demo-parser.daohoangson.now.sh/demo/parser/api');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $foundName);
        curl_setopt($ch, CURLOPT_POST, true);

        fwrite(STDERR, 'v');
        $json = curl_exec($ch);
        curl_close($ch);

        $caches[$foundName] = $json;
    } else {
        $json = $caches[$foundName];
    }

    $data = @json_decode($json, true);
    if (!is_array($data)) {
        fwrite(STDERR, "Verification could not be done for '$foundName' json=$json\n");
        return false;
    }

    if (count($ids) !== count($data)) {
        return false;
    }

    for ($i = 0; $i < count($ids); $i++) {
        if ($ids[$i] !== $data[$i]['id']) {
            return false;
        }
    }

    return true;
}

main();
