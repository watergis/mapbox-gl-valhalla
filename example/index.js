import mapboxgl from 'mapbox-gl';
import { MapboxValhallaControl } from '../lib/index';
import '../css/styles.css';

(()=>{
    // mapboxgl.accessToken='your mapbox access token'
    const map = new mapboxgl.Map({
        container: 'map',
        // style: 'mapbox://styles/mapbox/streets-v11',
        style:'https://wasac.github.io/mapbox-stylefiles/unvt/style.json',
        center: [30.059683,-1.946186],
        zoom: 15,
        hash:true,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new MapboxValhallaControl(
      process.env.VALHALLA_API,
      {
        Contours: [
          {
            time: 3,
            distance: 1,
            color: 'ff0000',
          },
          {
            time: 5,
            distance: 2,
            color: 'ffff00',
          },
          {
            time: 10,
            distance: 3,
            color: '0000ff',
          },
        ],
        Crosshair: true
      }
    ), 'top-right');
})()