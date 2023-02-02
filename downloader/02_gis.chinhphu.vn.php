<?php declare(strict_types=1);

function main()
{
    $startTime = microtime(true);

    $indexHtml = _request();
    if (preg_match(
            '#<input name="__RequestVerificationToken" type="hidden" value="(.+)" />#',
            $indexHtml,
            $indexMatches
        ) !== 1) {
        fwrite(STDERR, "__RequestVerificationToken could not be extracted\n");
        return;
    }
    define('REQUEST_VERIFICATION_TOKEN', $indexMatches[1]);

    $stdin = file_get_contents('php://stdin');
    $full = json_decode($stdin, true);
    $level1Data = $full['data'];
    $level1Count = 0;
    $level2Count = 0;
    $level1GisCount = 0;
    $level2GisCount = 0;
    $data = [];

    foreach ($level1Data as $_level1) {
        $level1Count++;
        $level1 = [
            'level1_id' => $_level1['level1_id'],
            'name' => $_level1['name'],
            'level2s' => [],
        ];
        $level1Gis = _requestData($_level1['level1_id']);
        if (count($level1Gis) > 0) {
            $level1 += $level1Gis;
            $level1GisCount++;
        }

        foreach ($_level1['level2s'] as $_level2) {
            $level2Count++;

            $level2Gis = _requestData("{$_level1['level1_id']}{$_level2['level2_id']}");
            if ($level2Count % 10 === 0) {
                fwrite(STDERR, sprintf('%.1f%% ', $level1Count / count($level1Data) * 100));
            }

            if (count($level2Gis) > 0) {
                $level1['level2s'][] = [
                        'level2_id' => $_level2['level2_id'],
                        'name' => $_level2['name'],
                    ] + $level2Gis;

                $level2GisCount++;
            }
        }

        $data[] = $level1;
    }

    $output = [
        'data' => $data,
        'stdin_md5' => md5($stdin),
        'generate_date' => time(),
        'stats' => [
            'elapsed_time' => microtime(true) - $startTime,
            'level1_gis_count' => $level1GisCount,
            'level2_gis_count' => $level2GisCount,
        ],
    ];

    echo(json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function _requestData(string $areaCode): array
{
    $remap = [
        "34344" => "34334", // Tỉnh Thái Bình > Huyện Vũ Thư
        "86" => "85", // Tỉnh Vĩnh Long
        "86855" => "85855", // Thành phố Vĩnh Long
        "86857" => "85857", // Huyện Long Hồ
        "86858" => "85858", // Huyện Mang Thít
        "86859" => "85859", // Huyện  Vũng Liêm
        "86860" => "85860", // Huyện Tam Bình
        "86861" => "85861", // Thị xã Bình Minh
        "86862" => "85862", // Huyện Trà Ôn
        "86863" => "85863", // Huyện Bình Tân
    ];
    if (isset($remap[$areaCode])) {
        $originalAreaCode = $areaCode;
        $areaCode = $remap[$areaCode];
        fwrite(STDERR, "areaCode $originalAreaCode -> $areaCode\n");
    }

    $json = _request('Region/GetGeoJson', [
        'areaCode' => $areaCode,
        '__RequestVerificationToken' => REQUEST_VERIFICATION_TOKEN,
    ]);

    $data = @json_decode($json, true);
    if (!is_array($data) || !isset($data['json'])) {
        fwrite(STDERR, "Data could not be extracted for $areaCode (error=1, json=$json)\n");
        return [];
    }

    $data = @json_decode($data['json'], true);
    if (!is_array($data)) {
        fwrite(STDERR, "Data could not be extracted for $areaCode (error=2, json=$json)\n");
        return [];
    }

    return $data;
}

function _request(string $path = '', array $params = null): string
{
    static $cookies = [];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://gis.chinhphu.vn/$path");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);

    $cookie = '';
    foreach ($cookies as $cookieKey => $cookieValue) {
        $cookie .= "$cookieKey=$cookieValue; ";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Cookie: $cookie",
    ]);

    if ($params !== null) {
        $postFields = http_build_query($params);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        curl_setopt($ch, CURLOPT_POST, true);
    }

    $response = curl_exec($ch);

    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);

    curl_close($ch);

    foreach (explode("\n", $headers) as $header) {
        if (preg_match('#^Set-Cookie: ([^=]+)=([^;]+);#', $header, $headerMatches) !== 1) {
            continue;
        }

        $cookies[$headerMatches[1]] = $headerMatches[2];
    }

    return $body;
}

main();
