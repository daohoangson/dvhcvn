<?php

declare(strict_types=1);

$array = [];
$statistics = [];

const KEY_STATISTICS_LEVEL2S = 'level2s';
const KEY_STATISTICS_LEVEL3S = 'level3s';
const KEY_STATISTICS_RELATION_ID = 'relationId';

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
            statisticsTrack($outDir, $item['path'], $workingWrittenPaths[$item['path']]);
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
            statisticsTrack($outDir, $item['path'], $jsonFullPath);
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

    statisticsPrint($outDir);
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

function statisticsCsvNormalize($str): string
{
    return trim(str_replace(',', '', $str));
}

function statisticsCsvResult($relationId): string
{
    return strlen($relationId) > 0 ? 'Success' : 'Failure';
}

function statisticsPrint(string $outDir)
{
    global $statistics;

    $countGlobal = ['expected' => 0, 'actual' => 0, 'level1' => 0, 'level2' => 0, 'level3' => 0];
    $countsByLevel1Id = [];
    $reports = [];
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
        $level1RelationId = $level1Statistics[KEY_STATISTICS_RELATION_ID] ?? '';
        if (strlen($level1RelationId) > 0) {
            $countGlobal['actual']++;
            $countGlobal['level1']++;
            $countsByLevel1Id[$level1Id]['actual']++;
            $countsByLevel1Id[$level1Id]['level1']++;
        }
        $reports[] = sprintf(
            '%s-000-00000,%s,,,%s,%s',
            statisticsCsvNormalize($level1['level1_id']),
            statisticsCsvNormalize($level1['name']),
            statisticsCsvNormalize($level1RelationId),
            statisticsCsvResult($level1RelationId)
        );

        if (!isset($level1['level2s'])) {
            continue;
        }
        foreach ($level1['level2s'] as $level2) {
            $level2Id = $level2['level2_id'];
            $countGlobal['expected']++;
            $countsByLevel1Id[$level1Id]['expected']++;
            $level2Statistics = $level1Statistics[KEY_STATISTICS_LEVEL2S][$level2Id] ?? [];
            $level2RelationId = $level2Statistics[KEY_STATISTICS_RELATION_ID] ?? '';
            if (strlen($level2RelationId) > 0) {
                $countGlobal['actual']++;
                $countGlobal['level2']++;
                $countsByLevel1Id[$level1Id]['actual']++;
                $countsByLevel1Id[$level1Id]['level2']++;
            }
            $reports[] = sprintf(
                '%s-%s-00000,,%s,,%s,%s',
                statisticsCsvNormalize($level1['level1_id']),
                statisticsCsvNormalize($level2['level2_id']),
                statisticsCsvNormalize($level2['name']),
                statisticsCsvNormalize($level2RelationId),
                statisticsCsvResult($level2RelationId)
            );

            if (!isset($level2['level3s'])) {
                continue;
            }
            foreach ($level2['level3s'] as $level3) {
                $level3Id = $level3['level3_id'];
                $countGlobal['expected']++;
                $countsByLevel1Id[$level1Id]['expected']++;
                $level3Statistics = $level2Statistics[KEY_STATISTICS_LEVEL3S][$level3Id] ?? [];
                $level3RelationId = $level3Statistics[KEY_STATISTICS_RELATION_ID] ?? '';
                if (strlen($level3RelationId) > 0) {
                    $countGlobal['actual']++;
                    $countGlobal['level3']++;
                    $countsByLevel1Id[$level1Id]['actual']++;
                    $countsByLevel1Id[$level1Id]['level3']++;
                }
                $reports[] = sprintf(
                    '%s-%s-%s,,,%s,%s,%s',
                    statisticsCsvNormalize($level1['level1_id']),
                    statisticsCsvNormalize($level2['level2_id']),
                    statisticsCsvNormalize($level3['level3_id']),
                    statisticsCsvNormalize($level3['name']),
                    statisticsCsvNormalize($level3RelationId),
                    statisticsCsvResult($level3RelationId)
                );
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

    file_put_contents("$outDir.csv", join("\n", $reports));
}

function statisticsTrack(string $outDir, $osmFullPath, string $jsonFullPath)
{
    global $statistics;

    $osmBaseName = basename($osmFullPath);
    if (!preg_match('/^(\d+)\.json$/', $osmBaseName, $relationIdMatches)) {
        fwrite(STDERR, sprintf("Unexpected OSM path: %s\n", $osmFullPath));
        return;
    }
    $relationId = $relationIdMatches[1];

    $jsonRelativePath = substr($jsonFullPath, strlen($outDir));
    if (!preg_match('/^\/([\d\/]+)\.json$/', $jsonRelativePath, $idMatches)) {
        fwrite(STDERR, sprintf("Unexpected json path: %s\n", $jsonFullPath));
        return;
    }
    $ids = explode('/', $idMatches[1]);
    $level1Id = '';
    $level2Id = '';

    if (count($ids) > 0) {
        $level1Id = $ids[0];
        if (count($ids) == 1) {
            $statistics[$level1Id][KEY_STATISTICS_RELATION_ID] = $relationId;
        }
    }
    if (count($ids) > 1) {
        $level2Id = $ids[1];
        if (count($ids) == 2) {
            $statistics[$level1Id][KEY_STATISTICS_LEVEL2S][$level2Id][KEY_STATISTICS_RELATION_ID] = $relationId;
        }
    }
    if (count($ids) > 2) {
        $level3Id = $ids[2];
        if (count($ids) == 3) {
            $statistics[$level1Id][KEY_STATISTICS_LEVEL2S][$level2Id][KEY_STATISTICS_LEVEL3S][$level3Id][KEY_STATISTICS_RELATION_ID] = $relationId;
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
