import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { PanelProps, Vector as VectorData } from '@grafana/data';
import { MapOptions } from '../types';
import 'ol/ol.css';
import { Map, View } from 'ol';
import XYZ from 'ol/source/XYZ';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Heatmap from 'ol/layer/Heatmap';
import Control from 'ol/control/Control';
import nanoid from 'nanoid';
import { processDataES } from './utils/helpers';
import '../style/MainPanel.css';

interface Props extends PanelProps<MapOptions> {}
interface Buffer extends VectorData {
  buffer: any;
}

export class MainPanel extends PureComponent<Props> {
  id = 'id' + nanoid();
  map: Map;
  randomTile: TileLayer;
  markersLayer: VectorLayer;
  heatmapLayer: Heatmap;

  componentDidMount() {
    const {
      tile_url,
      zoom_level,
      markersLayer,
      heatmapLayer,
      marker_radius,
      marker_color,
      marker_stroke,
      heat_radius,
      heat_blur,
      heat_opacity,
    } = this.props.options;
    const { buffer } = this.props.data.series[0].fields[0].values as Buffer;

    const carto = new TileLayer({
      source: new XYZ({
        url: 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      }),
    });
    this.map = new Map({
      layers: [carto],
      view: new View({
        center: fromLonLat(buffer[0].coordinate),
        zoom: zoom_level,
      }),
      target: this.id,
    });

    if (tile_url !== '') {
      this.randomTile = new TileLayer({
        source: new XYZ({
          url: tile_url,
        }),
        zIndex: 1,
      });
      this.map.addLayer(this.randomTile);
    }

    const vectorSource = processDataES(buffer);

    if (markersLayer) {
      this.markersLayer = new VectorLayer({
        source: vectorSource,
        zIndex: 2,
        style: new Style({
          image: new CircleStyle({
            radius: marker_radius,
            fill: new Fill({ color: marker_color }),
            stroke: new Stroke({
              color: marker_stroke,
              width: 1,
            }),
          }),
        }),
      });
      this.map.addLayer(this.markersLayer);
    }

    if (heatmapLayer) {
      this.heatmapLayer = new Heatmap({
        source: vectorSource,
        blur: parseInt(heat_blur, 10),
        radius: parseInt(heat_radius, 10),
        opacity: parseFloat(heat_opacity),
        zIndex: 2,
      });
      this.map.addLayer(this.heatmapLayer);
    }

    const jsx = (
      <select defaultValue={markersLayer ? 'markersLayer' : 'heatmapLayer'} onChange={this.handleSwitch}>
        <option value="markersLayer">Markers</option>
        <option value="heatmapLayer">Heat Map</option>
      </select>
    );
    const div = document.createElement('div');
    div.className = 'ol-control ol-custom-control';
    ReactDOM.render(jsx, div);
    const ctl = new Control({ element: div });
    this.map.addControl(ctl);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.data.series[0] !== this.props.data.series[0]) {
      const { buffer } = this.props.data.series[0].fields[0].values as Buffer;
      const { markersLayer, marker_radius, marker_color, marker_stroke, heatmapLayer, heat_blur, heat_radius, heat_opacity } = this.props.options;

      // remove existing layers
      this.map.removeLayer(this.markersLayer);
      this.map.removeLayer(this.heatmapLayer);

      const vectorSource = processDataES(buffer);

      if (markersLayer) {
        this.markersLayer = new VectorLayer({
          source: vectorSource,
          zIndex: 2,
          style: new Style({
            image: new CircleStyle({
              radius: marker_radius,
              fill: new Fill({ color: marker_color }),
              stroke: new Stroke({
                color: marker_stroke,
                width: 1,
              }),
            }),
          }),
        });
        this.map.addLayer(this.markersLayer);
      }

      if (heatmapLayer) {
        this.heatmapLayer = new Heatmap({
          source: vectorSource,
          blur: parseInt(heat_blur, 10),
          radius: parseInt(heat_radius, 10),
          opacity: parseFloat(heat_opacity),
          zIndex: 2,
        });
        this.map.addLayer(this.heatmapLayer);
      }
    }

