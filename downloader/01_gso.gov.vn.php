<?php declare(strict_types=1);

function main()
{
    $date = $GLOBALS['argv'][1];
    if (!is_string($date) || preg_match('#^\d{2}/\d{2}/\d{4}$#', $date) !== 1) {
        fwrite(STDERR, 'Required param: date');
        exit(1);
    }
    define('GSO_DATE', $date);

    $startTime = microtime(true);
    $level1Count = 0;
    $level2Count = 0;
    $level3Count = 0;

    $level1Data = getLevel1();
    $level2DataAll = getLevel2();
    foreach ($level1Data as &$level1) {
        $level1Count++;
        $level1Id = $level1['level1_id'];
        $level2Data = isset($level2DataAll[$level1Id]) ? $level2DataAll[$level1Id] : [];
        $level3DataAll = getLevel3($level1Id);

        foreach ($level2Data as &$level2) {
            $level2Count++;
            $level2Id = $level2['level2_id'];
            $level3Data = isset($level3DataAll[$level2Id]) ? $level3DataAll[$level2Id] : [];
            $level2['level3s'] = $level3Data;

            $level3Count += count($level3Data);

            if ($level2Count % 10 === 0) {
                fwrite(STDERR, sprintf('%.1f%% ', $level1Count / count($level1Data) * 100));
            }
        }

        $level1['level2s'] = $level2Data;
    }

    $output = [
        'data' => $level1Data,
        'data_date' => GSO_DATE,
        'generate_date' => time(),
        'stats' => [
            'elapsed_time' => microtime(true) - $startTime,
            'level1_count' => $level1Count,
            'level2_count' => $level2Count,
            'level3_count' => $level3Count,
        ],
    ];

    echo(json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function getLevel1(): array
{
    $rows = _request('DanhMucTinh');
    $data = [];

    /** @var SimpleXMLElement $row */
    foreach ($rows as $row) {
        $data[] = [
            'level1_id' => strval($row->MaTinh),
            'name' => strval($row->TenTinh),
            'type' => strval($row->LoaiHinh),
        ];
    }

    return $data;
}

function getLevel2(): array
{
    $rows = _request('DanhMucQuanHuyen');
    $data = [];

    /** @var SimpleXMLElement $row */
    foreach ($rows as $row) {
        $data[strval($row->MaTinh)][] = [
            'level2_id' => strval($row->MaQuanHuyen),
            'name' => strval($row->TenQuanHuyen),
            'type' => strval($row->LoaiHinh),
        ];
    }

    return $data;
}

function getLevel3(string $level1Id): array
{
    $rows = _request('DanhMucPhuongXa', ['Tinh' => $level1Id]);
    $data = [];

    /** @var SimpleXMLElement $row */
    foreach ($rows as $row) {
        $data[strval($row->MaQuanHuyen)][] = [
            'level3_id' => strval($row->MaPhuongXa),
            'name' => strval($row->TenPhuongXa),
            'type' => strval($row->LoaiHinh),
        ];
    }

    return $data;
}

function _request($soapAction, array $params = []): array
{
    $stderrPrefix = sprintf('%s(%s): ', $soapAction, join(', ', $params));
    $onError = function (string $message) use ($stderrPrefix) {
        fwrite(STDERR, $stderrPrefix . $message . "\n");
        return [];
    };

    $soapBody = '';
    $params['DenNgay'] = GSO_DATE;
    foreach ($params as $paramKey => $paramValue) {
        $soapBody .= "<$paramKey>$paramValue</$paramKey>";
    }
    $xmlRequest = <<<EOF
<?xml version="1.0" encoding="utf-8"?>    
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <$soapAction xmlns="http://tempuri.org/">     
      $soapBody
    </$soapAction>
  </soap:Body>                           
</soap:Envelope>
EOF;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://danhmuchanhchinh.gso.gov.vn/DMDVHC.asmx');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $xmlRequest);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'SOAPAction: "http://tempuri.org/' . $soapAction . '"',
        "Content-type: text/xml",
        "Content-length: " . strlen($xmlRequest),
    ]);

    $xmlResponse = curl_exec($ch);
    curl_close($ch);

    $xmlTree = simplexml_load_string($xmlResponse);
    $soapBody = $xmlTree->children('soap', true)->Body;
    if (empty($soapBody)) {
        return $onError('No SOAP body');
    }

    $resultKey = $soapAction . 'Result';
    $result = $soapBody->children()[0]->$resultKey;
    if (empty($result)) {
        return $onError("No $resultKey");
    }

    $diffgram = $result->children('diffgr', true)->diffgram->children()[0];
    if (empty($diffgram)) {
        return $onError('No diffgram');
    }

    $rows = $diffgram->xpath('TABLE');
    if (empty($rows)) {
        return $onError('No TABLE');
    }

    return $rows;
}

main();
