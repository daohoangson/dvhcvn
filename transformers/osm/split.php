<?php

declare(strict_types=1);

$array = [];
$statistics = [];

function main()
{
    global $array;

    $cwd = getcwd();
    $inDir = "$cwd/downloader/osm";
    $outDir = "$cwd/data/osm";
    $workingFileName = 'working.json';
    $workingFilePath = "$inDir/$workingFileName";
    _dieOnAnyError();

    $parserCliPath = realpath("$cwd/demo/parser/bin/cli");
    if ($parserCliPath === false) {
        throw new RuntimeException('parser dir not found');
    }

    $workingWrittenPaths = [];
    if (file_exists($workingFilePath)) {
        $workingData = file_get_contents($workingFilePath);
        if ($workingData !== false) {
            foreach (json_decode($workingData, true) as $key => $value) {
                $$key = $value;
            }
        }
    }

    // get all json files in this directory and sub
    $pathCount = 0;
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(realpath($inDir))) as $fileInfo) {
        $pathCount++;
        $path = $fileInfo->getPathName();
        if (substr($path, -5) !== '.json') continue;
        if (basename($path) === $workingFileName) continue;

        $item = json_decode(file_get_contents($path), true);
        $item['path'] = $path;

        $osmAdminLevel = $item['tags']['admin_level'] ?? '';
        $dvhcvnLevels = ['8' => 3, '6' => 2, '4' => 1];
        $dvhcvnLevel = $dvhcvnLevels[$osmAdminLevel] ?? null;
        if ($dvhcvnLevel === null) {
            fwrite(STDERR, sprintf("%s: unexpected admin level %s\n", $path, $osmAdminLevel));
            continue;
        }
        $item['level'] = $dvhcvnLevel;

        $array[$item['id']] = $item;
    }

    fwrite(STDOUT, sprintf("Paths: %d -> items: %d\n", $pathCount, count($array)));

    foreach ($array as $item) {
        if (isset($workingWrittenPaths[$item['path']])) {
            statisticsTrack($outDir, $workingWrittenPaths[$item['path']]);
            fwrite(STDOUT, 'w'); // already written
            continue;
        }

        $fullName = getFullName($item);
        if ((substr_count($fullName, ',') + 1) !== $item['level']) {
            fwrite(STDERR, sprintf("%s: bad name %s\n", $item['path'], $fullName));
            continue;
        }

        $response = json_decode(exec(sprintf(
            '%s %s',
            $parserCliPath,
            escapeshellarg($fullName)
        )), true);
        $output = $response['output'];
        if (count($output) == $item['level']) {
            $jsonFullPath = writeJson($outDir, $item, $output);
            $workingWrittenPaths[$item['path']] = $jsonFullPath;
            statisticsTrack($outDir, $jsonFullPath);
            file_put_contents($workingFilePath, json_encode(compact('workingWrittenPaths')));
            fwrite(STDOUT, '.');
            continue;
        }

        $outputNames = [];
        foreach ($output as $outputItem) {
            $outputNames[] = $outputItem['name'];
        }
        fwrite(STDERR, sprintf("%s: bad parse input=%s output=%s\n", $item['path'], $fullName, join(', ', $outputNames)));
    }

    statisticsPrint();
}

function getFullName($item): string
{
    global $array;

    $names = [];
    $tags = $item['tags'];

    $nameKeys = ['short_name', 'name:vi', 'name', 'name:en'];
    foreach ($nameKeys as $nameKey) {
        if (isset($tags[$nameKey])) {
            $names[] = $tags[$nameKey];
            break;
        }
    }
    if (empty($names)) {
        foreach ($tags as $tagKey => $tagValue) {
            if (substr($tagKey, 0, 5) === 'name:') {
                $names[] = $tagValue;
                break;
            }
        }
    }

    if (!empty($item['parent']) && !empty($array[$item['parent']])) {
        $parent = $array[$item['parent']];
        $names[] = getFullName($parent);
    }
    return join(', ', $names);
}

