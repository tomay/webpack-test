// data and config constants
const DATA = {};
const CONFIG = {};

// file imports
import icons from './icons.js';
import MapboxDirections from '../static/libs/mapbox-gl-directions';

// MB access token
CONFIG.access_token =
  'pk.eyJ1IjoidG9tLWlsaW5lLTIxIiwiYSI6ImNrbDJlOWh2NjBjNnoyd21yamk2eGd0YWEifQ.F5N02JRotHmPJZjWu7jeDw'

// map defaults
CONFIG.startlat = 44.47512;
CONFIG.startlon = -73.21964;
CONFIG.startzoom = 15;
CONFIG.startpitch = 50;
CONFIG.startbearing = -35;

import styles from './index.scss';

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// INITIALIZATION: these functions are called when the page is ready,
///////////////////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function (event) {
  initData().then(function () {
    // init data, then
    initDataFormat(); // data formatting and other data tasks
    initMap(); // map inits
    initFooter(); // init the image slider in the footer
    initDirections(); // init the directions buttons and cetera

    // start things off by opening a modal
    initStartupModal();
  })
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Functions called on doc ready
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function initData() {
  // fetch the CSV data then process it with Papa parse
  // returns a promise so we can wait for it to resolve, then move onto the rest of the init steps
  return new Promise(function (resolve, reject) {
    fetch('./data/data.csv')
      .then(function (response) {
        // parse from datastream to text
        return response.text();
      })
      .then(function (data) {
        // `data` is the parsed version of the JSON returned from the above endpoint.
        let rawdata = Papa.parse(data, {
          header: true,
          skipEmptyLines: 'greedy',
        })

        // keep a reference
        DATA.poi_data = rawdata.data;

        // phew!
        resolve();
      })
  }) // promise
}

function initDataFormat() {
  // pull out the access points, for convenience
  DATA.access_points = DATA.poi_data.filter(function (d) {
    return d.poi_type == 'access';
  })
  // console.log(DATA);
}

function initStartupModal() {
  // show the modal (one time), and configure as we do so
  MicroModal.show('modal-splash', {
    awaitCloseAnimation: true,
    onClose: function (modal, element, event) {
      event.preventDefault();
      event.stopPropagation();
    },
  })
}

