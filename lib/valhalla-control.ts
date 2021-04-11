import {
  IControl, Map as MapboxMap,
} from 'mapbox-gl';
import TimeIsochroneControl from './time-isochrone-control';
import DistanceIsochroneControl from './distance-isochrone-control';
import Valhalla, { Contour } from './valhalla';

export type Options = {
  Contours?: Contour[];
}

/**
 * Mapbox GL Valhalla Control.
 */
export default class MapboxValhallaControl implements IControl {
    private controlContainer: HTMLElement;

    private map?: MapboxMap;

    private timeIsochroneControl: TimeIsochroneControl | undefined;

    private distanceIsochroneControl: DistanceIsochroneControl | undefined;

    private url : string;

    private valhalla: Valhalla;

    private options: Options = {
      Contours: [
        {
          time: 5,
          distance: 1,
          color: 'ff0000',
        },
        {
          time: 10,
          distance: 3,
          color: 'ffff00',
        },
        {
          time: 15,
          distance: 5,
          color: '0000ff',
        },
      ],
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

      if (this.map) {
        this.valhalla = new Valhalla(this.map, this.url, this.options.Contours);
      }

      this.controlContainer = document.createElement('div');
      // this.controlContainer.classList.add('mapboxgl-ctrl');
      // this.controlContainer.classList.add('mapboxgl-ctrl-group');

      this.timeIsochroneControl = new TimeIsochroneControl(
        this.map,
        this.valhalla,
      );
      this.controlContainer = this.timeIsochroneControl.addTo(this.controlContainer);

      this.distanceIsochroneControl = new DistanceIsochroneControl(
        this.map,
        this.valhalla,
      );
      this.controlContainer = this.distanceIsochroneControl.addTo(this.controlContainer);

      document.addEventListener('click', this.onDocumentClick);

      return this.controlContainer;
    }

    private onDocumentClick(event: MouseEvent): void {
      if (
        this.controlContainer
        && !this.controlContainer.contains(event.target as Element)
        && this.timeIsochroneControl
        && this.distanceIsochroneControl) {
        this.timeIsochroneControl.hide();
        this.distanceIsochroneControl.hide();
      }
    }

    public onRemove(): void {
      if (!this.controlContainer
        || !this.controlContainer.parentNode
        || !this.map
        || !this.timeIsochroneControl
        || !this.distanceIsochroneControl) {
        return;
      }
      this.timeIsochroneControl.destroy();
      this.distanceIsochroneControl.destroy();
      this.controlContainer.parentNode.removeChild(this.controlContainer);
      document.removeEventListener('click', this.onDocumentClick);

      this.map = undefined;
    }
}
