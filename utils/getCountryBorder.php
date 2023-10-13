<?php
if (isset($_GET['countryCode'])) {
    // Load the countryBorders.geo.json file
    $geoJsonFile = file_get_contents('countryBorders.geo.json');
    $geoData = json_decode($geoJsonFile, true);

    // Retrieve the selected country code
    $selectedCountryCode = strtoupper($_GET['countryCode']);

    // Search for the selected country's border
    $selectedCountryBorder = null;
    foreach ($geoData['features'] as $feature) {
        $countryCode = $feature['properties']['iso_a2'];
        if ($countryCode === $selectedCountryCode) {
            $selectedCountryBorder = $feature['geometry'];
            break;
        }
    }

    // Return the JSON response
    if ($selectedCountryBorder !== null) {
        header('Content-Type: application/json');
        echo json_encode($selectedCountryBorder);
    } else {
        // Handle the case when the country code is not found
        header('HTTP/1.1 404 Not Found');
        echo json_encode(['error' => 'Country code not found']);
    }
} else {
    // Handle missing or invalid parameters
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'Invalid parameters']);
}
?>
