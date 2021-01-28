<?php declare(strict_types=1);

function main(string $outDir)
{
    $stdin = file_get_contents('php://stdin');
    $full = json_decode($stdin, true);
    $level1Data = $full['data'];

    $level1sBbox = [];

    foreach ($level1Data as $level1) {
        $path = "$outDir/${level1['level1_id']}.json";
        $json = json_encode($level1, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents($path, $json);

        if (isset($level1['bbox'])) {
            $level1sBbox[$level1['level1_id']] = $level1['bbox'];
        }
    }

    file_put_contents(
        "$outDir/level1s_bbox.json",
        json_encode($level1sBbox, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
}

main($argv[1]);
