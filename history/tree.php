<?php declare(strict_types=1);

function main()
{
    $output = [];

    $existingPath = __DIR__ . '/data/tree.json';
    if (file_exists($existingPath)) {
        $output = json_decode(file_get_contents($existingPath), true);
    }

    $data = json_decode(file_get_contents(__DIR__ . '/data/data.json'), true);
    foreach ($data as $level1) {
        if (!isset($output[$level1['level1_id']])) {
            $output[$level1['level1_id']] = [[], []];
        }
        $level1Ref =& $output[$level1['level1_id']];
        if (!in_array($level1['name'], $level1Ref[0], true)) {
            $level1Ref[0][] = $level1['name'];
        }

        if (empty($level1['level2s'])) {
            continue;
        }
        foreach ($level1['level2s'] as $level2) {
            if (!isset($level1Ref[1][$level2['level2_id']])) {
                $level1Ref[1][$level2['level2_id']] = [[], []];
            }
            $level2Ref =& $level1Ref[1][$level2['level2_id']];
            if (!in_array($level2['name'], $level2Ref[0], true)) {
                $level2Ref[0][] = $level2['name'];
            }

            if (empty($level2['level3s'])) {
                continue;
            }
            foreach ($level2['level3s'] as $level3) {
                if (!isset($level2Ref[1][$level3['level3_id']])) {
                    $level2Ref[1][$level3['level3_id']] = [[]];
                }
                $level3Ref =& $level2Ref[1][$level3['level3_id']];
                if (!in_array($level3['name'], $level3Ref[0], true)) {
                    $level3Ref[0][] = $level3['name'];
                }
            }
        }
    }

    $json = json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    $json = preg_replace('/\[\s+("[^"]+")\s+\]/', '[$1]', $json);
    $json = preg_replace('/\[\s+(\[[^]]+\])\s+\]/', '[$1]', $json);

    echo($json);
}

main();
