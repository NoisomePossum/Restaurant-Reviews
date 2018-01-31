////////////////////////////////////////////////////
// Definiton of global variables
///////////////////////////////////////////////////
var map;
// creates a variable to contain all the markers on the map
var markers = [];
var mapBounds;

// Initializes the map and sets markers for restaurants in the 
// map bounds area (places API)
function initMap() {
    // Default location is Paris - map center changes after 
    // user accepts geolocation
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 48.85661400000001, lng: 2.3522219000000177},
        zoom: 14
    });

    var userLocation= new google.maps.InfoWindow;

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            userLocation.setPosition(pos);
            userLocation.setContent('You are here.');
            userLocation.open(map);
            map.setCenter(pos);
            ///////////////////////////////////////////////////////////////////////
            // Begin places API section
            // ///////////////////////////////////////////////////////////////////
            service = new google.maps.places.PlacesService(map);
            // Makes a request to the places API for all restaurants in the mapbounds area
            service.nearbySearch({
                bounds: mapBounds,
                type: ['cafe']
            }, callback);

            // Makes a second call for each place found to get a more detailed
            // version of the results (adds info such as reviews etc.)
            function callback(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        service.getDetails({placeId: results[i].place_id}, callback2);
                    }
                }
            }

            // Calls the createMarker function for each result returned by the getDetails
            // request in the first callback
            function callback2(details, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    createMarker(details);
                }
            }

            function createMarker(details) {
                var detailsLoc = details.geometry.location;
                var marker = new google.maps.Marker({
                    map: map,
                    position: details.geometry.location,
                });

                // Sets the marker's name which will later become the id for a div in the sidebar
                // used to display reviews and other information in the sidebar
                marker.name = details.name;

                marker.infowindow = new google.maps.InfoWindow ({
                    content: "<p><b>" + details.name + "</b></p><p>" + details.rating + "</p>"
                });
                // Makes an info window appear on mousover with some basic information
                google.maps.event.addListener(marker, 'mouseover', function() {
                    this.infowindow.open(map, this);
                });
                google.maps.event.addListener(marker, 'mouseout', function(event) {
                    this.infowindow.close();
                });

                // Adds the marker to the markers list so that we can interact with its
                // corresponding div in the sidebar later
                markers.push(marker);

                // The marker needs an index so that we can reference it later through the button
                // in the "add review" modal
                marker.index = markers.length - 1;

                // Sets the content that will be added to the sidebar section for the marker
                var text = "<image src='https://maps.googleapis.com/maps/api/streetview?size=600x300&location=" + details.vicinity + "&heading=151.78&pitch=-0.76&key=AIzaSyDBFwMLd1uhQTD_V0vmbE6e2E4ZxJ6PONE'>";
                text += "<p><b>" + details.name + "</b></p>";
                var index = 0;
                while (index < 3) {
                    text += "<p>" + details.reviews[index].rating + "/5</p>";
                    text += "<p>" + details.reviews[index].text + "</p>";
                    index++;
                }
                
                // Stores the text in the marker itself in case we need it later
                marker.info = text;

                // Creates a div containing the above text and then appends it to the sidebar
                var review = document.createElement('div');
                review.id = details.name;
                review.innerHTML = marker.info;
                document.getElementById('sidebar').appendChild(review);

                // Adds a click event that opens the "add review" modal for the current marker
                marker.addListener('click', function() {
                    var modal = document.getElementById("reviewOnly");
                    modal.style.display = "block";
                    document.getElementById("reviewWhat").innerHTML = "<b>" + this.name + "</b>";
                    // Adds the marker's index as an attribute of the modal's submit button
                    // this is passed as an argument to the function called by the button so
                    // the modal can access the correct marker
                    document.getElementById("insertReviewButton").setAttribute("indexValue", this.index);
                    document.getElementById("insertReviewButton").setAttribute("onclick", "getReview(document.getElementById(\"insertReviewButton\").getAttribute(\"indexValue\"))");
                })
            }

            /////////////////////////////////////////////////////////////////////
            // End places API section
            //////////////////////////////////////////////////////////////////////
        }, function() {
            handleLocationError(true,userLocation, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false,userLocation, map.getCenter());
    }

    // Listens to changes in the map coordinates and performs
    // operations each time the map changes (zoom/drag etc.)
    google.maps.event.addListener(map, 'bounds_changed', function() {
        mapBounds = map.getBounds();

        // Checks the position of every marker to see if its position is 
        // contained in the current bounds
        for (var i = 0; i < markers.length; i++) {
            var position = markers[i].position;
            var markId = markers[i].name;

            // Changes the display of sidebar divs according to whether or not they
            // are currently contained in the new map bounds
            if (mapBounds.contains(position)) {
                document.getElementById(markId).style.display = "block";
            }
            else {
                document.getElementById(markId).style.display = "none";
            }
        }

    });

}

