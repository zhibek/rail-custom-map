import { useState } from 'react';

import { MapboxOverlay as DeckOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import Map, { NavigationControl, useControl } from 'react-map-gl/maplibre';
import {
  EditableGeoJsonLayer,
  DrawPointMode,
  GeoJsonEditMode,
  FeatureCollection,
  GuideFeatureCollection,
  Geometry,
  ModeProps,
  Pick,
  ClickEvent,
  PointerMoveEvent,
} from '@deck.gl-community/editable-layers';

import 'maplibre-gl/dist/maplibre-gl.css';

function DeckGLOverlay(props: React.PropsWithChildren<MapboxOverlayProps>) {
  const overlay = useControl(() => new DeckOverlay(props));
  overlay.setProps(props);
  return props.children;
}

class ConnectPointsMode extends GeoJsonEditMode {
  firstPick: Pick | null = null;

  handleClick({ picks }: ClickEvent, { onEdit, data }: ModeProps<FeatureCollection>) {
    if (picks.length > 0) {
      // find the first point picked
      const selectedPick = picks.find((pick) => pick?.object?.geometry?.type === 'Point');
      if (selectedPick && !this.firstPick) {
        this.firstPick = selectedPick ?? null;
      } else if (selectedPick && this.firstPick?.object) {
        const geometry = {
          type: 'LineString',
          coordinates: [
            this.firstPick?.object?.geometry?.coordinates,
            selectedPick?.object?.geometry?.coordinates,
          ],
        } as Geometry;
        this.firstPick = null;
        onEdit(this.getAddFeatureAction(geometry, data));
      }
    }
  }

  handlePointerMove({ picks }: PointerMoveEvent, { onUpdateCursor }: ModeProps<FeatureCollection>) {
    if (picks.find((pick) => pick?.object?.geometry?.type === 'Point')) {
      onUpdateCursor('cell');
    } else {
      onUpdateCursor(null);
    }
  }

  getGuides({ lastPointerMoveEvent }: ModeProps<FeatureCollection>): GuideFeatureCollection {
    if (!this.firstPick || !lastPointerMoveEvent) {
      return {
        type: 'FeatureCollection',
        features: [],
      };
    }

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            guideType: 'tentative',
          },
          geometry: {
            type: 'LineString',

            coordinates: [
              this.firstPick?.object?.geometry?.coordinates,
              lastPointerMoveEvent.mapCoords,
            ],
          },
        },
      ],
    };
  }
}

function App() {
  const [data, setData] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [-0.1, 51.5],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [2.3, 48.9],
        },
      },
    ],
  });
  const [selectedFeatureIndexes] = useState([]);
  const [mode, setMode] = useState<typeof DrawPointMode | typeof ConnectPointsMode>(() => ConnectPointsMode);

  const layer = new EditableGeoJsonLayer({
    data,
    mode,
    selectedFeatureIndexes,
    onEdit: ({ updatedData }: { updatedData: FeatureCollection }) => {
      setData(updatedData);
      console.log(updatedData);
    },
  });

  const location = {
    latitude: 51.5078,
    longitude: -0.128,
  };

  const zoom = 4;

  const mapStyleUrl = 'https://demotiles.maplibre.org/style.json';

  return (
    <Map
      initialViewState={{
        latitude: location.latitude,
        longitude: location.longitude,
        zoom,
      }}
      mapStyle={mapStyleUrl}
    >
      <NavigationControl position="top-left" />
      <DeckGLOverlay
        interleaved
        layers={[layer]}
        getCursor={(event) => layer.getCursor({ isDragging: event.isDragging }) ?? 'default'}
      >
        <div style={{
          position: 'absolute', top: 0, right: 0, color: 'white',
        }}
        >
          <button
            type="button"
            disabled={mode === DrawPointMode}
            onClick={() => setMode(() => DrawPointMode)}
          >
            Add Points
          </button>
          <button
            type="button"
            disabled={mode === ConnectPointsMode}
            onClick={() => setMode(() => ConnectPointsMode)}
          >
            Connect Points
          </button>
        </div>
      </DeckGLOverlay>
    </Map>
  );
}

export default App;
