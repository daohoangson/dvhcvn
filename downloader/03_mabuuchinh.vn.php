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

    $data = [];
    if ($GLOBALS['argc'] > 1) {
        $data = json_decode(file_get_contents($GLOBALS['argv'][1]), true)['data'];
    }

    foreach ($level1Data as $_level1) {
        $level1Count++;
        $level1Name = _splitName($_level1, 1);
        $level1Postcode = !empty($data[$_level1['level1_id']])
            ? $data[$_level1['level1_id']]
            : _request([$level1Name], 1, '');
        if (!empty($level1Postcode)) {
            $level1PostcodeCount++;
        }

        $data[$_level1['level1_id']] = $level1Postcode;

        foreach ($_level1['level2s'] as $_level2) {
            $level2Count++;
            $level2Name = _splitName($_level2, 2);
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
                $level3Name = _splitName($_level3, 3);
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
        if (substr($postcode, 0, strlen($prefix)) === $prefix) {
            return true;
        }
    }

    return false;
}

function _request(array $entities, int $level, $parentPostcode, array $options = [])
{
    static $expectedPostcodeLength = [1 => 2, 2 => 3, 3 => 5];
    static $queryMaxLength = 45;
    static $postOfficePrefix = 'buu cuc trung tam ';

    if (!isset($options['useFullNames'])) {
        $useFullNamesFalse = _request($entities, $level, $parentPostcode, $options + ['useFullNames' => false]);
        if (!empty($useFullNamesFalse)) {
            return $useFullNamesFalse;
        }

        return _request($entities, $level, $parentPostcode, $options + ['useFullNames' => true]);
    }

    $namesArray = [];
    $fullNamesArray = [];
    foreach ($entities as $name) {
        $namesArray[] = $name['name'];
        $fullNamesArray[] = $name[0];
    }
    $names = implode(' ', $namesArray);
    $fullNames = implode(' ', $fullNamesArray);
    if ($level > 1 && empty($parentPostcode)) {
        fwrite(STDERR, "Skipped searching for '$fullNames' without parent postcode\n");
        return '';
    }

    $transliterator = Transliterator::createFromRules(
        ':: Any-Latin; :: Latin-ASCII; :: NFD; :: [:Nonspacing Mark:] Remove; :: Lower(); :: NFC;',
        Transliterator::FORWARD
    );
    $namesSafe = $transliterator->transliterate($names);
    $fullNamesSafe = $transliterator->transliterate($fullNames);

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

        if (preg_match($pattern, $transliterator->transliterate($found['name']), $matches) !== 1) {
            $ignored[] = "Ignored pattern: {$found['name']}";
            continue;
        }
        $foundName = $matches['name'];

        if (is_numeric($matches['postcode'])) {
            $foundPostcode = $matches['postcode'];

            if ($level === 2 &&
                substr($foundPostcode, -2) === '00' &&
                substr($foundName, 0, strlen($postOfficePrefix)) == $postOfficePrefix
            ) {
                $foundPostcode = substr($foundPostcode, 0, -2);
                $foundName = substr($foundName, strlen($postOfficePrefix));
            }

            if (strlen($foundPostcode) !== $expectedPostcodeLength[$level]) {
                $ignored[] = "Ignored postcode length: {$found['name']}";
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
                $ignored[] = "Ignored range at level $level: {$found['name']}";
                continue;
            }
        } else {
            if (!_postcodeHasPrefix($foundPostcode, $parentPostcode)) {
                // ignore postcode with wrong prefix
                $ignored[] = "Ignored wrong prefix: {$found['name']}";
                continue;
            }
        }

        $foundNameSafe = $transliterator->transliterate($foundName);
        $similarity = similar_text($fullNamesSafe, $foundNameSafe);
        if ($similarity <= $similarityMax) {
            // ignore low similarity with full names
            $ignored[] = "Ignored low similarity: {$found['name']} ($fullNamesSafe, $foundNameSafe, $similarity / $similarityMax)";
            continue;
        }

        if (!_verify($entities, $found['name'])) {
            // ignore failed verification
            $ignored[] = "Ignored failed verification: {$found['name']}";
            continue;
        }

        $postcode = $foundPostcode;
        $similarityMax = $similarity;
    }

    if ($postcode !== null) {
        return $postcode;
    }

    fwrite(STDERR, "$fullNames:\n\t" . implode("\n\t", $ignored) . "\n\n");
    return '';
}

function _splitName(array $data, int $level): array
{
    $name = $data['name'];
    $pattern = '/^(?<type>(Huyện|Quận|Phường|Thành phố|Thị (trấn|xã)|Tỉnh|Xã))\s+(?<name>.+)$/i';
    if (preg_match($pattern, $name, $matches) !== 1) {
        return [$name];
    }

    return $matches + ['id' => $data["level{$level}_id"]];
}

function _verify(array $entities, string $foundName): bool
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
        fwrite(STDERR, "Using cached verification data for '$foundName'\n");
    }

    $data = @json_decode($json, true);
    if (!is_array($data)) {
        fwrite(STDERR, "Verification could not be done for '$foundName' json=$json\n");
        return false;
    }

    if (count($entities) !== count($data)) {
        return false;
    }

    for ($i = 0; $i < count($entities); $i++) {
        if ($entities[$i]['id'] !== $data[$i]['id']) {
            return false;
        }
    }

    return true;
}

main();
