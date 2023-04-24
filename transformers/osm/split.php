<?php declare(strict_types=1);

$array = [];

function main()
{
    global $array;

    $cwd = getcwd();
    $inDir = "$cwd/downloader/osm";
    $outDir = "$cwd/data/osm";
    $workingFileName = 'working.json';
    $workingFilePath = "$inDir/$workingFileName";
    _dieOnAnyError();

    $parserDir = realpath("$cwd/demo/parser");
    if ($parserDir === false) {
        throw new RuntimeException("parser dir not found");
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
    $paths = glob("$inDir/{*,*/*,*/*/*}.json", GLOB_BRACE);
    $pathCount = 0;
    foreach ($paths as $path) {
        $pathCount++;
        if (basename($path) === $workingFileName) continue;
        if (isset($workingWrittenPaths[$path])) {
            fwrite(STDOUT, 'w'); // already written
            continue;
        }

        $item = json_decode(file_get_contents($path), true);
        $item['path'] = $path;

        $osmAdminLevel = $item['tags']['admin_level'] ?? "";
        $dvhcvnLevels = ["8" => 3, "6" => 2, "4" => 1];
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
        $fullName = getFullName($item);
        if ((substr_count($fullName, ',') + 1) !== $item['level']) {
            fwrite(STDERR, sprintf("%s: bad name\n", $item['path']));
            continue;
        }

        $response = json_decode(exec(sprintf(
            'cd %s && node bin/cli.js %s',
            escapeshellarg($parserDir),
            escapeshellarg($fullName)
        )), true);
        $output = $response['output'];
        if (count($output) == $item['level']) {
            $workingWrittenPaths[$item['path']] = writeJson($outDir, $item, $output);
            fwrite(STDOUT, '.');
            continue;
        }

        $outputNames = [];
        foreach ($output as $outputItem) {
            $outputNames[] = $outputItem['name'];
        }
        fwrite(STDERR, sprintf("%s (level %d) -> %s\n", $fullName, $item['level'], join(', ', $outputNames)));
    }

    file_put_contents($workingFilePath, json_encode(compact('workingWrittenPaths')));

    fwrite(STDOUT, sprintf("Written: %d / %d\n", count($workingWrittenPaths), count($array)));
}

function getFullName($item): string
{
    global $array;
    $names = [$item["tags"]["name"]];
    if (!empty($item['parent']) && !empty($array[$item['parent']])) {
        $parent = $array[$item['parent']];
        $names[] = getFullName($parent);
    }
    return join(', ', $names);
}

function writeJson(string $outDir, $item, $parsed): string
{
    $jsonPath = $outDir;
    foreach (array_reverse($parsed) as $outputItem) {
        $jsonPath = "$jsonPath/$outputItem[id]";
    }
    $jsonPath .= ".json";

    $jsonDir = dirname($jsonPath);
    if (!is_dir($jsonDir)) {
        mkdir($jsonDir, 0777, true);
    }

    $data = array_intersect_key($item, ['bbox' => true, 'coordinates' => true, 'type' => true]);
    $data['osm_id'] = $item['id'];
    $data[sprintf("level%d_id", count($parsed))] = $parsed[0]["id"];
    $data['name'] = $item['tags']['name'];

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
