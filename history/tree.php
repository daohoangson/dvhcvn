<?php declare(strict_types=1);

function main()
{
    $existing = [];
    $existingPath = __DIR__ . '/data/tree.json';
    if (file_exists($existingPath)) {
        $existing = json_decode(file_get_contents($existingPath), true);
        if (empty($existing)) {
            var_dump(json_last_error());
            var_dump(json_last_error_msg());
            exit;
        }
    }

    $data = json_decode(file_get_contents(__DIR__ . '/data/data.json'), true);
    $output = $existing;
    $paths = [];
    foreach ($data as $level1) {
        $level1Id = $level1['level1_id'];
        savePath($paths, $level1Id);

        if (!isset($output[$level1Id])) {
            $output[$level1Id] = [[], []];
        }
        $level1Ref =& $output[$level1Id];
        appendName($level1Ref[0], $level1['name']);

        if (empty($level1['level2s'])) {
            continue;
        }
        foreach ($level1['level2s'] as $level2) {
            $level2Id = $level2['level2_id'];
            savePath($paths, $level1Id, $level2Id);

            if (!isset($level1Ref[1][$level2Id])) {
                $level1Ref[1][$level2Id] = [[], []];
            }
            $level2Ref =& $level1Ref[1][$level2Id];
            appendName($level2Ref[0], $level2['name']);

            if (empty($level2['level3s'])) {
                continue;
            }
            foreach ($level2['level3s'] as $level3) {
                $level3Id = $level3['level3_id'];
                savePath($paths, $level1Id, $level2Id, $level3Id);

                if (!isset($level2Ref[1][$level3Id])) {
                    $level2Ref[1][$level3Id] = [[]];
                }
                $level3Ref =& $level2Ref[1][$level3Id];
                appendName($level3Ref[0], $level3['name']);
            }
        }
    }

    foreach ($existing as $level1Id => $level1Data) {
        updateOutputFromPath($output, $paths, $level1Data, $level1Id);

        foreach ($level1Data[1] as $level2Id => $level2Data) {
            updateOutputFromPath($output, $paths, $level2Data, $level1Id, $level2Id);

            foreach ($level2Data[1] as $level3Id => $level3Data) {
                updateOutputFromPath($output, $paths, $level3Data, $level1Id, $level2Id, $level3Id);
            }
        }
    }

    $json = json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    $json = preg_replace('/\[\s+("[^"]+")\s+\]/', '[$1]', $json);
    $json = preg_replace('/\[\s+(\[[^]]+\])\s+\]/', '[$1]', $json);

    echo($json);
}

function appendName(array &$namesRef, string $name): void
{
    $key = array_search($name, $namesRef, true);
    if ($key !== false) {
        unset($namesRef[$key]);
    }

    $namesRef[] = $name;
    $namesRef = array_values($namesRef);
}

function savePath(array &$pathsRef, $level1Id, $level2Id = null, $level3Id = null): void
{
    $paths = [];
    $key = $level1Id;
    if ($level2Id !== null) {
        $key = $level2Id;
        $paths[] = $level1Id;
    }
    if ($level3Id !== null) {
        $key = $level3Id;
        $paths[] = $level2Id;
    }
    $pathsStr = implode(',', $paths);

    if (!isset($pathsRef[$key])) {
        $pathsRef[$key] = [];
    }

    $pathsRef[$key][] = $pathsStr;
}

function updateOutputFromPath(
    array &$outputRef,
    array &$pathsRef,
    array &$existingData,
    $level1Id,
    $level2Id = null,
    $level3Id = null
): void {
    if (count($existingData) >= 3 && !empty($existingData[2])) {
        // already updated
        return;
    }

    $paths = [];
    $key = $level1Id;
    if ($level2Id !== null) {
        $key = $level2Id;
        $paths[] = $level1Id;
    }
    if ($level3Id !== null) {
        $key = $level3Id;
        $paths[] = $level2Id;
    }
    $pathsStr = implode(',', $paths);

    if (isset($pathsRef[$key]) && in_array($pathsStr, $pathsRef[$key], true)) {
        // no changes
        return;
    }

    $ref =& $outputRef;
    foreach ($paths as $step) {
        $ref =& $ref[$step][1];
    }
    if (!isset($ref[$key][1])) {
        $ref[$key][1] = [];
    }
    $ref[$key][2] = isset($pathsRef[$key]) ? 'Moved' : 'Deleted';
}

main();
