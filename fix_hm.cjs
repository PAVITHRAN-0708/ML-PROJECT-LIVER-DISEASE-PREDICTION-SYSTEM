const fs = require('fs');

const hospitalMapCode = `import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI/180);
  const dLon = (lon2 - lon1) * (Math.PI/180);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function HospitalMap() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: 'calc(100vh - 180px)', minHeight: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e1e7ec', background: '#f8fafc' }}>
      {quotaExceeded && (
        <div style={{ background: '#fffbeb', color: '#78350f', padding: '10px', fontSize: '14px', borderBottom: '1px solid #fde68a', textAlign: 'center' }}>
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 600 }}>
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <APIProvider apiKey={(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''}>
        <HospitalFinder />
      </APIProvider>
    </div>
  );
}

function HospitalFinder() {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const coreLib = useMapsLibrary('core');
  
  const [userLoc, setUserLoc] = useState<google.maps.LatLngLiteral | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [locating, setLocating] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const locateUser = () => {
    setLocating(true);
    setErrorMsg('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        (err) => {
          console.warn("Geolocation failed or denied:", err);
          setErrorMsg("Could not access your location. Using default location (San Francisco). Please allow location permissions to see nearby centers.");
          setUserLoc({ lat: 37.7749, lng: -122.4194 });
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setErrorMsg("Geolocation is not supported by your browser.");
      setUserLoc({ lat: 37.7749, lng: -122.4194 });
      setLocating(false);
    }
  };

  useEffect(() => {
    locateUser();
  }, []);

  useEffect(() => {
    if (!placesLib || !userLoc || !map) return;
    let isActive = true;

    const fetchPlaces = async () => {
      try {
        const { Place } = placesLib as any;
        const request: any = {
          fields: ['displayName', 'location', 'formattedAddress'],
          locationRestriction: { center: userLoc, radius: 10000 },
          includedPrimaryTypes: ['hospital', 'medical_lab', 'doctor'],
          maxResultCount: 10,
        };
        const response = await Place.searchNearby(request);
        if (isActive && response.places) {
          const places = response.places;
          places.forEach((p: any) => {
             const lat2 = typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat;
             const lng2 = typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng;
             p.distanceKm = getDistanceFromLatLonInKm(userLoc.lat, userLoc.lng, lat2, lng2);
          });
          places.sort((a: any, b: any) => a.distanceKm - b.distanceKm);
          setHospitals(places);
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('OVER_QUERY_LIMIT') || err.message.includes('API keys with referer restrictions'))) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        console.error('Places API error:', err);
      }
    };
    fetchPlaces();
    return () => { isActive = false; };
  }, [placesLib, userLoc, map]);

  useEffect(() => {
    if (!routesLib || !map || !userLoc || !selectedHospital) return;
    
    let currentPolyline: google.maps.Polyline | null = null;
    let isActive = true;

    const computeRoute = async () => {
      try {
        const { Route } = routesLib as any;
        const request: any = {
          origin: userLoc,
          destination: selectedHospital.location,
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          fields: ['durationMillis', 'distanceMeters', 'path']
        };
        
        const response = await Route.computeRoutes(request);
        if (isActive && response.routes && response.routes.length > 0) {
          const path = response.routes[0].path;
          
          currentPolyline = new google.maps.Polyline({
            path: path,
            strokeColor: '#005f56',
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: map
          });
          setRoutePolyline(currentPolyline);
          
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(userLoc);
          bounds.extend(selectedHospital.location);
          map.fitBounds(bounds, { bottom: 250, left: 50, right: 50, top: 50 });
        }
      } catch (err: any) {
        if (err.message && err.message.includes('RESOURCE_EXHAUSTED')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        console.error('Routes API error:', err);
      }
    };
    
    if (routePolyline) {
        routePolyline.setMap(null);
    }
    
    computeRoute();
    
    return () => { 
        isActive = false; 
        if (currentPolyline) currentPolyline.setMap(null); 
    };
  }, [routesLib, map, userLoc, selectedHospital]);

  return (
    <>
      <div style={{ flex: '1 1 50%', position: 'relative', minHeight: '300px', borderBottom: '1px solid #e1e7ec' }}>
        {userLoc && (
          <Map
            defaultCenter={userLoc}
            defaultZoom={13}
            mapId="DEMO_MAP_ID"
            disableDefaultUI={true}
            gestureHandling="greedy"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          >
            <AdvancedMarker position={userLoc} zIndex={100} title="Your Location">
              <div style={{ background: '#4285F4', width: '18px', height: '18px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
            </AdvancedMarker>

            {hospitals.map((h, i) => (
              <AdvancedMarker 
                key={i} 
                position={h.location} 
                onClick={() => setSelectedHospital(h)}
                zIndex={selectedHospital === h ? 50 : 10}
              >
                <div style={{ 
                  background: selectedHospital === h ? '#c53030' : '#005f56', 
                  color: 'white', 
                  padding: '8px 14px', 
                  borderRadius: '24px', 
                  fontWeight: '600', 
                  fontSize: '14px',
                  border: '2px solid white',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: selectedHospital === h ? 'scale(1.05)' : 'scale(1)',
                  whiteSpace: 'nowrap'
                }}>
                  {h.displayName}
                </div>
              </AdvancedMarker>
            ))}
          </Map>
        )}

        {/* Floating Top Bar for Locate Button & Errors */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <button 
            onClick={locateUser} 
            disabled={locating}
            style={{ 
              background: 'white', 
              color: '#1a1d20', 
              border: 'none', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              fontWeight: 600, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: locating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            {locating ? 'Locating...' : 'Find My Location'}
          </button>
          
          {errorMsg && (
            <div style={{ background: '#fff0f0', color: '#c53030', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid #ffcfcf', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
              {errorMsg}
            </div>
          )}
        </div>
      </div>
      
      {/* Scrollable List Below Map */}
      <div style={{ flex: '1 1 50%', overflowY: 'auto', background: 'white', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1a1d20' }}>Nearest Test Centers</h3>
        
        {!userLoc || locating ? (
          <div style={{ padding: '16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e1e7ec' }}>
            <p style={{ margin: 0, fontSize: '15px', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                Locating you and finding nearby test centers...
            </p>
          </div>
        ) : hospitals.length === 0 ? (
          <div style={{ padding: '16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e1e7ec' }}>
            <p style={{ margin: 0, fontSize: '15px', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                No medical centers found nearby. Try moving the map or searching a different area.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hospitals.map((h, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedHospital(h)}
                style={{ 
                  border: selectedHospital === h ? '2px solid #005f56' : '1px solid #e1e7ec', 
                  borderRadius: '10px', 
                  padding: '16px', 
                  cursor: 'pointer',
                  background: selectedHospital === h ? '#f0fdfa' : 'white',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedHospital === h ? '0 4px 12px rgba(0,95,86,0.1)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '16px', color: '#1a1d20' }}>{h.displayName}</div>
                  {h.distanceKm !== undefined && (
                     <div style={{ fontSize: '13px', color: '#005f56', fontWeight: 600, background: '#ccfbf1', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                       {h.distanceKm.toFixed(1)} km
                     </div>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#4a5568' }}>{h.formattedAddress}</div>
                
                {selectedHospital === h && (
                  <div style={{ marginTop: '12px', fontSize: '14px', color: '#005f56', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                    Route displayed on map
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
`;

fs.writeFileSync('src/HospitalMap.tsx', hospitalMapCode);
