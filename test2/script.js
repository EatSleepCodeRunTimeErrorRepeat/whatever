// Set Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoiZWF0LXNsZWVwLXJ1bi10aW1lLWVycm9yLXJlcGVhdCIsImEiOiJjbTE4eTdqb3AxYXJ1MndxNGZoaGQybm5tIn0.RtaCqebj1i20dwocYhROag";

// Define available routes and their stops
const availableRoutes = [
  {
    name: "Route 1: KMUTT to Central Plaza Rama 2",
    stops: [
      { name: "KMUTT (King Mongkut's University of Technology Thonburi)", coordinates: [100.495, 13.6517] },
      { name: "Kajonrot Wittaya School", coordinates: [100.496, 13.6506] },
      { name: "Opposite Bangpakok Market", coordinates: [100.493, 13.6808] },
      { name: "Soi Man Si", coordinates: [100.492, 13.680] }, // Update to correct coordinates
    ]
  },
  {
    name: "Route 2: KMUTT to Siam Paragon",
    stops: [
      { name: "KMUTT (King Mongkut's University of Technology Thonburi)", coordinates: [100.495, 13.6517] },
      { name: "Thonburi Hospital", coordinates: [100.490, 13.659] }, // Example stop
      { name: "Krung Thon Bridge", coordinates: [100.485, 13.662] }, // Example stop
      { name: "Siam Paragon", coordinates: [100.532, 13.746] } // End stop
    ]
  }
];

// Get the user's current position
navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
  enableHighAccuracy: true
});

// Function to handle successful geolocation
function successLocation(position) {
  setupMap([100.495, 13.6517]);
}

// Function to handle geolocation error
function errorLocation() {
  setupMap([100.495, 13.6517]); // Default to KMUTT
}

// Function to set up the Mapbox map
function setupMap(center) {
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: center,
    zoom: 15
  });

  // Add navigation controls to the map
  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav);

  // Initialize directions control
  const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/driving'
  });
  map.addControl(directions, "top-left");

  // Add markers for bus stops for all routes
  availableRoutes.forEach(route => {
    route.stops.forEach((stop) => {
      const el = document.createElement('div');
      el.className = 'marker';

      new mapboxgl.Marker(el)
        .setLngLat(stop.coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(stop.name))
        .addTo(map);
    });
  });

  // Display bus route options
  displayBusRoutes(directions);

  // Add event listener for booking form submission
  document.getElementById('booking-form').addEventListener('submit', (event) => {
    event.preventDefault();
    
    const startLocation = document.getElementById('start-location').value;
    const endLocation = document.getElementById('end-location').value;
    const bookingDate = document.getElementById('booking-date').value;
    const bookingTime = document.getElementById('booking-time').value;

    directions.setOrigin(startLocation);
    directions.setDestination(endLocation);

    document.getElementById('summary-start').textContent = startLocation;
    document.getElementById('summary-end').textContent = endLocation;
    document.getElementById('summary-date').textContent = bookingDate;
    document.getElementById('summary-time').textContent = bookingTime;

    document.getElementById('confirmation-summary').style.display = 'block';
  });

  // Generate QR code \when booking confirmed
  document.getElementById('confirm-booking').addEventListener('click', () => {
    const qrContent = `
      Start: ${document.getElementById('summary-start').textContent}
      End: ${document.getElementById('summary-end').textContent}
      Date: ${document.getElementById('summary-date').textContent}
      Time: ${document.getElementById('summary-time').textContent}
      Driver: John Doe
    `;

    document.getElementById('qr-code').innerHTML = '';

    new QRCode(document.getElementById('qr-code'), {
      text: qrContent,
      width: 256,
      height: 256,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  });

  // Autocomplete functionality for start and end locations
  setupAutocomplete(directions);
}

// Function to display a list of bus routes and handle route previews
function displayBusRoutes(directions) {
  const routesContainer = document.getElementById('routes');

  // Clear any existing routes in the container before adding new ones
  routesContainer.innerHTML = '';

  availableRoutes.forEach(route => { // Changed busStops to availableRoutes
    const routeElement = document.createElement('div');
    routeElement.className = 'route-item';
    routeElement.textContent = route.name;

    // Set up the click event to handle route selection
    routeElement.addEventListener('click', () => {
      const waypoints = route.stops.map(stop => stop.coordinates);
      directions.setOrigin(waypoints[0]); // First stop as origin
      directions.setDestination(waypoints[waypoints.length - 1]); // Last stop as destination

      // Clear existing waypoints
      directions.clearWaypoints();
      // Add waypoints in between
      for (let i = 1; i < waypoints.length - 1; i++) {
        directions.addWaypoint(i - 1, waypoints[i]);
      }

      // Fill the booking form fields based on the selected route
      document.getElementById('start-location').value = route.stops[0].name; // Start location
      document.getElementById('end-location').value = route.stops[route.stops.length - 1].name; // End location

      // Log to console for debugging
      console.log('Routing from:', waypoints[0], 'to:', waypoints[waypoints.length - 1]);
      console.log('Waypoints:', waypoints.slice(1, waypoints.length - 1));
    });

    // Append the route element to the routes container
    routesContainer.appendChild(routeElement);
  });
}

// Function to set up autocomplete for start and end locations
function setupAutocomplete(directions) {
  const availableRoutesNames = availableRoutes.flatMap(route => route.stops.map(stop => stop.name)); // Changed busStopsNames to availableRoutesNames

  const startInput = document.getElementById('start-location');
  const endInput = document.getElementById('end-location');

  const startSuggestions = document.createElement('div');
  const endSuggestions = document.createElement('div');

  startSuggestions.className = 'suggestions';
  endSuggestions.className = 'suggestions';

  startInput.parentElement.appendChild(startSuggestions);
  endInput.parentElement.appendChild(endSuggestions);

  startInput.addEventListener('input', () => {
    const inputValue = startInput.value.toLowerCase();
    const filteredStops = availableRoutesNames.filter(stop => stop.toLowerCase().includes(inputValue)); // Changed busStopsNames to availableRoutesNames
    showSuggestions(filteredStops, startSuggestions, startInput);
  });

  endInput.addEventListener('input', () => {
    const inputValue = endInput.value.toLowerCase();
    const filteredStops = availableRoutesNames.filter(stop => stop.toLowerCase().includes(inputValue)); // Changed busStopsNames to availableRoutesNames
    showSuggestions(filteredStops, endSuggestions, endInput);
  });

  document.addEventListener('click', (event) => {
    if (!event.target.matches('#start-location') && !event.target.matches('#end-location')) {
      startSuggestions.style.display = 'none';
      endSuggestions.style.display = 'none';
    }
  });
}

// Function to display suggestions for autocomplete
function showSuggestions(suggestions, suggestionContainer, inputElement) {
  suggestionContainer.innerHTML = ''; // Clear previous suggestions
  suggestionContainer.style.display = 'none'; // Hide by default

  if (suggestions.length > 0) {
    suggestions.forEach(stop => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = stop;

      item.addEventListener('click', () => {
        inputElement.value = stop; // Set the input value
        suggestionContainer.style.display = 'none'; // Hide suggestions
        const startLocation = document.getElementById('start-location').value;
        const endLocation = document.getElementById('end-location').value;

        // Log selected locations to console for debugging
        console.log('Selected start location:', startLocation);
        console.log('Selected end location:', endLocation);
      });

      suggestionContainer.appendChild(item);
    });
    suggestionContainer.style.display = 'block'; // Show suggestions
  }
}
