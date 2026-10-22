import type L from 'leaflet';

export const loadLeaflet = (): Promise<typeof L> => {
    return new Promise((resolve, reject) => {
        if ((window as any).L) {
            resolve((window as any).L);
            return;
        }

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve((window as any).L);
            script.onerror = () => reject(new Error('Failed to load Leaflet library'));
            document.head.appendChild(script);
        } else {
            const interval = setInterval(() => {
                if ((window as any).L) {
                    clearInterval(interval);
                    resolve((window as any).L);
                }
            }, 50);
        }
    });
};