// Create a <script> tag and set the JSON reviews file as source
var script = document.createElement('script');
script.src = './js/restaurant_reviews.json';
document.getElementsByTagName('head')[0].appendChild(script);

// Loop through the restaurants array and place a marker for each
// restaurant at its coordinates
window.eqfeed_callback = function(results) {
    for (var i = 0; i < results.restaurants.length; i++) {
        var latcoords = results.restaurants[i].lat;
        var longcoords = results.restaurants[i].long;
        var latLng = new google.maps.LatLng(latcoords,longcoords);
        var address = results.restaurants[i].address;
        var marker = new google.maps.Marker({
            position: latLng,
            map: map,
            index: i,
            info: null,
            infowindow: null
        });

        // Defines the layout of each review on the sidebar and in the icon info
        var sideText = "<image src='https://maps.googleapis.com/maps/api/streetview?size=600x300&location=" + address + "&heading=151.78&pitch=-0.76&key=AIzaSyDBFwMLd1uhQTD_V0vmbE6e2E4ZxJ6PONE'>";
        sideText += "<p><b>" + results.restaurants[i].restaurantName + "</b></p>";
        for (var r = 0; r < results.restaurants[i].ratings.length; r++) {
            sideText += "<p>" + results.restaurants[i].ratings[r].stars + "/5</p>";
            sideText += "<p>" + results.restaurants[i].ratings[r].comment + "</p>";
        }
        marker.info = sideText;
        
        // Sets the marker's name which will later become the id for a div in the sidebar
        // used to display reviews and other information in the sidebar
        marker.name = results.restaurants[i].restaurantName;

        var winText = "<p><b>" + results.restaurants[i].restaurantName + "</b></p>";
        // Averages the star ratings and displays the result in the info window
        var average = 0;
        for (var r = 0; r < results.restaurants[i].ratings.length; r++) {
            average += results.restaurants[i].ratings[r].stars;
        }
        average /= results.restaurants[i].ratings.length;
        average = Math.round(average * 10) / 10;
        winText += "<p>" + average + "</p>";

        marker.infowindow = new google.maps.InfoWindow ({
            content: "<div>" + winText + "</div>"
        });

        marker.addListener('click', function() {
            var modal = document.getElementById("reviewOnly");
            modal.style.display = "block";
            document.getElementById("reviewWhat").innerHTML = "<b>" + this.name + "</b>";
            // Adds the marker's index as an attribute of the modal's submit button
            // this is passed as an argument to the function called by the button so
            // the modal can access the correct marker
            document.getElementById("insertReviewButton").setAttribute("indexValue", this.index);
            document.getElementById("insertReviewButton").setAttribute("onclick", "getReview(document.getElementById(\"insertReviewButton\").getAttribute(\"indexValue\"))");
        })

        // Makes an info window appear on mousover with some basic information
        google.maps.event.addListener(marker, 'mouseover', function () {
            this.infowindow.open(map, this);
        });
        google.maps.event.addListener(marker, 'mouseout', function(event) {
            this.infowindow.close();
        });

        // Adds the marker to the markers list so that we can interact with its
        // corresponding div in the sidebar later
        markers.push(marker);

    }

    // Adds every marker to the sidebar
    populateSidebar(markers);

    // Adds the drawing manager which makes it possible to add new markers to the map
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['marker']
        },
    });
    drawingManager.setMap(map);

    // Sets a listener that opens a modal when a new marker is added
    // so that the user can enter the info for a new restaurant
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
        var newMarker = event.overlay;
        var modal = document.getElementById("enterReview");

        // Adds the marker to the markers list so that we can interact with its
        // corresponding div in the sidebar later
        markers.push(newMarker);
        newMarker.index = markers.length - 1;
        modal.style.display = "block";

        newMarker.addListener('click', function() {
            var reviewModal = document.getElementById("reviewOnly");
            reviewModal.style.display = "block";
            document.getElementById("reviewWhat").innerHTML = "<b>" + this.name + "</b>";
            // Adds the marker's index as an attribute of the modal's submit button
            // this is passed as an argument to the function called by the button so
            // the modal can access the correct marker
            document.getElementById("insertReviewButton").setAttribute("indexValue", this.index);
            document.getElementById("insertReviewButton").setAttribute("onclick", "getReview(document.getElementById(\"insertReviewButton\").getAttribute(\"indexValue\"))");
        })
    });

}

