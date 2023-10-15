document.addEventListener("DOMContentLoaded", function () {
  showLoader();
  // Define the map layers (Streets and Satellite)
  let night = L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    }
  );

  let light = L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    }
  );

  let satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }
  );

  // Create a map and set the default view
  let map = L.map("map", {
    layers: [light],
    maxBounds: [
      [-85.06, -180],
      [85.06, 180],
    ],
    minZoom: 3,
    maxZoom: 10,
  });

  // Define layer groups for airports and cities
  const airportIcon = L.ExtraMarkers.icon({
    prefix: "fa",
    icon: "fa-plane",
    iconColor: "black",
    markerColor: "white",
    shape: "circle",
  });

  let airportsLayerGroup = L.markerClusterGroup({
    polygonOptions: {
      fillColor: "#fff",
      color: "#000",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.5,
    },
  }).addTo(map);

  const cityIcon = L.ExtraMarkers.icon({
    prefix: "fa",
    icon: "fa-city",
    markerColor: "green",
    shape: "penta",
  });

  let citiesLayerGroup = L.markerClusterGroup({
    polygonOptions: {
      fillColor: "#fff",
      color: "#000",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.5,
    },
  }).addTo(map);

  // Add basemap control
  let basemaps = {
    "Night Mode": night,
    "Light Mode": light,
    Satellite: satellite,
  };

  // Create a layer control to manage all marker groups
let markerLayers = {
  "Airports": airportsLayerGroup,
  "Cities": citiesLayerGroup,
};

