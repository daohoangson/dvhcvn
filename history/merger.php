<?php declare(strict_types=1);

function main()
{
    $output = fromData();

    $mergedPath = __DIR__ . '/data/merged.json';
    if (file_exists($mergedPath)) {
        $old = json_decode(file_get_contents($mergedPath), true);
        mergeWith($output, $old);
    }

    echo(json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function fromData(): array
{
    $output = [];

    $data = json_decode(file_get_contents(__DIR__ . '/data/data.json'), true);
    foreach ($data as $level1) {
        $output[$level1['name']] = [];
        $level1Ref =& $output[$level1['name']];

        if (empty($level1['level2s'])) {
            continue;
        }
        foreach ($level1['level2s'] as $level2) {
            $level1Ref[$level2['name']] = [];
            $level2Ref =& $level1Ref[$level2['name']];

            if (empty($level2['level3s'])) {
                continue;
            }
            foreach ($level2['level3s'] as $level3) {
                $level2Ref[] = $level3['name'];
            }
        }
    }

    return $output;
}

function mergeWith(array &$output, array &$level1s): void
{
    foreach ($level1s as $level1Name => $level2s) {
        if (!isset($output[$level1Name])) {
            $output[$level1Name] = [];
        }
        $level1Ref =& $output[$level1Name];

        foreach ($level2s as $level2Name => $level3s) {
            if (!isset($level1Ref[$level2Name])) {
                $level1Ref[$level2Name] = [];
            }
            $level2Ref =& $level1Ref[$level2Name];

            foreach ($level3s as $level3Name) {
                if (!in_array($level3Name, $level2Ref, true)) {
                    $level2Ref[] = $level3Name;
                }
            }
        }
    }
}

main();
