<?php declare(strict_types=1);

function main(string $outDir)
{
    $stdin = file_get_contents('php://stdin');
    $full = json_decode($stdin, true);
    $level1Data = $full['data'];

    foreach ($level1Data as $level1) {
        $path = "$outDir/${level1['level1_id']}.json";
        $json = json_encode($level1, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents($path, $json);
    }
}

main($argv[1]);