L.control.layers(basemaps, markerLayers).addTo(map);

  // Default styles for map
  const DEFAULT_STYLE = {
    fillColor: "transparent",
    color: "transparent",
  };

  // Hover styles for map
  const SELECT_STYLE = {
    fillColor: "lightgreen",
    color: "darkgreen",
  };

  let selectedCountryLayer = null; // Store the selected country layer

  function highlighter(countryCode) {
    // Make an AJAX request to get the country border by code
    $.ajax({
      url: "./utils/getCountryBorder.php",
      method: "GET",
      data: { countryCode: countryCode },
      success: function (borderData) {
        if (borderData) {
          // Create a GeoJSON layer for the selected country border
          selectedCountryLayer = L.geoJSON(borderData, {
            style: SELECT_STYLE,
          }).addTo(map);
        }
      },
      error: function () {
        console.error("Error fetching country border data.");
      },
    });
  }

  function handleCountryClick(event) {
    const selectedCountryCode = this.value;
    const selectedCountryName = this.options[this.selectedIndex].text;

    // Clear previous airport and city markers
    airportsLayerGroup.clearLayers();
    citiesLayerGroup.clearLayers();

    // Remove highlight from the previously selected country, if any
    if (selectedCountryLayer) {
      selectedCountryLayer.setStyle(DEFAULT_STYLE);
    }

    // Call the search functions with the selected country code
    getCapitalCity(selectedCountryCode);
    searchLocation(selectedCountryName);
    searchWikipedia(selectedCountryName);
    highlighter(selectedCountryCode);
    atAGlance();
  }

  // Attach click event listener to the country select element
  document
    .getElementById("countrySelect")
    .addEventListener("change", handleCountryClick);

  // Function to initialize the map with the user's location
  function initializeMapWithUserLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function (position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Use reverseGeo.php API to get the user's country code
        $.ajax({
          url: "./utils/reverseGeo.php",
          method: "GET",
          data: { lat: userLat, lng: userLng },
          success: function (data) {
            if (data) {
              // Use the obtained country code to set the selected country in the dropdown
              const selectElement = document.getElementById("countrySelect");
              for (let i = 0; i < selectElement.options.length; i++) {
                if (selectElement.options[i].value === data.data.countryCode) {
                  selectElement.selectedIndex = i;
                  break;
                }
              }

              // Trigger the change event to update the map and other data
              $(selectElement).change();
              searchLocation(data.data.countryName);
              searchWikipedia(data.data.countryName);
              getCapitalCity(data.data.countryCode);
              highlighter(data.data.countryCode);

              map.eachLayer((layer) => {
                if (
                  layer.feature &&
                  layer.feature.properties.name === data.data.countryName
                ) {
                  // Highlight the selected country
                  layer.setStyle(SELECT_STYLE);

                  // Store the selected country layer
                  selectedCountryLayer = layer;
                }
              });
            }
          },
          error: function () {
            console.error("Error fetching user's country code.");
          },
        });

        // Set the user's location as the map's initial coordinates
        map.setView([userLat, userLng], 6);
      });
    } else {
      console.error("Geolocation is not supported in this browser.");
    }
  }

  // Call the function to initialize the map with the user's location
  initializeMapWithUserLocation();

  // Function to populate the select element with country names
  function populateCountrySelect(data) {
    let selectElement = document.getElementById("countrySelect");

    // Clear existing options
    selectElement.innerHTML = "";

    // Add the sorted country names to the select element
    data.forEach(function (country) {
      let option = document.createElement("option");
      option.value = country.code;
      option.text = country.name;
      selectElement.appendChild(option);
    });

    // Sort the options alphabetically
    selectElement.innerHTML = [...selectElement.options]
      .sort(function (a, b) {
        return a.text.localeCompare(b.text);
      })
      .map((option) => option.outerHTML)
      .join("");

    // Trigger the change event to update the map and other data
    $(selectElement).change();
  }

  // Load and parse the countryList.php file
  $.getJSON("./utils/getCountryList.php", function (data) {
    // Populate the select element with country codes and names
    populateCountrySelect(data);
  });

  // Initialize modal content when the page loads
  function initializeModalContent() {
    // Overview Modal
    $("#placeName").text("");
    $("#latitude").text("");
    $("#longitude").text("");

    // Wikipedia Modal
    $("#wikipediaTitle").text("");
    $("#wikipediaImage").html("");
    $("#wikipediaLatitude").text("");
    $("#wikipediaLongitude").text("");
    $("#wikipediaSummary").text("");
  }

  initializeModalContent();

  // Function to make an AJAX request to fetch location details based on the selected country and city
  function searchLocation(query) {
    $.ajax({
      url: "./utils/search.php",
      method: "GET",
      data: { q: query },
      success: function (data) {
        if (data.status.code === "200" && data.data.results.length > 0) {
          const results = data.data.results[0];

          const currencyName = results.annotations.currency.name;
          const currencyCode = results.annotations.currency.symbol;
          const countryCode = results.components.country_code;

          handleCountryData(countryCode);

          let latitude = results.geometry.lat.toFixed(2);
          let longitude = results.geometry.lng.toFixed(2);

          moveMapToLocation(latitude, longitude, 6);

          $("#placeName").text(results.formatted);
          $("#latitude").text(latitude);
          $("#longitude").text(longitude);

          // Extract and display Continent, Currency, and Timezone from the JSON data
          $("#continent").text(results.components.continent);
          $("#currency").text(currencyName + " (" + currencyCode + ")");
          $("#timezone").text(results.annotations.timezone.name);
        } else {
          $("#placeName").text("No results found.");
          $("#latitude").text("");
          $("#longitude").text("");
          $("#continent").text("");
          $("#currency").text("");
          $("#timezone").text("");
          $("#overviewModal").modal("show");
        }
      },
      error: function () {
        $("#placeName").text("An error occurred while fetching data.");
        $("#latitude").text("");
        $("#longitude").text("");
        $("#continent").text("");
        $("#currency").text("");
        $("#timezone").text("");
        $("#overviewModal").modal("show");
      },
    });
  }

  // Function to handle country data and trigger related searches
  function handleCountryData(countryCode) {
    getHolidays(countryCode);
    searchCities(countryCode);
    searchAirports(countryCode);
    getNews(countryCode);
  }

  // Function to move the map to a specific location
  function moveMapToLocation(latitude, longitude, zoomLevel) {
    map.setView([latitude, longitude], zoomLevel);
  }

  // Function to make an AJAX request to the Wikipedia API
  function searchWikipedia(query) {
    $.ajax({
      url: "./utils/wikiSearch.php",
      method: "GET",
      data: { q: query },
      success: function (data) {
        if (data.status.code === "200" && data.data.length > 0) {
          const result = data.data.find((item) => item.title === query); // Find the item with matching title

          if (result) {
            $("#wikipediaTitle").html(
              '<p> <a href="https://' +
                result.wikipediaUrl +
                '" target="_blank">' +
                result.title +
                "</a>" +
                " (" +
                result.lat.toFixed(2) +
                ", " +
                result.lng.toFixed(2) +
                ")" +
                "</p>"
            );
            $("#wikipediaImage").html(
              '<img src="' +
                result.thumbnailImg +
                '" alt="' +
                result.title +
                '" />'
            );
            $("#wikipediaSummary").text(result.summary);
          } else {
            $("#wikipediaTitle").text("No results found.");
            $("#wikipediaImage").html("");
            $("#wikipediaLatitude").text("");
            $("#wikipediaLongitude").text("");
            $("#wikipediaSummary").text("");
            $("#wikipediaModal").modal("show");
          }
        } else {
          $("#wikipediaTitle").text("No results found.");
          $("#wikipediaImage").html("");
          $("#wikipediaLatitude").text("");
          $("#wikipediaLongitude").text("");
          $("#wikipediaSummary").text("");
          $("#wikipediaModal").modal("show");
        }
      },
      error: function () {
        $("#wikipediaTitle").text("An error occurred while fetching data.");
        $("#wikipediaImage").html("");
        $("#wikipediaLatitude").text("");
        $("#wikipediaLongitude").text("");
        $("#wikipediaSummary").text("");
        $("#wikipediaModal").modal("show");
      },
    });
  }

  // Function to make an AJAX request to fetch cities based on the selected country
