<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$executionStartTime = microtime(true);

if (isset($_REQUEST['action'])) {
    $action = $_REQUEST['action'];
    
    // Handle the currency_data/list API
    if ($action === '1') {
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt_array($ch, array(
            CURLOPT_URL => "https://api.apilayer.com/currency_data/list",
            CURLOPT_HTTPHEADER => array(
                "Content-Type: text/plain",
                "apikey: VGJ5Enmbn6bNRSJz4VAzp4v9GLr3zj8R"
            ),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "GET"
        ));

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
    }
    
    // Handle the exchangerates_data/latest API
    elseif ($action === '2') {
        $base = urlencode($_REQUEST['base']);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt_array($ch, array(
            CURLOPT_URL => "https://api.apilayer.com/exchangerates_data/latest?&base=$base",
            CURLOPT_HTTPHEADER => array(
                "Content-Type: text/plain",
                "apikey: VGJ5Enmbn6bNRSJz4VAzp4v9GLr3zj8R"
            ),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "GET"
        ));

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
    } else {
        $output['status']['code'] = "400";
        $output['status']['name'] = "Bad Request";
        $output['status']['description'] = "Invalid action parameter";
        $output['data'] = null;
    }
} else {
    $output['status']['code'] = "400";
    $output['status']['name'] = "Bad Request";
    $output['status']['description'] = "Action parameter is missing";
    $output['data'] = null;
}

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
