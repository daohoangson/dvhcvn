<?php declare(strict_types=1);

$array = [];

function main()
{
    global $array;

    $cwd = getcwd();
    $inDir = "$cwd/downloader/osm";
    $outDir = "$cwd/data/osm";
    $splittingFileName = 'splitting.json';
    $splittingPath = "$inDir/$splittingFileName";
    _dieOnAnyError();

    $parserDir = realpath("$cwd/demo/parser");
    if ($parserDir === false) {
        throw new RuntimeException("parser dir not found");
    }

    $splittingWrittenOsmIds = [];
    $splittingWrittenPaths = [];
    if (file_exists($splittingPath)) {
        $splitting = file_get_contents($splittingPath);
        if ($splitting !== false) {
            foreach (json_decode($splitting) as $key => $value) {
                $$key = $value;
            }
        }
    }

    // get all json files in this directory and sub
    $paths = glob("$inDir/{*,*/*,*/*/*}.json", GLOB_BRACE);
    $pathCount = 0;
    foreach ($paths as $path) {
        $pathCount++;
        if (basename($path) === $splittingFileName) continue;
        if (in_array($path, $splittingWrittenPaths, true)) {
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

    foreach ($array as $osmId => $item) {
        if (in_array($osmId, $splittingWrittenOsmIds, true)) {
            fwrite(STDOUT, 'w'); // already written
            continue;
        }

        $fullName = getFullName($item);
        if (strpos($fullName, ',') === false) {
            fwrite(STDOUT, 'n'); // bad name
            continue;
        }

        $response = json_decode(exec(sprintf(
            'cd %s && node bin/cli.js %s',
            escapeshellarg($parserDir),
            escapeshellarg($fullName)
        )), true);
        $output = $response['output'];
        if (count($output) == $item['level']) {
            writeJson($outDir, $item, $output);
            fwrite(STDOUT, '.');
            $splittingWrittenOsmIds[] = $osmId;
            $splittingWrittenPaths[] = $item['path'];
            continue;
        }

        $outputNames = [];
        foreach ($output as $outputItem) {
            $outputNames[] = $outputItem['name'];
        }
        fwrite(STDERR, sprintf("%s (level %d) -> %s\n", $fullName, $item['level'], join(', ', $outputNames)));
    }

    file_put_contents($splittingPath, json_encode(compact('splittingWrittenOsmIds', 'splittingWrittenPaths')));

    fwrite(STDOUT, sprintf("Written: %d / %d\n", count($splittingWrittenOsmIds), count($array)));
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

function writeJson(string $outDir, $item, $parsed)
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