function searchCities(countryCode) {
  $.ajax({
    url: "./utils/cities.php",
    method: "GET",
    data: { country: countryCode },
    success: function (data) {
      if (data.status.code === "200" && data.data.geonames.length > 0) {
        // Handle the data from the cities API response
        createCityMarkers(data.data.geonames, countryCode); // Pass countryCode to createCityMarkers
      } else {
        alert("No cities found for this country.");
      }
    },
    error: function () {
      console.error("An error occurred while fetching cities data.");
    },
  });
}

// Function to make an AJAX request to fetch airports based on the selected country and city
function searchAirports(countryCode) {
  $.ajax({
    url: "./utils/airports.php",
    method: "GET",
    data: { country: countryCode },
    success: function (data) {
      if (data.status.code === "200" && data.data.geonames.length > 0) {
        // Create a marker cluster for airports
        let airportCluster = L.markerClusterGroup();
        // Handle the data from the airports API response
        createAirportMarkers(data.data.geonames, airportCluster);
      } else {
        alert("No airports found for this country and query.");
      }
    },
    error: function () {
      console.error("An error occurred while fetching airports data.");
    },
  });
}

// Use the custom icons when creating markers
function createAirportMarkers(airports, markerCluster) {
  airports.forEach(function (airport) {
    let airportMarker = L.marker([airport.lat, airport.lng], {
      icon: airportIcon,
    });

    airportMarker.bindPopup(airport.name);
    // Add the marker to the marker cluster
    markerCluster.addLayer(airportMarker);
  });

  // Add the marker cluster to the airportsLayerGroup
  airportsLayerGroup.addLayer(markerCluster);

  // Zoom in when clicking on a marker in the cluster
  markerCluster.on("clusterclick", function (event) {
    map.fitBounds(event.layer.getBounds(), { padding: [50, 50] }); // Adjust the padding as needed
  });
}

