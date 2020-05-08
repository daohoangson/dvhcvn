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

    foreach ($level1Data as $_level1) {
        $level1Count++;
        $level1Postcode = _request($_level1['name']);
        if ($level1Postcode > 0) {
            $level1PostcodeCount++;
        }

        $level1 = [
            'level1_id' => $_level1['level1_id'],
            'name' => $_level1['name'],
            'postcode' => $level1Postcode,
            'level2s' => [],
        ];

        foreach ($_level1['level2s'] as $_level2) {
            $level2Count++;
            $level2Postcode = _request("{$_level2['name']} {$_level1['name']}");
            if ($level2Postcode > 0) {
                $level2PostcodeCount++;
            }

            $level2 = [
                'level2_id' => $_level2['level2_id'],
                'name' => $_level2['name'],
                'postcode' => $level2Postcode,
                'level3s' => [],
            ];

            foreach ($_level2['level3s'] as $_level3) {
                $level3Count++;
                $level3Postcode = _request("{$_level3['name']} {$_level2['name']} {$_level1['name']}");
                if ($level3Postcode > 0) {
                    $level3PostcodeCount++;
                }

                $level2['level3s'][] = [
                    'level3_id' => $_level3['level3_id'],
                    'name' => $_level3['name'],
                    'postcode' => $level3Postcode,
                ];

                if ($level3Count % 10 === 0) {
                    fwrite(STDERR, sprintf('%.1f%% ', $level3Count / $level3FullCount * 100));
                }
            }

            $level1['level2s'][] = $level2;
        }

        $data[] = $level1;
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

function _request($textSearch)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://mabuuchinh.vn/API/serviceApi/v1/MBC');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);


    $transliterator = Transliterator::createFromRules(
        ':: Any-Latin; :: Latin-ASCII; :: NFD; :: [:Nonspacing Mark:] Remove; :: Lower(); :: NFC;',
        Transliterator::FORWARD
    );
    $textSearchSafe = $transliterator->transliterate($textSearch);
    $postFields = http_build_query(['textsearch' => substr($textSearchSafe, 0, 45)]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_POST, true);

    $json = curl_exec($ch);
    curl_close($ch);

    $data = @json_decode($json, true);
    if (!is_array($data)) {
        fwrite(STDERR, "Data could not be extracted for $textSearch (error=1, json=$json)\n");
        return 0;
    }

    foreach ($data as $found) {
        if (!is_array($found) || !isset($found['name'])) {
            continue;
        }

        $nameSafe = $transliterator->transliterate($found['name']);
        if (preg_match('/^([\d-]+) - ' . preg_quote($textSearchSafe, '/') . '$/', $nameSafe, $matches) !== 1) {
            continue;
        }

        return is_numeric($matches[1]) ? intval($matches[1]) : $matches[1];
    }

    return 0;
}

main();
