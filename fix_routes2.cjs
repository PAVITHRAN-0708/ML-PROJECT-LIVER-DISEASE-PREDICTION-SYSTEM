const fs = require('fs');

let hmCode = fs.readFileSync('src/HospitalMap.tsx', 'utf8');

hmCode = hmCode.replace(
/const computeRoute = async \(\) => \{[\s\S]*?\} catch \(err: any\) \{/m,
`const computeRoute = async () => {
      try {
        const { Route } = routesLib as any;
        const request = {
          origin: userLoc,
          destination: selectedHospital.location,
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE'
        };
        // In the Maps JS API for Route.computeRoutes(), 
        // you omit 'fields' in request, or set 'fields: ['*']'. Let's avoid field mask errors by not passing it.
        // Wait, Route.computeRoutes REQUIRES a field mask or it fails.
        // The valid fields are 'durationMillis', 'distanceMeters', 'polyline', 'path' ?
        // Let's use 'routes.path' because the class is Route and its property is path. Wait! No!
        // The REST field is 'routes.duration', but JS API is 'routes.durationMillis'? No, JS API computeRoutes takes field names without 'routes.' ?
        // Actually, if we look at the earlier grep: "Field mask of Route-level duration, distance, and path: fields: ['durationMillis', 'distanceMeters', 'path']"
        // Let's use fields: ['durationMillis', 'distanceMeters', 'path'].
        request.fields = ['durationMillis', 'distanceMeters', 'path'];
        
        const response = await Route.computeRoutes(request);
        if (isActive && response.routes && response.routes.length > 0) {
          // JS API Route object has 'path' property which is an array of LatLngAltitude
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
      } catch (err: any) {`
);

fs.writeFileSync('src/HospitalMap.tsx', hmCode);
