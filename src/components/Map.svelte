<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import * as d3 from 'd3';
  import '../../node_modules/mapbox-gl/dist/mapbox-gl.css';
  import { convert_to_geoJSON } from "../lib/dataUtils"; 
  import { draw_sparklines } from "../lib/chartUtils"; 

  mapboxgl.baseApiUrl = 'https://data.humdata.org/mapbox';
  mapboxgl.accessToken = 'cacheToken';

  export let data = [];

  let map;
  let tooltip = d3.select('.tooltip');

  onMount(() => {
    const geoData = convert_to_geoJSON(data);

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/humdata/cl3lpk27k001k15msafr9714b',
      center: [0, 0],
      zoom: 2
    });

    map.addControl(new mapboxgl.NavigationControl({showCompass: false}))
       .addControl(new mapboxgl.AttributionControl(), 'bottom-left');   

    tooltip = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-tooltip'
    });

    map.on('load', () => {
      map.addSource('pointsSource', {
        type: 'geojson',
        data: geoData
      });

      // Add points for market locations
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'pointsSource',
        paint: {
          'circle-radius': 8,
          'circle-opacity': 0.5,
          'circle-color': '#007CE0'
        }
      });

      // Add admin2 labels
      map.addLayer({
        id: 'point-labels',
        type: 'symbol',
        source: 'pointsSource',
        layout: {
          'text-field': ['get', 'admin2_name'], 
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 1] 
        },
        paint: {
          'text-color': '#000000', 
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      const bounds = new mapboxgl.LngLatBounds();
      geoData.features.forEach(feature => bounds.extend([feature.geometry.coordinates[0], feature.geometry.coordinates[1]]));
      map.fitBounds(bounds, { padding: 100 });

      //mouse events
      map.on('mouseenter', 'points', onMouseEnter);
      map.on('mouseleave', 'points', onMouseLeave);
      map.on('mousemove', 'points', onMouseMove);
    });

    return () => map.remove();
  });


  //mouse event/leave events
  function onMouseEnter(e) {
    map.getCanvas().style.cursor = 'pointer';
    tooltip.addTo(map);
  }

  function onMouseLeave(e) {
    map.getCanvas().style.cursor = '';
    tooltip.remove();
  }

  function onMouseMove(e) {
    const prop = e.features[0].properties;
    let content = `<div class="content-container"><h2>${prop.market_name} Market, ${prop.admin2_name}</h2>`;

    const market_code = e.features[0].properties.market_code;
    const commodities = data[market_code].commodities.sort((a, b) => a.name.localeCompare(b.name));
    commodities.forEach(commodity => {
      const latestPrice = commodity.prices[commodity.prices.length-1];
      const priceLabel = `${latestPrice.price} ${latestPrice.currency_code} per ${latestPrice.unit}`;
      content += `${commodity.name} ${priceLabel}`;
      content += `<div class="market${commodity.code} sparkline-container"></div><br>`;
    });
    content += `</div>`;

    tooltip.setHTML(content)
           .addTo(map)
           .setLngLat(e.lngLat);

    // Inject sparklines after content is created
    commodities.forEach(commodity => {
      draw_sparklines(commodity, `.market${commodity.code}`);
    });
  }
</script>

<div id="map" style="width: 100%; height: 550px;"></div>
