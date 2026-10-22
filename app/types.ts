export interface LatLng {
    lat: number;
    lng: number;
}

export interface Coordinate extends LatLng {
    id: string;
    title: string;
    category?: string;
    color?: string;
    active: boolean;
    notes?: string;
}

export interface LayerConfig {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    radiusKm: number; // Single layer configuration example
    color: string;
    opacity: number;
}

export interface MapViewState {
    center: LatLng;
    zoom: number;
    bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    } | null;
}