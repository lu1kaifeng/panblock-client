import type {Coordinate, LayerConfig} from "~/types";

interface CustomOverlayLayerProps {
    map: any;
    L: any;
    coordinates: Coordinate[];
    config: LayerConfig;
}

export const renderCustomOverlayLayer = ({ map, L, coordinates, config }: CustomOverlayLayerProps) => {
    if (!map || !L) return null;

    // Create or retrieve dedicated layer group
    const layerGroup = L.layerGroup();

    if (config.enabled) {
        const activePoints = coordinates.filter((c) => c.active);

        activePoints.forEach((point) => {
            // Create distance radius buffer around coordinate
            const circle = L.circle([point.lat, point.lng], {
                radius: config.radiusKm * 1000, // convert km to meters
                color: config.color,
                fillColor: config.color,
                fillOpacity: config.opacity,
                weight: 2,
                dashArray: '4, 4'
            });

            // Interactive popup for the layer element
            circle.bindTooltip(
                `<div style="font-family: sans-serif; font-size: 11px;">
          <strong>${point.title}</strong><br/>Coverage Radius: ${config.radiusKm} km
        </div>`,
                { sticky: true }
            );

            circle.addTo(layerGroup);
        });

        layerGroup.addTo(map);
    }

    return layerGroup;
};
