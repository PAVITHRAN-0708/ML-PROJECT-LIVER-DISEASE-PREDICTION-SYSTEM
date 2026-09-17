const fs = require('fs');

let hmCode = fs.readFileSync('src/HospitalMap.tsx', 'utf8');

// Replace everything inside computeRoute
hmCode = hmCode.replace(
/const computeRoute = async \(\) => \{[\s\S]*?\} catch \(err: any\) \{/m,
`const computeRoute = async () => {
      try {
        const { Route } = routesLib as any;
        const request = {
          fields: ['routes.polyline.encodedPolyline'],
          origin: userLoc,
          destination: selectedHospital.location,
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE'
        };
        const response = await Route.computeRoutes(request);
        if (isActive && response.routes && response.routes.length > 0) {
          const path = response.routes[0].polyline.encodedPolyline;
          const { encoding } = (await google.maps.importLibrary("geometry")) as any;
          
          currentPolyline = new google.maps.Polyline({
            path: encoding.decodePath(path),
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
      } catch (err: any) {`
);

fs.writeFileSync('src/HospitalMap.tsx', hmCode);