    if (prevProps.options.markersLayer !== this.props.options.markersLayer && this.props.options.markersLayer) {
      this.map.removeLayer(this.heatmapLayer);

      const { marker_radius, marker_color, marker_stroke } = this.props.options;
      const { buffer } = this.props.data.series[0].fields[0].values as Buffer;

      const vectorSource = processDataES(buffer);

      this.markersLayer = new VectorLayer({
        source: vectorSource,
        zIndex: 2,
        style: new Style({
          image: new CircleStyle({
            radius: marker_radius,
            fill: new Fill({ color: marker_color }),
            stroke: new Stroke({
              color: marker_stroke,
              width: 1,
            }),
          }),
        }),
      });
      this.map.addLayer(this.markersLayer);
    }

    if (prevProps.options.heatmapLayer !== this.props.options.heatmapLayer && this.props.options.heatmapLayer) {
      this.map.removeLayer(this.markersLayer);

      const { heat_radius, heat_blur, heat_opacity } = this.props.options;
      const { buffer } = this.props.data.series[0].fields[0].values as Buffer;

      const vectorSource = processDataES(buffer);

      this.heatmapLayer = new Heatmap({
        source: vectorSource,
        blur: parseInt(heat_blur, 10),
        radius: parseInt(heat_radius, 10),
        opacity: parseFloat(heat_opacity),
        zIndex: 2,
      });
      this.map.addLayer(this.heatmapLayer);
    }

    if (prevProps.options.tile_url !== this.props.options.tile_url) {
      if (this.randomTile) {
        this.map.removeLayer(this.randomTile);
      }
      if (this.props.options.tile_url !== '') {
        this.randomTile = new TileLayer({
          source: new XYZ({
            url: this.props.options.tile_url,
          }),
          zIndex: 1,
        });
        this.map.addLayer(this.randomTile);
      }
    }

    if (prevProps.options.zoom_level !== this.props.options.zoom_level) {
      this.map.getView().setZoom(this.props.options.zoom_level);
    }

    if (
      prevProps.options.heat_radius !== this.props.options.heat_radius ||
      prevProps.options.heat_blur !== this.props.options.heat_blur ||
      prevProps.options.heat_opacity !== this.props.options.heat_opacity
    ) {
      if (this.props.options.heatmapLayer) {
        const { heat_radius, heat_blur, heat_opacity } = this.props.options;

        this.heatmapLayer.setRadius(parseInt(heat_radius, 10));
        this.heatmapLayer.setBlur(parseInt(heat_blur, 10));
        this.heatmapLayer.setOpacity(parseFloat(heat_opacity));
      }
    }

    if (
      prevProps.options.marker_radius !== this.props.options.marker_radius ||
      prevProps.options.marker_color !== this.props.options.marker_color ||
      prevProps.options.marker_stroke !== this.props.options.marker_stroke
    ) {
      if (this.props.options.markersLayer) {
        const { marker_radius, marker_color, marker_stroke } = this.props.options;
        this.map.removeLayer(this.markersLayer);

        this.markersLayer.setStyle(
          new Style({
            image: new CircleStyle({
              radius: marker_radius,
              fill: new Fill({ color: marker_color }),
              stroke: new Stroke({
                color: marker_stroke,
                width: 1,
              }),
            }),
          })
        );
        this.map.addLayer(this.markersLayer);
      }
    }
  }

  handleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { options, onOptionsChange } = this.props;
    if (e.target.value === 'markersLayer') {
      onOptionsChange({
        ...options,
        markersLayer: true,
        heatmapLayer: false,
      });
    }
    if (e.target.value === 'heatmapLayer') {
      onOptionsChange({
        ...options,
        markersLayer: false,
        heatmapLayer: true,
      });
    }
  };

  render() {
    return <div id={this.id} style={{ width: '100%', height: '100%' }}></div>;
  }
}