// Function to create city markers
function createCityMarkers(cities, countryCode) {
  let cityMarkers = [];
  cities.forEach(function (city) {
    let cityMarker = L.marker([city.lat, city.lng], {
      icon: cityIcon,
    });

    // Add the marker to the marker cluster
    cityMarkers.push(cityMarker);
    cityMarker.bindPopup(city.name);
  });

  // Add the marker cluster to the citiesLayerGroup
  citiesLayerGroup.addLayer(L.layerGroup(cityMarkers));

  // Add a click event handler to zoom in when clicking on a marker
  cityMarkers.forEach(function (marker) {
    marker.on("click", function () {
      map.setView(marker.getLatLng(), 10); // Adjust the zoom level as needed
    });
  });
}

  // Add an event listener for the "Search" button in the weather modal
  document
    .getElementById("search-button")
    .addEventListener("click", function () {
      // Get the query from the input field
      const query = document.getElementById("search-input").value;

      // Call the getWeather function with the query
      getWeather(query);
    });

  // Function to fetch the capital city of a country using an API
  function getCapitalCity(countryCode) {
    $.ajax({
      url: "./utils/country.php",
      method: "GET",
      data: { country: countryCode },
      success: function (data) {
        if (data.status.code === "200" && data.data) {
          const capitalCity = data.data.country.capital;
          const population = numeral(data.data.country.population).format(
            "0,0"
          );
          const area = numeral(data.data.country.areaInSqKm).format("0,0");
          const countryCode = data.data.country.countryCode;

          $("#population").text(population);
          $("#area").text(area);
          $("#countryCode").text(countryCode);
          $("#capital").text(capitalCity);

          // Use the obtained capital city as the parameter for getWeather
          getWeather(capitalCity);
        } else {
          console.error("Error fetching capital city.");
        }
      },
      error: function () {
        console.error("Error fetching API.");
      },
    });
  }

  // Function to get the day of the week
  function getDayOfWeek(date) {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return daysOfWeek[date.getDay()];
  }

// Function to make an AJAX request to the Weather API
function getWeather(query) {
  $("#weatherModal .widget-main").empty();
  $("#weatherModal .widget-row").empty();
  showLoader();
  $.ajax({
    url: "./utils/weather.php",
    method: "GET",
    data: { q: query, daily: true }, // Add a parameter to request daily data
    success: function (data) {
      if (data.status.code === "200" && data.data) {
        // Extract daily weather data
        let dailyWeather = data.data.daily;

        // Function to display weather data for a specific day in a widget
        function displayWeatherInWidget(dayData, widget) {
          let date = new Date(dayData.dt * 1000);
          let formattedDate = getDayOfWeek(date);

          // Create a container for the widget with a border
          const widgetContainer = $("<div>").addClass("widget-container");

          // Update the widget content with data for the selected day
          widgetContainer.append($("<h2>").text(formattedDate));
          widgetContainer.append($("<h4>").text(query.replace(/\b\w/g, (x) => x.toUpperCase())));
          widgetContainer.append($("<div>").addClass("weather-emoji").text(getWeatherEmoji(dayData.weather[0].main)));
          widgetContainer.append($("<strong>").append($("<h4>").text(`${convertToFahrenheit(dayData.temp.day)} °C / ${dayData.temp.day.toFixed(0)} F°`)));
          widgetContainer.append($("<p>").text(dayData.weather[0].description.replace(/\b\w/g, (x) => x.toUpperCase())));

          // Append the widget container to the main widget
          widget.append(widgetContainer);
        }

        const convertToFahrenheit = (fahrenheit) => {
          return ((fahrenheit - 32) / 1.8).toFixed(0);
        };

        // Function to get weather emoji based on condition
        const getWeatherEmoji = (condition) => {
          switch (condition) {
            case "Clouds":
              return "☁️";
            case "Clear":
              return "☀️";
            case "Rain":
              return "🌧️";
            case "Snow":
              return "❄️";
            default:
              return "";
          }
        };

        // Function to populate additional widgets
        function populateAdditionalWidgets() {
          const widgetRow = $("#weatherModal .widget-row");

          for (let i = 1; i < dailyWeather.length; i++) {
            const dayData = dailyWeather[i];
            const widget = createAdditionalWidget(dayData);
            widgetRow.append(widget);
          }
        }

        // Function to create an additional widget for a specific day
        function createAdditionalWidget(dayData) {
          // Create a container for the additional widget with a border
          const widget = $("<div>").addClass("additional-widget");

          const formattedDate = getDayOfWeek(new Date(dayData.dt * 1000));

          // Add day, emoji, and temperature to the widget
          widget.append($("<h6>").addClass("day").text(formattedDate));
          widget.append($("<div>").addClass("emoji").text(getWeatherEmoji(dayData.weather[0].main)));
          widget.append($("<h6>").addClass("temperature").text(`${convertToFahrenheit(dayData.temp.day)} °C / ${dayData.temp.day.toFixed(0)} F°`));
          widget.append($("<p>").text(dayData.weather[0].description.replace(/\b\w/g, (x) => x.toUpperCase())));

          return widget;
        }

        // Modify the main widget
        displayWeatherInWidget(dailyWeather[0], $("#weatherModal .widget-main"));

        // Populate additional widgets
        populateAdditionalWidgets();
      } else {
        $("#currentTemperature").text("No results found.");
        $("#weatherMain").text("");
        $("#weatherDescription").text("");
        $("#humidity").text("");
        $("#weatherEmoji").text("");
        $("#sunrise").text("");
        $("#sunset").text("");
        $("#weatherModal").modal("show");
      }
    },
    error: function () {
      $("#currentTemperature").text("An error occurred while fetching data.");
      $("#weatherMain").text("");
      $("#weatherDescription").text("");
      $("#humidity").text("");
      $("#weatherEmoji").text("");
      $("#sunriseTime").text("");
      $("#sunsetTime").text("");
      $("#weatherModal").modal("show");
    },
  });
}


  // Function to make an AJAX request to fetch holidays based on the selected country code
