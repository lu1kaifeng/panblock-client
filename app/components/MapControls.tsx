import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import type {Coordinate, LayerConfig} from "~/types";

interface MapControlsProps {
    coordinates: Coordinate[];
    onAddCoordinate: (coord: Omit<Coordinate, 'id'>) => void;
    onToggleCoordinate: (id: string) => void;
    onDeleteCoordinate: (id: string) => void;
    onFocusCoordinate: (lat: number, lng: number) => void;
    onFitBounds: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    layerConfig: LayerConfig;
    onUpdateLayerConfig: (config: LayerConfig) => void;
    selectedPreset: string;
    onSelectPreset: (presetKey: string) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
                                                            coordinates,
                                                            onAddCoordinate,
                                                            onToggleCoordinate,
                                                            onDeleteCoordinate,
                                                            onFocusCoordinate,
                                                            onFitBounds,
                                                            onZoomIn,
                                                            onZoomOut,
                                                            layerConfig,
                                                            onUpdateLayerConfig,
                                                            selectedPreset,
                                                            onSelectPreset
                                                        }) => {
    // Form state for adding new coordinates
    const [title, setTitle] = useState('');
    const [latStr, setLatStr] = useState('');
    const [lngStr, setLngStr] = useState('');
    const [color, setColor] = useState('#3B82F6');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            alert('Please enter valid numerical latitude (-90 to 90) and longitude (-180 to 180)');
            return;
        }

        if (!title.trim()) {
            alert('Please enter a location title');
            return;
        }

        onAddCoordinate({
            title,
            lat,
            lng,
            color,
            active: true,
            category: 'Custom'
        });

        setTitle('');
        setLatStr('');
        setLngStr('');
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200 w-full md:w-96 overflow-y-auto custom-scrollbar p-4 space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-slate-100">Google Map Tiles Engine</h2>
                        <p className="text-xs text-slate-400">React TypeScript Map & Coordinates Manager</p>
                    </div>
                </div>
            </div>

            {/* Preset Dataset Selector */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    Preset Locations
                </label>
                <select
                    value={selectedPreset}
                    onChange={(e) => onSelectPreset(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                    <option value="landmarks">Global Landmarks</option>
                    <option value="techHubs">Major Tech Epicenters</option>
                    <option value="capitals">European Capitals</option>
                </select>
            </div>

            {/* Single Example Custom Layer Controls */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-xs text-slate-200">Custom Layer Example</span>
                    </div>
                    <button
                        onClick={() => onUpdateLayerConfig({ ...layerConfig, enabled: !layerConfig.enabled })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                            layerConfig.enabled
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {layerConfig.enabled ? 'Active' : 'Disabled'}
                    </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                    {layerConfig.description}
                </p>

                {layerConfig.enabled && (
                    <div className="pt-2 border-t border-slate-700/60 space-y-2.5 text-xs">
                        <div>
                            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                                <span>Coverage Radius</span>
                                <span className="font-mono text-purple-400">{layerConfig.radiusKm} km</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="500"
                                step="10"
                                value={layerConfig.radiusKm}
                                onChange={(e) =>
                                    onUpdateLayerConfig({ ...layerConfig, radiusKm: parseInt(e.target.value) })
                                }
                                className="w-full accent-purple-500 cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-300">Layer Color</span>
                            <input
                                type="color"
                                value={layerConfig.color}
                                onChange={(e) => onUpdateLayerConfig({ ...layerConfig, color: e.target.value })}
                                className="w-6 h-6 bg-transparent cursor-pointer border-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Add New Coordinate Form */}
            <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-3">
        <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          Add New Coordinate
        </span>

                <input
                    type="text"
                    placeholder="Location Title (e.g. Eiffel Tower)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />

                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        step="any"
                        placeholder="Latitude (Lat)"
                        value={latStr}
                        onChange={(e) => setLatStr(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <input
                        type="number"
                        step="any"
                        placeholder="Longitude (Lng)"
                        value={lngStr}
                        onChange={(e) => setLngStr(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Marker Color</span>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-6 h-6 bg-transparent cursor-pointer border-none"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition shadow-md shadow-blue-600/20"
                >
                    Add to Map
                </button>
            </form>

            {/* Coordinate List */}
            <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                    <span>Active Coordinates ({coordinates.filter((c) => c.active).length})</span>
                    <button
                        onClick={onFitBounds}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                    >
                        <Maximize2 className="w-3 h-3" />
                        Fit All
                    </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {coordinates.map((coord) => (
                        <div
                            key={coord.id}
                            className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                                coord.active
                                    ? 'bg-slate-800/80 border-slate-700/80'
                                    : 'bg-slate-900/40 border-slate-800/60 opacity-50'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: coord.color || '#3B82F6' }}
                                />
                                <div className="min-w-0">
                                    <div className="font-semibold text-xs text-slate-200 truncate">{coord.title}</div>
                                    <div className="text-[10px] font-mono text-slate-400 truncate">
                                        {coord.lat.toFixed(4)}, {coord.lng.toFixed(4)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onFocusCoordinate(coord.lat, coord.lng)}
                                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-blue-400 rounded"
                                    title="Fly to Location"
                                >
                                    <Navigation className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => onToggleCoordinate(coord.id)}
                                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 rounded"
                                    title={coord.active ? 'Hide Marker' : 'Show Marker'}
                                >
                                    {coord.active ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => onDeleteCoordinate(coord.id)}
                                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded"
                                    title="Remove Coordinate"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
