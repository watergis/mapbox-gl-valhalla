import { Map as MapboxMap, LngLat } from 'mapbox-gl';
import Valhalla, { Costing, ContourType } from './valhalla';
import CrosshairManager from './crosshair-manager';
import { createTextbox } from './util';

export default class DistanceIsochroneControl {
  private map: MapboxMap | undefined;

  private controlContainer: HTMLElement;

  private mainContainer: HTMLElement;

  private mainButton: HTMLButtonElement;

  private valhalla: Valhalla;

  private crosshair: CrosshairManager | undefined;

  constructor(
    map: MapboxMap | undefined,
    valhalla: Valhalla,
  ) {
    this.map = map;
    this.valhalla = valhalla;
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }

  public addTo(parentContainer: HTMLElement) {
    if (!this.map) console.error('map object is null');

    this.controlContainer = document.createElement('div');
    this.controlContainer.classList.add('mapboxgl-ctrl');
    this.controlContainer.classList.add('mapboxgl-ctrl-group');

    this.mainContainer = document.createElement('div');
    this.mainContainer.classList.add('mapboxgl-valhalla-list');
    this.mainButton = document.createElement('button');
    this.mainButton.classList.add('mapboxgl-ctrl-icon');
    this.mainButton.classList.add('mapboxgl-valhalla-distance-isochrone-control');
    this.mainButton.addEventListener('click', () => {
      this.mainButton.style.display = 'none';
      this.mainContainer.style.display = 'block';
      this.toggleCrosshair(true);
    });
    document.addEventListener('click', this.onDocumentClick);
    this.controlContainer.appendChild(this.mainButton);
    this.controlContainer.appendChild(this.mainContainer);

    const table = document.createElement('TABLE');
    table.className = 'valhalla-table';
    this.mainContainer.appendChild(table);

    const center = this.map?.getCenter();
    if (center) {
      const tr1 = createTextbox('Longitude', 'lon-distance', center.lng, true);
      table.appendChild(tr1);
      const tr2 = createTextbox('Latitude', 'lat-distance', center.lat, true);
      table.appendChild(tr2);
    }

    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.classList.add('mapbox-valhalla-control-button');
    clearButton.addEventListener('click', () => {
      this.valhalla.clearFeatures();
    });
    this.mainContainer.appendChild(clearButton);

    const calcButton = document.createElement('button');
    calcButton.textContent = 'Calculate';
    calcButton.classList.add('mapbox-valhalla-control-button');
    calcButton.addEventListener('click', () => {
      const lon: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lon-distance');
      const lat: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lat-distance');

      this.valhalla.getIsochrone(
        Number(lon.value),
        Number(lat.value),
        ContourType.Distance,
        Costing.Walking,
      );
    });
    this.mainContainer.appendChild(calcButton);

    this.map?.on('moveend', () => {
      const centerMoved = this.map?.getCenter();
      const lon: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lon-distance');
      const lat: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lat-distance');
      if (!centerMoved) {
        lon.setAttribute('value', '');
        lat.setAttribute('value', '');
      }
      const lnglat: LngLat | undefined = centerMoved;
      const lonValue: string = (lnglat?.lng) ? lnglat.lng.toString() : '';
      lon.setAttribute('value', lonValue);

      const latValue: string = (lnglat?.lat) ? lnglat.lat.toString() : '';
      lat.setAttribute('value', latValue);
    });

    parentContainer.appendChild(this.controlContainer);
    return parentContainer;
  }

  private onDocumentClick(event: MouseEvent): void {
    if (
      this.controlContainer
      && !this.controlContainer.contains(event.target as Element)) {
      this.hide();
    }
  }

  public hide() {
    if (
      this.mainContainer
      && this.mainButton) {
      this.mainContainer.style.display = 'none';
      this.mainButton.style.display = 'block';
      this.toggleCrosshair(false);
    }
  }

  public destroy() {
    if (!this.mainContainer
      || !this.mainContainer.parentNode
      || !this.map
      || !this.mainButton) {
      return;
    }
    this.mainButton.removeEventListener('click', this.onDocumentClick);
    this.mainContainer.parentNode.removeChild(this.mainContainer);
    document.removeEventListener('click', this.onDocumentClick);

    if (this.crosshair !== undefined) {
      this.crosshair.destroy();
      this.crosshair = undefined;
    }

    this.map = undefined;
  }

  private toggleCrosshair(state: boolean) {
    if (state === false) {
      if (this.crosshair !== undefined) {
        this.crosshair.destroy();
        this.crosshair = undefined;
      }
    } else {
      this.crosshair = new CrosshairManager(this.map);
      this.crosshair.create();
    }
  }
}
