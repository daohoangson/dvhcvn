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
        if (!isset($output[$level1['name']])) {
            $output[$level1['name']] = [];
        }
        $level1Ref =& $output[$level1['name']];

        if (empty($level1['level2s'])) {
            continue;
        }
        foreach ($level1['level2s'] as $level2) {
            if (!isset($level1Ref[$level2['name']])) {
                $level1Ref[$level2['name']] = [];
            }
            $level2Ref =& $level1Ref[$level2['name']];

            if (empty($level2['level3s'])) {
                continue;
            }
            foreach ($level2['level3s'] as $level3) {
                if (!in_array($level3['name'], $level2Ref, true)) {
                    $level2Ref[] = $level3['name'];
                }
            }
        }
    }

    echo(json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

main();
