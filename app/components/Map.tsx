import {useEffect, useRef, useState} from "react";
import {loadLeaflet} from "~/leaflet"
import {renderCustomOverlayLayer} from "~/layers/CustomOverlayLayer";
import {
    MapPin,
    Layers,
    Globe,
    Plus,
    Trash2,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Eye,
    EyeOff,
    Navigation,
    Compass,
    Sliders,
    Check,
    RotateCcw,
    Info,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    Target
} from 'lucide-react';
import type {Coordinate, LatLng, LayerConfig, MapViewState} from "~/types";

interface MapProps {
    coordinates: Coordinate[];
    layerConfig: LayerConfig;
    onViewStateChange?: (viewState: MapViewState) => void;
    targetFocus?: LatLng | null;
    fitBoundsTrigger?: number;
}

export const Map: React.FC<MapProps> = ({
                                            coordinates,
                                            layerConfig,
                                            onViewStateChange,
                                            targetFocus,
                                            fitBoundsTrigger
                                        }) => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const leafletMapRef = useRef<any>(null);
    const markersGroupRef = useRef<any>(null);
    const customLayerGroupRef = useRef<any>(null);
    const [cursorPos, setCursorPos] = useState<LatLng | null>(null);

    // Initialize Map
    useEffect(() => {
        let isMounted = true;

        loadLeaflet().then((L) => {
            if (!isMounted || !mapRef.current || leafletMapRef.current) return;

            // 1. Instantiate Leaflet Map
            const initialCenter: [number, number] = coordinates[0]
                ? [coordinates[0].lat, coordinates[0].lng]
                : [20, 0];

            const map = L.map(mapRef.current, {
                center: initialCenter,
                zoom: 4,
                zoomControl: false
            });

            leafletMapRef.current = map;

            // 2. Add Google Map Tile Layer (Standard Vector Tiles)
            // Google Tile URL Template: https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}
            L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Maps',
                maxZoom: 20
            }).addTo(map);

            // 3. Initialize Layer Groups
            markersGroupRef.current = L.layerGroup().addTo(map);

            // 4. Track mouse coordinate movement
            map.on('mousemove', (e: any) => {
                setCursorPos({
                    lat: parseFloat(e.latlng.lat.toFixed(4)),
                    lng: parseFloat(e.latlng.lng.toFixed(4))
                });
            });

            // 5. Fire initial bounds calculation
            if (coordinates.length > 0) {
                const bounds = L.latLngBounds(coordinates.map((c) => [c.lat, c.lng]));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        });

        return () => {
            isMounted = false;
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    // Update Markers Layer & Custom Overlay Layer when coordinates or layer settings change
    useEffect(() => {
        const L = (window as any).L;
        const map = leafletMapRef.current;
        if (!L || !map) return;

        // Render Markers
        if (markersGroupRef.current) {
            markersGroupRef.current.clearLayers();

            coordinates
                .filter((c) => c.active)
                .forEach((pt) => {
                    const markerHtml = `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50% 50% 50% 0;
              background: ${pt.color || '#3B82F6'};
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
            </div>
          `;

                    const customIcon = L.divIcon({
                        html: markerHtml,
                        className: 'custom-pin-marker',
                        iconSize: [24, 24],
                        iconAnchor: [12, 24]
                    });

                    const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });
                    marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
              <strong style="color: #0F172A;">${pt.title}</strong><br/>
              <span style="color: #64748B;">Lat: ${pt.lat.toFixed(4)}, Lng: ${pt.lng.toFixed(4)}</span>
            </div>
          `);

                    markersGroupRef.current.addLayer(marker);
                });
        }

        // Render Custom Layer Example
        if (customLayerGroupRef.current) {
            map.removeLayer(customLayerGroupRef.current);
        }

        customLayerGroupRef.current = renderCustomOverlayLayer({
            map,
            L,
            coordinates,
            config: layerConfig
        });
    }, [coordinates, layerConfig]);

    // Handle Target Focus (Fly To)
    useEffect(() => {
        const map = leafletMapRef.current;
        if (map && targetFocus) {
            map.flyTo([targetFocus.lat, targetFocus.lng], 12, { duration: 1.2 });
        }
    }, [targetFocus]);

    // Handle Fit Bounds Trigger
    useEffect(() => {
        const L = (window as any).L;
        const map = leafletMapRef.current;
        if (L && map && fitBoundsTrigger) {
            const activeCoords = coordinates.filter((c) => c.active);
            if (activeCoords.length > 0) {
                const bounds = L.latLngBounds(activeCoords.map((c) => [c.lat, c.lng]));
                map.fitBounds(bounds, { padding: [60, 60] });
            }
        }
    }, [fitBoundsTrigger]);

    const handleZoomIn = () => {
        if (leafletMapRef.current) leafletMapRef.current.zoomIn();
    };

    const handleZoomOut = () => {
        if (leafletMapRef.current) leafletMapRef.current.zoomOut();
    };

    return (
        <div className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden">
            {/* Map Container Element */}
            <div ref={mapRef} className="w-full h-full z-0" />

            {/* Floating Map Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
                <button
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-slate-800 text-slate-200 rounded-lg transition"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-px bg-slate-800 my-0.5" />
                <button
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-slate-800 text-slate-200 rounded-lg transition"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
            </div>

            {/* Bottom Status Cursor Lat/Lng Indicator */}
            {cursorPos && (
                <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 shadow-lg">
                    Lat: <span className="text-blue-400">{cursorPos.lat}</span> | Lng:{' '}
                    <span className="text-blue-400">{cursorPos.lng}</span>
                </div>
            )}
        </div>
    );
};