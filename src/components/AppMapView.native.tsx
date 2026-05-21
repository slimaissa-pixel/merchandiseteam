import MapView, { Marker, PROVIDER_DEFAULT, Region, MapViewProps } from 'react-native-maps';
import { NATIVE_MAP_STYLES, MAP_DEFAULTS } from '../config/mainMap';
import React from 'react';

const AppMapView = React.forwardRef<MapView, any>((props, ref) => {
    const { onMapPress, ...otherProps } = props;
    return (
        <MapView
            ref={ref}
            customMapStyle={props.userInterfaceStyle === 'dark' ? NATIVE_MAP_STYLES.dark as any : NATIVE_MAP_STYLES.standard as any}
            initialRegion={props.initialRegion || MAP_DEFAULTS.INITIAL_REGION}
            onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
            {...otherProps}
        />
    );
});

export { Marker, PROVIDER_DEFAULT };
export type { Region };
export default AppMapView;
