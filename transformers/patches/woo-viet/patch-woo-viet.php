<?php declare(strict_types=1);

function main()
{
    $stdin = file_get_contents('php://stdin');
    $sorted = json_decode($stdin, true);

    $repoCities = getRepoCities();
    $cities = [];
    $output = [];
    foreach ($sorted as $level1) {
        $key = preg_replace('/[^A-Z]+/', '-', strtoupper($level1[3]));
        $key18 = str_pad(var_export($key, true), 18);
        $output[] = "			$key18=> array(";

        $districts = [];
        foreach ($level1[4] as $level2) {
            $district = "{$level2[2]} {$level2[1]}";
            $districts[] = $district;

            $districtQuoted = var_export($district, true);
            $output[] = "				$districtQuoted,";
        }

        $output[] = "			),";

        $cities[$key] = $districts;
    }

    compareCities($repoCities, $cities);

    echo(implode("\n", $output));
}

function compareCities(array $old, array $new)
{
    ksort($old);
    ksort($new);

    $keys = array_unique(array_merge(array_keys($old), array_keys($new)));

    foreach ($keys as $key) {
        $oldValues = isset($old[$key]) ? $old[$key] : [];
        $newValues = isset($new[$key]) ? $new[$key] : [];

        $removes = array_diff($oldValues, $newValues);
        $adds = array_diff($newValues, $oldValues);
        if (count($removes) === 0 && count($adds) === 0) {
            continue;
        }

        fwrite(STDERR, "$key:\n");
        foreach ($removes as $remove) {
            fwrite(STDERR, "-$remove\n");
        }
        foreach ($adds as $add) {
            fwrite(STDERR, "+$add\n");
        }
        fwrite(STDERR, "\n");
    }
}

function getRepoCities(): array
{
    $repoContents = file_get_contents('https://raw.githubusercontent.com/htdat/woo-viet/master/inc/class-wooviet-cities.php');
    $repoContents = preg_replace('/^<\?php/', '', $repoContents);
    $repoContents = str_replace('public function add_cities', 'public static function add_cities', $repoContents);

    define('ABSPATH', '/tmp');
    eval($repoContents);

    $cities = call_user_func(['WooViet_Cities', 'add_cities'], []);
    return $cities['VN'];
}

main();