function statisticsPrint()
{
    global $statistics;

    $countsByLevel1Id = [];
    $countGlobal = ['expected' => 0, 'actual' => 0, 'level1' => 0, 'level2' => 0, 'level3' => 0];
    $cwd = getcwd();
    $dvhcvn = json_decode(file_get_contents("$cwd/data/dvhcvn.json"), true);
    foreach ($dvhcvn['data'] as $level1) {
        $level1Id = $level1['level1_id'];
        $countGlobal['expected']++;
        $countsByLevel1Id[$level1Id] = [
            'name' => $level1['name'],
            'expected' => 1,
            'actual' => 0,
            'percentage' => 0.0,
            'level1' => 0,
            'level2' => 0,
            'level3' => 0,
        ];

        $level1Statistics = $statistics[$level1Id] ?? [];
        if (!empty($level1Statistics['parsed'])) {
            $countGlobal['actual']++;
            $countGlobal['level1']++;
            $countsByLevel1Id[$level1Id]['actual']++;
            $countsByLevel1Id[$level1Id]['level1']++;
        }

        if (!empty($level1['level2s'])) {
            foreach ($level1['level2s'] as $level2) {
                $level2Id = $level2['level2_id'];
                $countGlobal['expected']++;
                $countsByLevel1Id[$level1Id]['expected']++;
                $level2Statistics = !empty($level1Statistics['level2s'][$level2Id]) ? $level1Statistics['level2s'][$level2Id] : [];
                if (!empty($level2Statistics['parsed'])) {
                    $countGlobal['actual']++;
                    $countGlobal['level2']++;
                    $countsByLevel1Id[$level1Id]['actual']++;
                    $countsByLevel1Id[$level1Id]['level2']++;
                }

                if (!empty($level2['level3s'])) {
                    foreach ($level2['level3s'] as $level3) {
                        $level3Id = $level3['level3_id'];
                        $countGlobal['expected']++;
                        $countsByLevel1Id[$level1Id]['expected']++;
                        $level3Statistics = !empty($level2Statistics['level3s'][$level3Id]) ? $level2Statistics['level3s'][$level3Id] : [];
                        if (!empty($level3Statistics['parsed'])) {
                            $countGlobal['actual']++;
                            $countGlobal['level3']++;
                            $countsByLevel1Id[$level1Id]['actual']++;
                            $countsByLevel1Id[$level1Id]['level3']++;
                        }
                    }
                }
            }
        }
    }

    foreach (array_keys($countsByLevel1Id) as $level1Id) {
        $countsByLevel1Id[$level1Id]['percentage'] = $countsByLevel1Id[$level1Id]['actual'] / $countsByLevel1Id[$level1Id]['expected'];
    }
    usort($countsByLevel1Id, function ($a, $b) {
        $result = $a['percentage'] <=> $b['percentage'];
        if ($result == 0) {
            $result = $a['expected'] <=> $b['expected'];
        }
        return $result;
    });
    foreach ($countsByLevel1Id as $count) {
        fwrite(STDOUT, sprintf("%s: %d+%d+%d of %d = %.2f%%\n", $count['name'], $count['level1'], $count['level2'], $count['level3'], $count['expected'], $count['percentage'] * 100));
    }
    fwrite(STDOUT, sprintf("Việt Nam: %d+%d+%d of %d = %.2f%%\n", $countGlobal['level1'], $countGlobal['level2'], $countGlobal['level3'], $countGlobal['expected'], $countGlobal['actual'] / $countGlobal['expected'] * 100));
}

function statisticsTrack(string $outDir, string $jsonFullPath)
{
    global $statistics;

    $jsonRelativePath = substr($jsonFullPath, strlen($outDir));
    if (!preg_match('/^\/([\d\/]+)\.json$/', $jsonRelativePath, $matches)) {
        fwrite(STDERR, sprintf("Unexpected json path: %s\n", $jsonFullPath));
        return;
    }
    $ids = explode('/', $matches[1]);
    $level1Id = '';
    $level2Id = '';

    if (count($ids) > 0) {
        $level1Id = $ids[0];
        if (count($ids) == 1) {
            $statistics[$level1Id]['parsed'] = true;
        }
    }
    if (count($ids) > 1) {
        $level2Id = $ids[1];
        if (count($ids) == 2) {
            $statistics[$level1Id]['level2s'][$level2Id]['parsed'] = true;
        }
    }
    if (count($ids) > 2) {
        $level3Id = $ids[2];
        if (count($ids) == 3) {
            $statistics[$level1Id]['level2s'][$level2Id]['level3s'][$level3Id]['parsed'] = true;
        }
    }
}

function writeJson(string $outDir, $item, $parsed): string
{
    $jsonPath = $outDir;
    foreach (array_reverse($parsed) as $outputItem) {
        $jsonPath = "$jsonPath/$outputItem[id]";
    }
    $jsonPath .= '.json';

    $jsonDir = dirname($jsonPath);
    if (!is_dir($jsonDir)) {
        mkdir($jsonDir, 0777, true);
    }

    $data = array_intersect_key($item, ['bbox' => true, 'coordinates' => true, 'type' => true]);
    $data['osm_id'] = $item['id'];
    $data[sprintf('level%d_id', count($parsed))] = $parsed[0]['id'];
    $data['name'] = $parsed[0]['name'];

    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents($jsonPath, $json);
    return $jsonPath;
}

function _dieOnAnyError()
{
    set_error_handler(
        function ($s, $m) {
            fwrite(STDERR, json_encode([$s, $m]));
            die(1);
        },
        E_ALL
    );
}

main();
