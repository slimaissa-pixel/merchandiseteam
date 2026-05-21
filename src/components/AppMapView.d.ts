import React from 'react';
import { MapViewProps as RNMapViewProps, Region, PROVIDER_DEFAULT as RN_PROVIDER_DEFAULT, Marker as RNMarker } from 'react-native-maps';

export const Marker: typeof RNMarker;
export const PROVIDER_DEFAULT: typeof RN_PROVIDER_DEFAULT;
export type { Region };

export interface MapViewProps extends RNMapViewProps {
    showStyleSelector?: boolean;
    showControls?: boolean;
    showPlacePicker?: boolean;
    clusters?: boolean;
    autoFit?: boolean;
    onMapPress?: (loc: any) => void;
}

export default class MapView extends React.Component<MapViewProps> { }