function initMap() {
  mapboxgl.accessToken = CONFIG.access_token;

  CONFIG.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/tom-iline-21/ckl9rykrb17wl17nxyufm1fss',
    center: { lon: CONFIG.startlon, lat: CONFIG.startlat },
    zoom: CONFIG.startzoom,
    pitch: CONFIG.startpitch, // pitch in degrees
    bearing: CONFIG.startbearing, // bearing in degrees. 0 for due north, -180 for due south
  })

  // Add zoom and rotation controls to the map.
  CONFIG.map.addControl(new mapboxgl.NavigationControl());

  // Add geolocate control to the map.
  CONFIG.geolocation = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true,
  })

  CONFIG.map.addControl(CONFIG.geolocation);

  // MB provides very few hooks to know if the control is active and we have a position. This is one.
  // The problem is that, if a user turns off the control, presumably they don't want to be tracked (even though they still will be, since they already gave permission)
  // So, before routing using user_lat and user_long, make sure that they are present AND
  // CONFIG.geolocation_watchState != "OFF"  - yes that's an internal variable, but it's all we got
  // note: OFF is used both for the inactive button state, and also when geolocation is blocked
  CONFIG.geolocation.on('geolocate', function (position) {
    CONFIG.user_latitude = position.coords.latitude;
    CONFIG.user_longitude = position.coords.longitude;
  })

  // Add and configure MapboxDirections Controls to the map: one for bike, one for walk
  // we actually hide all of the controls, and use only the internals to show a route on the map
  CONFIG.directions = new MapboxDirections({
    accessToken: CONFIG.access_token,
    interactive: false, // if true, then clicks on the map set the origin and destination
    // default to cycling, but this can be switched
    profile: 'mapbox/cycling',
    controls: {
      inputs: false,
      profileSwitcher: false,
      instructions: false,
    },
  })
  // add it to the map
  CONFIG.map.addControl(CONFIG.directions);

  // add the POI markers to the map
  DATA.poi_data.forEach(function (d) {
    // the map icons are made up of two background svgs: one icon (downloaded from font awesome pro), and a map pin (from fa-map-marker)
    // in static/icons we have a set of markers and icons to draw from
    // data.csv tells us which fa-icon to use, and what color for the marker
    let icon = '';
    if (d.icon === '') {
      icon = 'marker-grey';
    } else if (d.icon === 'trail-access') {
      icon = 'trail_access';
    } else {
      icon = d.icon;
    }

    let marker = '';
    if (d.iconcolor === '') {
      marker = 'marker-grey';
    } else if (d.icon === 'none') {
      marker = '';
    } else {
      marker = `marker-${d.iconcolor}`;
    }

    // set the icontop to 10px, adjust if needed from the data.csv
    let topadjust = d.icontop ? parseInt(d.icontop) : 0;
    let icontop = 10 + topadjust;

    // set the iconleft to 8px, adjust if needed from the data.csv
    let leftadjust = d.iconleft ? parseInt(d.iconleft) : 0;
    let iconleft = 8 + leftadjust;

    // set the iconsize to 14px or override if called for from the data.csv
    let iconsize = d.iconsize || 14;

    // create a DOM element for the marker
    let el = document.createElement('div');
    el.className = 'marker';
    if (marker === 'marker-none') {
    	// these have only a single background image 
    	 el.style.backgroundImage = `url(${icons[icon]})`;
    } else {
	    el.style.backgroundImage = `url(${icons[icon]}), url(${icons[marker]})`;
    }
    el.style.backgroundSize = `${iconsize}px, 30px`;
    el.style.backgroundRepeat = 'no-repeat, no-repeat';
    el.style.backgroundPosition = `top ${icontop}px left ${iconleft}px, center`;
    el.style.width = '30px';
    el.style.height = '40px';
    el.style.zIndex = 1; // above the "error halo" of your position, but below the map controls, and the popups

    // set the popup content
    let html = '';
    switch (d.poi_type) {
      case 'access':
        // no links for these, just a name
        html = `<h3 class="popup-header access-header">${d.name}</h3>`;
        // then the description
        html += `<div class="description">${d.description}</div>`;
        // add a footer wrapper
        html += '<div id=popup-footer>';
        // add a button for directions
        html += `<a class="btn popup-footer-directions" role="button" href="javascript:void(0);" data-lat=${d.latitude} data-lng=${d.longitude}" target="blank">Get directions</a>`;
        html += '</div>';

        break;

      default:
        html = `<a class="header-link" href="${d.url}" target="_blank">`;
        html += `<h3 class="popup-header">${d.name}`;
        html += '<span class="outlink"></span></h3>';
        html += '</a>';
        // then the description
        html += `<div class="description">${d.description}</div>`;

        // add a footer wrapper
        html += '<div id=popup-footer>';
        // repeat the website URL at the bottom
        html += `<a class="popup-footer-website-link" href="${d.url}" target="blank">Visit website</a>`;
        // add a button for directions
        html += `<a class="btn popup-footer-directions" role="button" href="javascript:void(0);" data-lat=${d.latitude} data-lng=${d.longitude}" target="blank">Get directions</a>`;
        html += '</div>';
    }
    // add the HTML to the popup
    var popup = new mapboxgl.Popup().setHTML(html);

    // add the marker to map
    new mapboxgl.Marker(el)
      .setLngLat([d.longitude, d.latitude])
      .setPopup(popup)
      .addTo(CONFIG.map);
  })

  // create a zoom home control
  class zoomHomeControl {
    onAdd(map) {
      this.map = map;

      // create a container for the button, with mapbox-gl classes
      this.container = document.createElement('div');
      this.container.classList.add('mapboxgl-ctrl');
      this.container.classList.add('mapboxgl-ctrl-group');

      // add an inner button, with an icon
      let button = document.createElement('button');
      button.className = 'zoom-home-control';
      button.innerHTML =
        '<span class="zoom-home-icon mapboxgl-ctrl-icon"></span>';

      // join the two pieces
      this.container.innerHTML = button.outerHTML;

      // register a click event on the button
      this.container.addEventListener('click', function () {
        map.flyTo({
          center: [CONFIG.startlon, CONFIG.startlat],
          zoom: CONFIG.startzoom,
          bearing: CONFIG.startbearing,
          pitch: CONFIG.startpitch,
        });
      });

      // all set
      return this.container;
    }
    onRemove() {
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }

  // add the zoom home control we just created, above
  CONFIG.map.addControl(new zoomHomeControl())

  // create a directions control
  class trailDirectionsControl {
    onAdd(map) {
      this.map = map;

      // create a container for the button, with mapbox-gl classes
      this.container = document.createElement('div');
      this.container.classList.add('mapboxgl-ctrl');
      this.container.classList.add('mapboxgl-ctrl-group');

      // add an inner div
      let div = document.createElement('div');
      div.className = 'trail-directions-control';

      // add more inner elements
      let span = document.createElement('span');
      span.className = 'trail-directions-btn mapboxgl-ctrl-icon';
      span.innerText = 'Get to the trail!';
      span.role = 'button';
      div.appendChild(span);

      // add a bike/walk toggle
      let toggle = document.createElement('div');
      toggle.id = 'toggle-wrapper';
      // first label span
      let toggle_label1 = document.createElement('span');
      toggle_label1.className = 'toggle-label';
      toggle_label1.innerText = 'Bike';
      toggle.appendChild(toggle_label1);
      // a (hidden) input
      let input = document.createElement('input');
      input.type = 'checkbox';
      input.id = 'toggle';
      input.className = 'checkbox';
      toggle.appendChild(input);
      // the label
      let label = document.createElement('label');
      label.htmlFor = 'toggle';
      label.className = 'switch';
      toggle.appendChild(label);
      // second label span
      let toggle_label2 = document.createElement('span');
      toggle_label2.className = 'toggle-label';
      toggle_label2.innerText = 'Walk';
      toggle.appendChild(toggle_label2);
      toggle.appendChild(toggle_label2);

      // add a link to clear directions
      let cleardirections = document.createElement('div');
      cleardirections.id = 'clearlink';
      cleardirections.innerText = 'clear directions';

      // join the pieces
      div.appendChild(toggle);
      div.appendChild(cleardirections);
      this.container.appendChild(div);

      // register a click event on the button
      // let directions_btn = document.getElementById('direction-btn-main');
      span.addEventListener('click', function () {
        // find the closest access point to the users location
        let closest = { distance: Infinity }
        DATA.access_points.forEach(function (d) {
          let distance = getDistanceFromLatLng(
            CONFIG.user_latitude,
            CONFIG.user_longitude,
            d.latitude,
            d.longitude
          );
          d.distance = distance;
          if (distance < closest.distance) {
            closest = d;
          }
        })

        // call the directions/route function
        // note we're not testing here for "closest", it could be null because geo is turned off
        // but that's ok, the recipient function will handle that check
        getDirectionsAndRoute(closest);
      })

      // all set
      return this.container;
    }
    onRemove() {
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }

  // instantiate one of these, and add it to the map
  CONFIG.directions_control = new trailDirectionsControl();
  CONFIG.map.addControl(CONFIG.directions_control, 'top-left');
}

// footer is a rotating gallery of ads
function initFooter() {
  new Swiper('.swiper-container', {
    loop: true,
    autoplay: {
      delay: 10000,
      disableOnInteraction: false,
    },
    centeredSlides: true,
    grabCursor: true,
  });
}

// inits for the directions system
function initDirections() {
  // delegated event handler for the "GET DIRECTIONS" buttons on the map poups
  document.querySelector('#map').addEventListener('click', (e) => {
    if (!e.target.matches('.popup-footer-directions')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    let destination = {
      latitude: parseFloat(e.target.dataset.lat),
      longitude: parseFloat(e.target.dataset.lng),
    };

    // close the popup
    const popup = document.getElementsByClassName('mapboxgl-popup');
    if (popup.length) {
      popup[0].remove();
    }
    // get the route
    getDirectionsAndRoute(destination);
  })

  // init the clearlink to hide directions that are on the map
  document.getElementById('clearlink').addEventListener('click', (e) => {
    e.target.style.display = 'none';
    CONFIG.directions.removeRoutes();
  })
}

/////////////////////////////////////////////////////////////////
// NAMED FUNCTIONS
/////////////////////////////////////////////////////////////////

// use MB directions API to get directions to and from locations,
// and add a route to the map
function getDirectionsAndRoute(destination) {
  // show the clearlink
  document.getElementById('clearlink').style.display = 'block';

  // remove routes before adding any more
  CONFIG.directions.removeRoutes();
  // find the nearest trail access POI to the users location
  // CONFIG.geolocation_watchState != "OFF"  - yes that's an internal variable, but it's all we got
  // note: OFF is used both for the inactive button state, and also when geolocation is blocked
  if (CONFIG.user_latitude && CONFIG.user_longitude && CONFIG.geolocation._watchState != 'OFF') {
    // get and set the route type profile
    let route_type = document.querySelector('#toggle').checked ? 'walk' : 'bike';

    switch (route_type) {
      case 'walk':
        // walk toggle is checked
        CONFIG.directions.setProfile('mapbox/walking');
        break
      case 'bike':
        // bike toggle is checked
        CONFIG.directions.setProfile('mapbox/cycling');

        break
        // default to bike
        CONFIG.directions.setProfile('mapbox/cycling');
    }
    CONFIG.directions.setOrigin([CONFIG.user_longitude, CONFIG.user_latitude]);
    CONFIG.directions.setDestination([
      destination.longitude,
      destination.latitude,
    ])
  } else {
    // Geolocation not available
    // TO DO: error message somewhere? Alert?
    alert(
      'Position not found. Make sure you click on the geolocation icon on the right side of the map, and allow geolocation through your browser and operating system settings.'
    );
  }
}

/*
 * SHIMS AND UTILITIES
 */

/* Distance between two lat/lng coordinates in km using the Haversine formula */
/* Copyright 2016, Chris Youderian, SimpleMaps, http://simplemaps.com/resources/location-distance
 Released under MIT license - https://opensource.org/licenses/MIT */
function getDistanceFromLatLng(lat1, lng1, lat2, lng2, miles) {
  // miles optional
  if (typeof miles === 'undefined') {
    miles = false;
  }
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  function square(x) {
    return Math.pow(x, 2);
  }
  var r = 6371; // radius of the earth in km
  lat1 = deg2rad(lat1);
  lat2 = deg2rad(lat2);
  var lat_dif = lat2 - lat1;
  var lng_dif = deg2rad(lng2 - lng1);
  var a =
    square(Math.sin(lat_dif / 2)) +
    Math.cos(lat1) * Math.cos(lat2) * square(Math.sin(lng_dif / 2));
  var d = 2 * r * Math.asin(Math.sqrt(a));
  if (miles) {
    return d * 0.621371;
  } //return miles
  else {
    return d;
  } //return km
}
