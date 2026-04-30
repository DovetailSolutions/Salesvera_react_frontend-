import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

const LIBRARIES = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "320px", borderRadius: "12px" };
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India centroid fallback

/**
 * MapPicker
 * Props:
 *  - apiKey      : string  — your Google Maps API key
 *  - address     : string  — built from the form's address fields; used to geocode + center the map
 *  - lat         : number | ""
 *  - lng         : number | ""
 *  - onChange    : ({ lat, lng }) => void  — called when marker is placed/moved
 */
export default function MapPicker({ apiKey, address, lat, lng, onChange }) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries: LIBRARIES,
    });

    const [markerPos, setMarkerPos] = useState(
        lat && lng ? { lat: Number(lat), lng: Number(lng) } : null
    );
    const [mapCenter, setMapCenter] = useState(
        lat && lng ? { lat: Number(lat), lng: Number(lng) } : DEFAULT_CENTER
    );
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState("");
    const geocoderRef = useRef(null);
    const lastGeocodedAddress = useRef("");

    /* Sync external lat/lng changes (e.g. user types directly into the number inputs) */
    useEffect(() => {
        if (lat && lng) {
            const pos = { lat: Number(lat), lng: Number(lng) };
            setMarkerPos(pos);
            setMapCenter(pos);
        }
    }, [lat, lng]);

    /* Geocode the address string whenever it changes (debounced 800 ms) */
    useEffect(() => {
        if (!isLoaded || !address || address === lastGeocodedAddress.current) return;
        if (lat && lng) return; // user already has a pinpoint — don't override

        const timer = setTimeout(() => {
            if (!geocoderRef.current) {
                geocoderRef.current = new window.google.maps.Geocoder();
            }
            setGeocoding(true);
            setGeocodeError("");

            geocoderRef.current.geocode({ address }, (results, status) => {
                setGeocoding(false);
                if (status === "OK" && results[0]) {
                    const loc = results[0].geometry.location;
                    const pos = { lat: loc.lat(), lng: loc.lng() };
                    setMapCenter(pos);
                    lastGeocodedAddress.current = address;
                } else if (status !== "ZERO_RESULTS") {
                    setGeocodeError("Couldn't locate this address on the map.");
                }
            });
        }, 800);

        return () => clearTimeout(timer);
    }, [isLoaded, address, lat, lng]);

    const handleMapClick = useCallback(
        (e) => {
            const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setMarkerPos(pos);
            onChange(pos);
        },
        [onChange]
    );

    const handleMarkerDrag = useCallback(
        (e) => {
            const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setMarkerPos(pos);
            onChange(pos);
        },
        [onChange]
    );

    if (loadError) {
        return (
            <div className="flex items-center gap-2 text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Failed to load Google Maps. Check your API key.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200 h-20">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading map…
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Status bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {geocoding
                        ? "Locating address…"
                        : markerPos
                            ? `Pinned at ${markerPos.lat.toFixed(6)}, ${markerPos.lng.toFixed(6)}`
                            : "Click the map to pin a location"}
                </span>
                {markerPos && (
                    <button
                        type="button"
                        onClick={() => { setMarkerPos(null); onChange({ lat: "", lng: "" }); }}
                        className="text-rose-400 hover:text-rose-600 transition-colors"
                    >
                        Clear pin
                    </button>
                )}
            </div>

            {geocodeError && (
                <p className="text-[11px] text-amber-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {geocodeError}
                </p>
            )}

            {/* The map */}
            <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={mapCenter}
                zoom={markerPos ? 15 : 12}
                onClick={handleMapClick}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    clickableIcons: false,
                }}
            >
                {markerPos && (
                    <Marker
                        position={markerPos}
                        draggable
                        onDragEnd={handleMarkerDrag}
                    />
                )}
            </GoogleMap>
        </div>
    );
}