import { Map as MapboxMap, LngLat } from 'mapbox-gl';
import Valhalla, { Costing, ContourType } from './valhalla';
import CrosshairManager from './crosshair-manager';
import { createSelection, createTextbox } from './util';

export default class TimeIsochroneControl {
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
    this.mainButton.classList.add('mapboxgl-valhalla-time-isochrone-control');
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

    const tr1 = createSelection(
      Costing, 'Means of transport', 'costing', Costing.Walking, (data, key) => data[key],
    );
    table.appendChild(tr1);

    const center = this.map?.getCenter();
    if (center) {
      const tr2 = createTextbox('Longitude', 'lon-time', center.lng, true);
      table.appendChild(tr2);
      const tr3 = createTextbox('Latitude', 'lat-time', center.lat, true);
      table.appendChild(tr3);
    }

    const contoursOption = this.valhalla.getContoursOption();
    for (let i = 0; i < contoursOption.length; i += 1) {
      const contour = contoursOption[i];
      const trN = createTextbox(`Contour ${i + 1} (min)`, `contour-time-${i}`, contour.time, false, 'number');
      table.appendChild(trN);
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
      const lon: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lon-time');
      const lat: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lat-time');
      const costing: HTMLSelectElement = <HTMLSelectElement>document.getElementById('mapbox-gl-valhalla-costing');

      const options = this.valhalla.getContoursOption();
      for (let i = 0; i < options.length; i += 1) {
        const contour = options[i];
        const contourText: HTMLInputElement = <HTMLInputElement>document.getElementById(`mapbox-gl-valhalla-contour-time-${i}`);
        contour.time = Number(contourText.value);
      }

      this.valhalla.getIsochrone(
        Number(lon.value),
        Number(lat.value),
        ContourType.Time,
        costing.value,
        options,
      );
    });
    this.mainContainer.appendChild(calcButton);

    this.map?.on('moveend', () => {
      const centerMoved = this.map?.getCenter();
      const lon: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lon-time');
      const lat: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lat-time');
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
