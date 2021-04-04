import {
  IControl, Map as MapboxMap, LngLat,
} from 'mapbox-gl';
import CrosshairManager from './crosshair-manager';
import Valhalla, { Costing, Contour, ContourType } from './valhalla';

export type Options = {
  Contours?: Contour[];
  Crosshair?: boolean;
}

/**
 * Mapbox GL Valhalla Control.
 */
export default class MapboxValhallaControl implements IControl {
    private controlContainer: HTMLElement;

    private mainContainer: HTMLElement;

    private map?: MapboxMap;

    private valhalla: Valhalla;

    private mainButton: HTMLButtonElement;

    private crosshair: CrosshairManager | undefined;

    private url : string;

    private options: Options = {
      Contours: [
        {
          time: 5,
          color: 'ff0000',
        },
        {
          time: 10,
          color: 'ffff00',
        },
        {
          time: 15,
          color: '0000ff',
        },
      ],
      Crosshair: true,
    }

    constructor(url: string, options: Options) {
      this.url = url;
      if (options) {
        this.options = Object.assign(this.options, options);
      }
      this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    public getDefaultPosition(): string {
      const defaultPosition = 'top-right';
      return defaultPosition;
    }

    public onAdd(map: MapboxMap): HTMLElement {
      this.map = map;
      this.controlContainer = document.createElement('div');
      this.controlContainer.classList.add('mapboxgl-ctrl');
      this.controlContainer.classList.add('mapboxgl-ctrl-group');
      this.mainContainer = document.createElement('div');
      this.mainContainer.classList.add('mapboxgl-valhalla-list');
      this.mainButton = document.createElement('button');
      this.mainButton.classList.add('mapboxgl-ctrl-icon');
      this.mainButton.classList.add('mapboxgl-valhalla-control');
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

      const tr1 = this.createSelection(
        Costing, 'Means of transport', 'costing', Costing.Walking, (data, key) => data[key],
      );
      table.appendChild(tr1);

      const center = this.map?.getCenter();
      const tr2 = this.createTextbox('Longitude', 'lon', center.lng, true);
      table.appendChild(tr2);

      const tr3 = this.createTextbox('Latitude', 'lat', center.lat, true);
      table.appendChild(tr3);

      if (this.map) {
        this.valhalla = new Valhalla(this.map, this.url, this.options.Contours);
      }
      const calcButton = document.createElement('button');
      calcButton.textContent = 'Calculate';
      calcButton.classList.add('calc-button');
      calcButton.addEventListener('click', () => {
        const lon: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lon');
        const lat: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lat');
        const costing: HTMLSelectElement = <HTMLSelectElement>document.getElementById('mapbox-gl-valhalla-costing');

        this.valhalla.getIsochrone(
          Number(lon.value),
          Number(lat.value),
          costing.value,
          ContourType.Time,
        );
      });
      this.mainContainer.appendChild(calcButton);

      this.map?.on('moveend', () => {
        const centerMoved = this.map?.getCenter();
        const lon: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lon');
        const lat: HTMLInputElement = <HTMLInputElement>document.getElementById('mapbox-gl-valhalla-lat');
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

      return this.controlContainer;
    }

    public onRemove(): void {
      if (!this.controlContainer
        || !this.controlContainer.parentNode
        || !this.map
        || !this.mainButton) {
        return;
      }
      this.mainButton.removeEventListener('click', this.onDocumentClick);
      this.controlContainer.parentNode.removeChild(this.controlContainer);
      document.removeEventListener('click', this.onDocumentClick);

      if (this.crosshair !== undefined) {
        this.crosshair.destroy();
        this.crosshair = undefined;
      }

      this.map = undefined;
    }

    private onDocumentClick(event: MouseEvent): void {
      if (
        this.controlContainer
        && !this.controlContainer.contains(event.target as Element)
        && this.mainContainer
        && this.mainButton) {
        this.mainContainer.style.display = 'none';
        this.mainButton.style.display = 'block';
        this.toggleCrosshair(false);
      }
    }

    private createSelection(
      data : Object,
      title: string,
      type:string,
      defaultValue: any,
      converter: Function,
    ): HTMLElement {
      const label = document.createElement('label');
      label.textContent = title;

      const content = document.createElement('select');
      content.setAttribute('id', `mapbox-gl-valhalla-${type}`);
      content.style.width = '100%';
      Object.keys(data).forEach((key) => {
        const optionLayout = document.createElement('option');
        optionLayout.setAttribute('value', converter(data, key));
        optionLayout.appendChild(document.createTextNode(key));
        optionLayout.setAttribute('name', type);
        if (defaultValue === data[key]) {
          optionLayout.selected = true;
        }
        content.appendChild(optionLayout);
      });

      const tr1 = document.createElement('TR');
      const tdLabel = document.createElement('TD');
      const tdContent = document.createElement('TD');
      tdLabel.appendChild(label);
      tdContent.appendChild(content);
      tr1.appendChild(tdLabel);
      tr1.appendChild(tdContent);
      return tr1;
    }

    private createTextbox(
      title: string,
      type:string,
      defaultValue: any,
      readOnly: boolean,
    ): HTMLElement {
      const label = document.createElement('label');
      label.textContent = title;

      const content = document.createElement('input');
      content.setAttribute('id', `mapbox-gl-valhalla-${type}`);
      content.setAttribute('type', 'text');
      content.setAttribute('value', defaultValue);
      content.readOnly = readOnly;

      const tr1 = document.createElement('TR');
      const tdLabel = document.createElement('TD');
      const tdContent = document.createElement('TD');
      tdLabel.appendChild(label);
      tdContent.appendChild(content);
      tr1.appendChild(tdLabel);
      tr1.appendChild(tdContent);
      return tr1;
    }

    private toggleCrosshair(state: boolean) {
      if (this.options.Crosshair === true) {
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
}
