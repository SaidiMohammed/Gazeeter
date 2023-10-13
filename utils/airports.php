<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$executionStartTime = microtime(true);
$username = "skyfall627";
$CC = urlencode($_REQUEST['country']);

// Construct the API URL
$url = "http://api.geonames.org/searchJSON?featureCode=AIRP&country=$CC&username=$username";

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    $output['status']['code'] = "400";
    $output['status']['name'] = "Bad Request";
    $output['status']['description'] = "cURL Error: " . curl_error($ch);
    $output['data'] = null;
} else {
    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
    $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
    $output['data'] = json_decode($result, true);
}

curl_close($ch);

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);

?>