function getHolidays(countryCode) {
  $.ajax({
    url: "./utils/holidays.php",
    method: "GET",
    data: { countryCode: countryCode },
    success: function (data) {
      if (data.status.code === "200" && data.data !== null) {
        const holidays = data.data;
        const uniqueDates = new Set();
        const uniqueHolidays = [];

        // Clear existing holiday data
        $("#holidaysTable").empty();

        // Create a table for holidays
        const table = $("<table>").addClass("table table-striped");
        const tbody = $("<tbody>");

        // Filter out holidays with duplicate dates
        holidays.forEach(function (holiday) {
          const date = new Date(holiday.date);

          // Format the date as "Monday 16th June 2017" using dateJS
          const formattedDate = date.toString("dddd dS MMMM yyyy");

          if (!uniqueDates.has(formattedDate)) {
            uniqueDates.add(formattedDate);
            uniqueHolidays.push(holiday);
          }
        });

        // Iterate through unique holidays and append them to the table
        uniqueHolidays.forEach(function (holiday) {
          // Parse the date string
          const holidayDate = new Date(holiday.date);

          // Format the date as "Monday 16th June 2017" using dateJS
          const formattedDate = holidayDate.toString("dddd dS MMMM yyyy");

          // Create a table row
          const row = $("<tr>");
          const dateCell = $("<td>").text(formattedDate);
          const holidayCell = $("<td>").text(holiday.localName + " (" + holiday.name + ")");
          
          // Append cells to the row
          row.append(dateCell);
          row.append(holidayCell);

          // Append the row to the table body
          tbody.append(row);
        });

        // Append the table body to the table
        table.append(tbody);

        // Append the table to the modal body
        $("#holidaysTable").append(table);

      } else {
        // Handle the case when no holidays are found for the country
        $("#holidaysTable").html("<p>No holidays found for this country.</p>");
        $("#holidayModal").modal("show");
      }
    },
    error: function () {
      // Handle AJAX error
      $("#holidaysTable").html("<p>An error occurred while fetching holiday data.</p>");
      $("#holidayModal").modal("show");
    },
  });
}

  // Function to fetch and display News
  function getNews(countryCode) {
    // Make an AJAX request to your getNews.php API
    $.ajax({
      url: "./utils/news.php",
      type: "GET",
      data: { CC: countryCode },
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          const newsArray = data.data.news;
          const newsModal = $("#newsModal");

          if (newsArray.length > 0) {
            // Clear the modal body before adding news items
            newsModal.find(".modal-body").html("");

            for (let i = 1; i < newsArray.length; i++) {
              // Limit the news text to 100 words
              const limitedText = newsArray[i].text
                .split(" ")
                .slice(0, 100)
                .join(" ");
              // Limit the url to stop text after the third "/"
              const urlParts = newsArray[i].url.split("/");
              const limitedUrl = urlParts.slice(0, 3).join("/");

              const newsContent = `
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">${newsArray[i].title}</h2>
                </div>
                <img src="${newsArray[i].image}" class="card-img-top" alt="newsImage" width="450" height="300">
                <div class="card-body">
                  <p class="card-text">${limitedText}...</p> <!-- Add "..." at the end -->
                  <a href="${newsArray[i].url}" target="_blank" class="btn btn-primary">${limitedUrl}</a>
                </div>
              </div>
            `;

              // Add the news content to the modal body
              newsModal.find(".modal-body").append(newsContent);

              // Add the separating line after each news item except the last one
              if (i < newsArray.length - 1) {
                newsModal
                  .find(".modal-body")
                  .append('<div class="news-separator"></div>');
              }
            }
          } else {
            // If no news items are found
            console.log("no news items are found");
            newsModal.find("#newsTitle").text("No results found.");
            newsModal.find("#newsImage").attr("src", ""); // Clear the image
            newsModal.find("#news").text("");
            newsModal.find("#newsUrl").attr("href", "#"); // Clear the URL

            // Display the news modal
            newsModal.modal("show");
          }
        } else {
          console.error("Error fetching news data");
        }
      },
      error: function () {
        console.error("Error fetching news data");
      },
    });
  }

  // Function to get currency conversion rates
  function getCurrency() {
    let baseCurrency = $("#inputBaseCurrency").val();
    let convertCurrency = $("#inputConvertCurrency").val();

    if (!baseCurrency || !convertCurrency) {
      alert("Please select both base and convert currencies.");
      return;
    }

    $.ajax({
      url: "./utils/getCurrency.php",
      method: "GET",
      data: { base: baseCurrency, action: "2" }, // Requesting currency conversion rates
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          let conversionRate = data.data.rates[convertCurrency];
          let inputValue = parseFloat($("#inputValue").val());

          const currencyResult = $("#currencyResult");

          // Clear existing currency options
          currencyResult.empty();

          if (!isNaN(inputValue)) {
            let result = numeral(inputValue * conversionRate).format("0,0.00");
            $("#currencyResult").append(
              $("<option>", {
                text:
                  baseCurrency +
                  ": " +
                  inputValue +
                  " = " +
                  convertCurrency +
                  ": " +
                  result,
              })
            );
          }
        }
      },
      error: function (error) {
        console.error("Error fetching currency conversion rates:", error);
      },
    });
  }

  // Add an event listener for the currency modal "Convert" button
  $("#currencyConvertButton").click(function () {
    const inputValue = $("#inputValue").val();
    const baseCurrency = $("#inputBaseCurrency").val();

    // Check if the input value is a valid number
    if (!isNaN(inputValue) && baseCurrency) {
      // Call the getCurrency function to perform the conversion
      getCurrency();
    } else {
      alert("Please enter a valid input value and base currency.");
    }
  });

  $("#inputBaseCurrency, #inputConvertCurrency").change(function () {
    const inputValue = $("#inputValue").val();
    const baseCurrency = $("#inputBaseCurrency").text();
    const convertCurrency = $("#inputConvertCurrency").text();

    // Check if the input value is a valid number
    if (!isNaN(inputValue) && baseCurrency && convertCurrency) {
      // Call the getCurrency function to perform the conversion
      getCurrency();
    } else {
      alert(
        "One of the parameters is incorrect, correct the mistake or reload the page"
      );
    }
  });

  $("#inputValue").on("keyup", function () {
    const inputValue = $("#inputValue").val();
    const baseCurrency = $("#inputBaseCurrency").text();
    const convertCurrency = $("#inputConvertCurrency").text();

    // Check if the input value is a valid number
    if (!isNaN(inputValue) && baseCurrency && convertCurrency) {
      // Call the getCurrency function to perform the conversion
      getCurrency();
    } else {
      alert(
        "One of the parameters is incorrect, correct the mistake or reload the page"
      );
    }
  });

  // Function to populate currency select elements
  function getCurrencyList() {
    $.ajax({
      url: "./utils/getCurrency.php",
      method: "GET",
      data: { action: "1" }, // Requesting currency list
      dataType: "json",
      success: function (data) {
        if (data.status.code === "200") {
          // Clear existing options
          $("#inputBaseCurrency, #inputConvertCurrency").empty();

          // Populate the select elements
          $.each(data.data.currencies, function (code, name) {
            $("#inputBaseCurrency, #inputConvertCurrency").append(
              $("<option>", { value: code, text: name + " (" + code + ")" })
            );
          });
        }
      },
      error: function (error) {
        console.error("Error fetching currency list:", error);
      },
    });
  }

  // Call the getCurrencyList function to populate the select element
  getCurrencyList();

  // Function to open the Overview Bar Modal
  function openOverviewModal() {
    showLoader();
    $("#overviewModal").modal("show");
  }

  // Function to open the Wikipedia Modal
  function openWikipediaModal() {
    showLoader();
    $("#wikipediaModal").modal("show");
  }

  // Function to open the Weather Forecast Modal
  function openWeatherModal() {
    showLoader();
    $("#weatherModal").modal("show");
  }

  // Function to open the Holiday Modal
  function openNewsModal() {
    showLoader();
    $("#newsModal").modal("show");
  }

  // Function to open the Holiday Modal
  function openHolidayModal() {
    showLoader();
    $("#holidayModal").modal("show");
  }

  // Function to open the Holiday Modal
  function openCurrencyModal() {
    showLoader();
    $("#currencyModal").modal("show");
    getCurrency();
  }

  // Function to open the Holiday Modal
  function openSettingsModal() {
    showLoader();
    $("#settingsModal").modal("show");
  }

  // Add EasyButtons for each modal
  L.easyButton(
    "fa-solid fa-search fa-xl",
    openOverviewModal,
    "Open Overview Pannel"
  ).addTo(map);
  L.easyButton(
    "fa-solid fa-book fa-xl",
    openWikipediaModal,
    "Open Wikipedia Pannel"
  ).addTo(map);
  L.easyButton(
    "fa-solid fa-sun fa-xl",
    openWeatherModal,
    "Open Weather Forecast"
  ).addTo(map);
  L.easyButton(
    "fa-solid fa-newspaper fa-xl",
    openNewsModal,
    "Open News Pannel"
  ).addTo(map);
  L.easyButton(
    "fa-solid fa-tree fa-xl",
    openHolidayModal,
    "Open Holiday Overview"
  ).addTo(map);
  L.easyButton(
    "fa-solid fa-dollar-sign fa-xl",
    openCurrencyModal,
    "Open Currency Converter"
  ).addTo(map);
  L.easyButton(
    "fa-solid fa-gear fa-xl",
    openSettingsModal,
    "Open Settings Pannel"
  ).addTo(map);

  function atAGlance() {
    const showOverview = document.getElementById(
      "showAtAGlanceOverview"
    ).checked;
    const showWikipedia = document.getElementById(
      "showAtAGlanceWikipedia"
    ).checked;
    const showWeather = document.getElementById("showAtAGlanceWeather").checked;
    const showHolidays = document.getElementById(
      "showAtAGlanceHolidays"
    ).checked;
    const showCurrency = document.getElementById(
      "showAtAGlanceCurrency"
    ).checked;
    const showNews = document.getElementById("showAtAGlanceNews").checked;

    switch (true) {
      case showOverview:
        openOverviewModal();
        break;

      case showWikipedia:
        openWikipediaModal();
        break;

      case showWeather:
        openWeatherModal();
        break;

      case showHolidays:
        openHolidayModal();
        break;

      case showCurrency:
        openCurrencyModal();
        break;

      case showNews:
        openNewsModal();
        break;
    }
  }

  atAGlance();

  // Add an event listener to the settings modal when it's shown
  $("#settingsModal").on("show.bs.modal", function (event) {
    // Get the modal element
    const modal = $(this);

    // Find all radio inputs within the modal
    const radioInputs = modal.find('input[type="radio"]');

    // Add an event listener to handle radio button selection
    radioInputs.on("change", function () {
      // Remove the "checked" attribute from all other radio inputs
      radioInputs.not(this).prop("checked", false);
    });
  });

  function showLoader() {
    const loader = document.createElement("div");
    loader.className = "pre-loader";
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);

    // Automatically hide the pre-loader after 1 second
    setTimeout(() => {
      hideLoader();
    }, 1000); // 1000 milliseconds (1 second)
  }

  // Function to hide the pre-loader
  function hideLoader() {
    const loader = document.querySelector(".pre-loader");
    if (loader) {
      loader.remove();
    }
  }

  // Event listener to hide the pre-loader when a modal is hidden
  $(
    "#overviewModal, #wikipediaModal, #weatherModal, #newsModal, #holidayModal, #currencyModal, #settingsModal"
  ).on("hidden.bs.modal", function () {
    hideLoader();
  });
});