// Gets the data entered by the user - adds a new sidebar entry
// and updates marker info with the information
function getContent() {
    var currentMarker = markers[markers.length - 1];
    currentMarker.name = document.getElementById("restaurantName").value;
    var setRating = getRadioVal(document.getElementById("ratingForm"), "stars");
    var setComment = document.getElementById("commentBox").value;
    text = "<p><b>" + currentMarker.name + "</b></p>";
    text += "<p>" + setRating + "/5</p>";

    currentMarker.infowindow = new google.maps.InfoWindow ({
        content: "<p><b>" + currentMarker.name + "</b></p><p>" + setRating + "</p>"
    });
    text += "<p>" + setComment + "</p>";
    currentMarker.info = "<image src='https://ipsumimage.appspot.com/600x300'>" + text;
    var review = document.createElement('div');
    review.id = currentMarker.name;
    review.innerHTML = currentMarker.info;
    document.getElementById('sidebar').appendChild(review);

    // Makes an info window appear on mousover with some basic information
    google.maps.event.addListener(currentMarker, 'mouseover', function() {
        this.infowindow.open(map, this);
    });
    google.maps.event.addListener(currentMarker, 'mouseout', function(event) {
        this.infowindow.close();
    });
    var modal = document.getElementById("enterReview");
    modal.style.display = "none";
}

// Gets the new review entered by the user - adds the new review and
// star rating to the sidebar corresponding to the restaurant
function getReview(index) {
    var setRating = getRadioVal(document.getElementById("ratingForm2"), "stars");
    var setComment = document.getElementById("commentBox2").value;
    markers[index].info += "<p>" + setRating + "/5</p>";
    markers[index].info += "<p>" + setComment + "</p>";
    document.getElementById(markers[index].name).innerHTML = markers[index].info;
    var modal = document.getElementById("reviewOnly");
    modal.style.display = "none";
}

function getRadioVal(form, name) {
    var val;
    // gets list of radio buttons with specified name
    var radios = form.elements[name];

    // loops through the list of radio buttons
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            val = radios[i].value;
            break;
        }
    }

    return val;
}

function handleLocationError(browserHasGeolocation,userLocation, pos) {
    userLocation.setPosition(pos);
    userLocation.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    userLocation.open(map);
}

function populateSidebar(array) {

    // sets an infowindow for each marker and sets the marker
    // in its place on the map
    for (var i = 0; i < array.length; i++) {

        var divId = array[i].name;

        var review = document.createElement('div');
        review.id = divId;
        review.innerHTML = array[i].info;
        document.getElementById('sidebar').appendChild(review);

    }
}
