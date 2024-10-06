import { useState } from 'react';

import DeckGL from 'deck.gl';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import {
  EditableGeoJsonLayer,
  DrawLineStringMode,
  FeatureCollection,
} from '@deck.gl-community/editable-layers';

function App() {
  const [data, setData] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });
  const [selectedFeatureIndexes] = useState([]);

  const layer = new EditableGeoJsonLayer({
    data,
    mode: DrawLineStringMode,
    modeConfig: { formatTooltip: () => null },
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
    <DeckGL
      initialViewState={{
        latitude: location.latitude,
        longitude: location.longitude,
        zoom,
      }}
      controller={{
        doubleClickZoom: false,
      }}
      layers={[layer]}
      getCursor={(event) => layer.getCursor({ isDragging: event.isDragging }) ?? 'default'}
    >
      <Map
        mapStyle={mapStyleUrl}
        hash
      >
        <NavigationControl />
        <Marker
          latitude={location.latitude}
          longitude={location.longitude}
          color="red"
        />
      </Map>
    </DeckGL>
  );
}

export default App;
