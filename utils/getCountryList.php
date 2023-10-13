<?php
// Load the countryBorders.geo.json file
$geoJsonFile = file_get_contents('countryBorders.geo.json');
$geoData = json_decode($geoJsonFile, true);

// Extract country codes and names
$countryList = [];
foreach ($geoData['features'] as $feature) {
    $countryCode = $feature['properties']['iso_a2'];
    $countryName = $feature['properties']['name'];
    $countryList[] = [
        'code' => $countryCode,
        'name' => $countryName,
    ];
}

// Return the JSON response
header('Content-Type: application/json');
echo json_encode($countryList);
?>
