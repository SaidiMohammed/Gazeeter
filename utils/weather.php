<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$executionStartTime = microtime(true);
$searchQuery = urlencode($_REQUEST['q']);

// Construct the API URL for the first request
$api1Url = "http://api.openweathermap.org/geo/1.0/direct?q=$searchQuery&limit=1&appid=4ee15b51171ccf80e71cb440289b55af";

$ch1 = curl_init();
curl_setopt($ch1, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch1, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch1, CURLOPT_URL, $api1Url);

$result1 = curl_exec($ch1);

if (curl_errno($ch1)) {
    $output['status']['code'] = "400";
    $output['status']['name'] = "Bad Request";
    $output['status']['description'] = "cURL Error: " . curl_error($ch1);
    $output['data'] = null;
} else {
    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";

    $data1 = json_decode($result1, true);

    if (!empty($data1)) {
        $lat = $data1[0]['lat'];
        $lon = $data1[0]['lon'];

        // Construct the API URL for the second request
        $api2Url = "https://api.openweathermap.org/data/2.5/onecall?lat=$lat&lon=$lon&units=imperial&appid=4ee15b51171ccf80e71cb440289b55af";

        $ch2 = curl_init();
        curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch2, CURLOPT_URL, $api2Url);

        $result2 = curl_exec($ch2);

        if (curl_errno($ch2)) {
            $output['status']['code'] = "400";
            $output['status']['name'] = "Bad Request";
            $output['status']['description'] = "cURL Error: " . curl_error($ch2);
            $output['data'] = null;
        } else {
            $data2 = json_decode($result2, true);
            $output['data'] = $data2;
        }

        curl_close($ch2);
    } else {
        $output['data'] = null;
    }

    $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
}

curl_close($ch1);

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);
?>
