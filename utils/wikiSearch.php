<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$executionStartTime = microtime(true);

$placeName = urlencode($_REQUEST['q']);
$lang = isset($_REQUEST['lang']) ? $_REQUEST['lang'] : 'en'; // Default to English
$username = 'skyfall627';

// Construct the API URL
$url = "http://api.geonames.org/wikipediaSearchJSON?q=$placeName&lang=$lang&username=$username";

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    // There was an error in the cURL request
    $output['status']['code'] = "400";
    $output['status']['name'] = "Bad Request";
    $output['status']['description'] = "cURL Error: " . curl_error($ch);
    $output['data'] = null;
} else {
    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
    $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
    $output['data'] = json_decode($result, true)['geonames'];
}

curl_close($ch);

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);

?>
