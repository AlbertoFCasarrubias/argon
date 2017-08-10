/// <reference types="@argonjs/argon" />
/// <reference types="three"/>
/// <reference types="googlemaps"/>

// save some local references to commonly used classes
const Cartesian3 = Argon.Cesium.Cartesian3;
const Quaternion = Argon.Cesium.Quaternion;
const Matrix3 = Argon.Cesium.Matrix3;
const CesiumMath = Argon.Cesium.CesiumMath;
const Matrix4 = Argon.Cesium.Matrix4;

// set up Argon (unlike regular apps, we call initReality instead of init)
const app = Argon.initRealityViewer();

let showUI = false;

const mapElement = document.createElement('div');
const subviewElements = [document.createElement('div'), document.createElement('div')];
mapElement.style.pointerEvents = 'auto';
// mapElement.style.visibility = 'hidden';
mapElement.style.width = '100%';
mapElement.style.height = '50%';
mapElement.style.bottom = '0px';
mapElement.style.position = 'absolute';
mapElement.id = 'map';
subviewElements[0].style.pointerEvents = 'auto';
subviewElements[0].style.width = '100%';
subviewElements[0].style.height = '100%';
subviewElements[0].style.position = 'absolute';
subviewElements[1].style.width = '100%';
subviewElements[1].style.height = '100%';
subviewElements[1].style.position = 'absolute';
subviewElements[1].style.pointerEvents = 'none';
app.view.element.appendChild(subviewElements[0]);
app.view.element.appendChild(subviewElements[1]);
app.view.element.appendChild(mapElement);

// pass a dummy element to avoid webvr polyfill from messing with the streetview canvas
app.view.setLayers([{source: document.createElement('div')}]); 

const resize = ()=> {
    google.maps.event.trigger(map, 'resize');
    setTimeout(() => google.maps.event.trigger(map, 'resize'), 100);
    for (const streetview of streetviews) {
        google.maps.event.trigger(streetview, 'resize');
        setTimeout(() => google.maps.event.trigger(streetview, 'resize'), 50);
        setTimeout(() => google.maps.event.trigger(streetview, 'resize'), 100);
        setTimeout(() => google.maps.event.trigger(streetview, 'resize'), 200);
        setTimeout(() => google.maps.event.trigger(streetview, 'resize'), 300);
        setTimeout(() => google.maps.event.trigger(streetview, 'resize'), 500);
        // ^ because sometimes it doesn't resize right away??
    }
}

class MapToggleControl {

    element = document.createElement('div');

    controlText: HTMLDivElement;

    _showing = false;

    constructor() {

        // Set CSS for the control border.
        const controlUI = document.createElement('div');
        controlUI.style.backgroundColor = '#222';
        controlUI.style.opacity = '0.8';
        controlUI.style.borderRadius = '3px';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginRight = '10px';
        controlUI.style.marginTop = '10px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Click to toggle the map';
        this.element.appendChild(controlUI);

        // Set CSS for the control interior.
        const controlText = this.controlText = document.createElement('div');
        controlText.style.color = '#fff';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.lineHeight = '38px';
        controlText.style.paddingLeft = '10px';
        controlText.style.paddingRight = '10px';
        controlText.innerHTML = 'Show Map';
        controlUI.appendChild(controlText);

        controlUI.addEventListener('click', () => {
            this.showing = !this.showing;
        });
        controlUI.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.showing = !this.showing;
        });
    }

    set showing(value: boolean) {
        this._showing = value;
        if (value) {
            this.controlText.innerHTML = 'Hide Map';
        } else {
            this.controlText.innerHTML = 'Show Map';
        }
        resize();
    }

    get showing() {
        return this._showing;
    }
}


// google street view is our "renderer" here, so we don't need three.js
let map: google.maps.Map;
let streetviews: Array<google.maps.StreetViewPanorama>;
let currentPanoData: google.maps.StreetViewPanoramaData;
const mapToggleControl = new MapToggleControl();


var streetviewOptions = <google.maps.StreetViewPanoramaOptions>{
    zoomControl: false,
    motionTracking: true,
    motionTrackingControl: false
}

const initStreetview = () => {

    // The photosphere is a much nicer viewer
    // google.maps.streetViewViewer = 'photosphere';

    map = new google.maps.Map(mapElement);

    streetviews = [
        new google.maps.StreetViewPanorama(subviewElements[0], streetviewOptions)
        // new google.maps.StreetViewPanorama(subviewElements[1], streetviewOptions)
    ];

    map.setStreetView(streetviews[0]);

    // Enable the pan control so we can customize to trigger device orientation based pose
    streetviews[0].setOptions({ panControl: true, zoomControl: false });
    streetviews[0].controls[google.maps.ControlPosition.TOP_RIGHT].push(mapToggleControl.element);


    // update the pano entity with the appropriate pose
    const elevationService = new google.maps.ElevationService();
    let elevation = 0;

    const identityHeadingPitchRoll = new Argon.Cesium.HeadingPitchRoll;

    google.maps.event.addListener(streetviews[0], 'position_changed', () => {
        const position = streetviews[0].getPosition();
        // update the position with previous elevation
        const positionValue = Cartesian3.fromDegrees(position.lng(), position.lat(), elevation, undefined, scratchCartesian);
        (panoEntity.position as Argon.Cesium.ConstantPositionProperty).setValue(positionValue, Argon.Cesium.ReferenceFrame.FIXED);
        const eusTransform = Argon.eastUpSouthToFixedFrame(positionValue, undefined, scratchMatrix4);
        const eusRotation = Argon.Cesium.Matrix4.getRotation(eusTransform, scratchMatrix3);
        const orientationValue = Argon.Cesium.Quaternion.fromRotationMatrix(eusRotation, scratchQuaternion);
        (panoEntity.orientation as Argon.Cesium.ConstantProperty).setValue(orientationValue);
        // update the position with correct elevation as long as we haven't moved
        elevationService.getElevationForLocations({ locations: [position] }, (results, status) => {
            if (status = google.maps.ElevationStatus.OK) {
                if (google.maps.geometry.spherical.computeDistanceBetween(results[0].location, position) < 10) {
                    elevation = results[0].elevation;
                    const positionValue = Cartesian3.fromDegrees(position.lng(), position.lat(), elevation, undefined, scratchCartesian);
                    (panoEntity.position as Argon.Cesium.ConstantPositionProperty).setValue(positionValue, Argon.Cesium.ReferenceFrame.FIXED);
                }
            }
        });
    })

    app.view.viewportChangeEvent.addEventListener(resize)

    const streetViewService = new google.maps.StreetViewService();

    function setStreetViewPosition(lat: number, lng: number, alt: number) {
        const coords = new google.maps.LatLng(lat, lng);
        streetViewService.getPanorama({
            location: coords,
            radius: 1500, //Number.POSITIVE_INFINITY,
            preference: google.maps.StreetViewPreference.NEAREST,
        }, (data, status) => {
            if (status === google.maps.StreetViewStatus.OK) {
                currentPanoData = data;
                map.setCenter(data.location.latLng);
                map.setZoom(18);
                map.setOptions({ streetViewControl: true })
                elevation = alt || 0;
                streetviews[0].setPano(data.location.pano);
                // streetviews[1].setPano(data.location.pano);
                console.log("Loading initial streetview panorama: " + data.location.shortDescription)
            } else if (status === google.maps.StreetViewStatus.ZERO_RESULTS) {
                // unable to find nearby panorama (what should we do?)
                alert('Unable to locate nearby streetview imagery.');
            } else {
                alert('Error retrieving panorama from streetview service');
            }
        })
    }

    setTimeout(()=>{
        navigator.geolocation.getCurrentPosition((position) => {
            setStreetViewPosition(position.coords.latitude, position.coords.longitude, position.coords.altitude)
        }, (e) => {
            console.error(e.message);
            setStreetViewPosition(33.7756, -84.3963, 297);
        }, {
            enableHighAccuracy: true
        })
    }, 1000);
};

// Create an entity to represent the panorama
const panoEntity = new Argon.Cesium.Entity({
    id:'streetview_pano',
    position: new Argon.Cesium.ConstantPositionProperty(undefined, Argon.Cesium.ReferenceFrame.FIXED),
    orientation: new Argon.Cesium.ConstantProperty(Quaternion.IDENTITY)
});

// Creating a lot of garbage slows everything down. Not fun.
// Let's create some recyclable objects that we can use later.
const scratchMatrix3 = new Matrix3;
const scratchMatrix4 = new Matrix4;
const scratchCartesian = new Cartesian3;
const scratchQuaternion = new Quaternion;
const scratchQuaternionPitch = new Quaternion;
const scratchQuaternionHeading = new Quaternion;

const frustum = new Argon.Cesium.PerspectiveFrustum();

const x90 = Quaternion.fromAxisAngle(Cartesian3.UNIT_X, Math.PI / 2);
const x90Neg = Quaternion.fromAxisAngle(Cartesian3.UNIT_X, - Math.PI / 2);

let lastZoomLevel:number;

const viewport = new Argon.CanvasViewport;
const subviews = <Argon.SerializedSubview[]>[];

const frameStateOptions = {
    overrideStage: true,
    overrideUser: true
}

const scratchHeadingPitchRoll = new Argon.Cesium.HeadingPitchRoll;

// Reality views must raise frame events at regular intervals in order to 
// drive updates for the entire system.
app.device.frameStateEvent.addEventListener((frameState)=>{

    if (frameState.viewport.width === 0 || frameState.viewport.height === 0) return;
    if (!app.session.manager.isConnected) return;

    if (!streetviews) initStreetview();
    if (!app.visibility.isVisible) {
        streetviews[0].setVisible(false);
        streetviews[1] && streetviews[1].setVisible(false);
    }

    // Position the stage as a child of the pano entity
    (app.context.stage.position as Argon.Cesium.ConstantPositionProperty).setValue(Cartesian3.ZERO, panoEntity);
    (app.context.stage.orientation as Argon.Cesium.ConstantProperty).setValue(Quaternion.IDENTITY);

    const time = frameState.time;
    Argon.Viewport.clone(frameState.viewport, viewport);
    Argon.SerializedSubviewList.clone(frameState.subviews, subviews);

    if (app.device.strict || subviews.length > 1) {
        mapToggleControl.element.style.display = 'none';
    } else {
        mapToggleControl.element.style.display = '';
        if (mapToggleControl.showing) {
            const subviewViewport = subviews[0].viewport;
            if (viewport.width < viewport.height) {
                const halfViewportHeight = viewport.height / 2;
                subviewViewport.x = 0;
                subviewViewport.y = halfViewportHeight;
                subviewViewport.width = viewport.width;
                subviewViewport.height = halfViewportHeight;
                mapElement.style.width = '100%';
                mapElement.style.height = '50%';
                mapElement.style.bottom = '0px';
            } else {
                const halfViewportWidth = viewport.width / 2;
                subviewViewport.x = 0;
                subviewViewport.y = 0;
                subviewViewport.width = halfViewportWidth;
                subviewViewport.height = viewport.height;
                mapElement.style.width = '50%';
                mapElement.style.height = '100%';
                mapElement.style.right = '0px';
            }
            Argon.decomposePerspectiveProjectionMatrix(subviews[0].projectionMatrix, frustum);
            frustum.aspectRatio = subviewViewport.width / subviewViewport.height;
            Matrix4.clone(frustum.projectionMatrix, subviews[0].projectionMatrix)
        }
    }
    
    const subviewViewport = subviews[0].viewport;
    let subviewAspect = subviewViewport.width / subviewViewport.height;
    subviewAspect = isFinite(subviewAspect) && subviewAspect !== 0 ? 
        subviewAspect : 1;

    // Get the current pov from streetview
    let orientationValue: Argon.Cesium.Quaternion;
    const pov = streetviews[0].getPov();
    const heading = - pov.heading * CesiumMath.RADIANS_PER_DEGREE;
    const pitch = pov.pitch * CesiumMath.RADIANS_PER_DEGREE;
    Argon.Cesium.HeadingPitchRoll.fromDegrees( pov.heading, 0, pov.pitch + 90, scratchHeadingPitchRoll); 
    orientationValue = Quaternion.fromHeadingPitchRoll(scratchHeadingPitchRoll);
    orientationValue = Quaternion.multiply(x90Neg, orientationValue, orientationValue); // convert from ENU to EUS

    (app.context.user.position as Argon.Cesium.ConstantPositionProperty).setValue(
        Cartesian3.fromElements(0,Argon.AVERAGE_EYE_HEIGHT,0, scratchCartesian), 
        app.context.stage
    );
    (app.context.user.orientation as Argon.Cesium.ConstantProperty).setValue(orientationValue);

    // get the current fov
    let zoomLevel = pov['zoom'] || streetviews[0].getZoom();

    // google streetview uses a non-rectilinear projection which reduces
    // distortion at high fov (which is nice), but we do not yet have
    // a way to specify non-rectilinar projections to apps, so content 
    // may not perfectly match the streetview imagagery at a large fov
    // const MIN_ZOOM_LEVEL = 1.5;

    if (!isFinite(zoomLevel) || app.device.strict || app.session.manager.version[0] === 0) {
        const targetFrustum = Argon.decomposePerspectiveProjectionMatrix(subviews[0].projectionMatrix, frustum)

        // calculate streetview zoom level
        const fovyRad = targetFrustum.fovy;
        const fovxRad = Math.atan(Math.tan(fovyRad * 0.5) * subviewAspect) * 2.0;
        zoomLevel = 1 - Math.log2(fovxRad * Argon.Cesium.CesiumMath.DEGREES_PER_RADIAN / 90);

        // streetviews.forEach((streetview) => {
        //     streetview.setZoom(zoomLevel);
        // });
    }

    // if (zoomLevel < MIN_ZOOM_LEVEL) zoomLevel = MIN_ZOOM_LEVEL;
    if (zoomLevel === 0) zoomLevel = 0.00000001; // because PerspectiveFrustum can't handle 180deg fov

    lastZoomLevel = zoomLevel;

    let fovx = 90 * Math.pow(2, 1 - zoomLevel) * CesiumMath.RADIANS_PER_DEGREE;
    frustum.fov = subviewAspect < 1 ? 
        Math.atan(Math.tan(fovx * 0.5) / subviewAspect) * 2.0 : 
        fovx;
    frustum.aspectRatio = subviewAspect;

    // set the subview fov to match the actual fov
    subviews.forEach((s) => {
        s.projectionMatrix = Matrix4.clone(frustum.projectionMatrix, s.projectionMatrix);
    });

    app.context.user['meta'] = {
        geoHeadingAccuracy: 5, // assume accurate within 5 degrees
        geoVerticalAccuracy: undefined, // unknown
        geoHorizontalAccuracy: 5 // assume accurate within 5 meters
    }

    const contextFrameState = app.device.createContextFrameState(
        time,
        viewport,
        subviews,
        frameStateOptions
    );
    
    app.context.submitFrameState(contextFrameState);
});

let compassControl: HTMLElement;

let timeoutId;
const ensureUIVisible = () => {
    showUI = true;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(()=>{
        showUI = false;
    }, 2000)
}
document.body.addEventListener('touchstart', ensureUIVisible);
document.body.addEventListener('touchmove', ensureUIVisible);
document.body.addEventListener('mousemove', ensureUIVisible);


// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(() => {

    if (!streetviews ||
        streetviews[0].getStatus() !== google.maps.StreetViewStatus.OK ||
        !streetviews[0].getPano()) return;

    if (!compassControl && streetviews[0].getVisible()) {
        compassControl = subviewElements[0].querySelector('.gm-compass') as HTMLElement;
        if (compassControl) {
            compassControl.style.overflow = 'hidden';
            var compassTurnControls = subviewElements[0].querySelectorAll('.gm-compass-turn');
            (compassTurnControls.item(0) as HTMLElement).style.display = 'none';
            (compassTurnControls.item(1) as HTMLElement).style.display = 'none';
        }
    } else {
        compassControl = null;
    }

    // there is 1 subview in monocular mode, 2 in stereo mode   
    const subviews = app.view.subviews;

    if (subviews.length === 1) {
        streetviews[1] && streetviews[1].setVisible(false);
        subviewElements[1].style.visibility = 'hidden';
    } else {
        mapToggleControl.showing = false;
        streetviews[1] = streetviews[1] || new google.maps.StreetViewPanorama(subviewElements[1], streetviewOptions);
        streetviews[1].setVisible(true);
        subviewElements[1].style.visibility = 'visible';
        streetviews[1].setPano(streetviews[0].getPano());
        streetviews[1].setPov(streetviews[0].getPov());
        streetviews[1].setZoom(streetviews[0].getPov()['zoom'] || streetviews[0].getZoom());
    }

    if (mapToggleControl.showing) {
        mapElement.style.visibility = 'visible';
    } else {
        mapElement.style.visibility = 'hidden';
    }

    if (subviews.length === 1 && streetviews[1]) {
        subviewElements[1].style.visibility = 'hidden';
        (subviewElements[1].querySelector('canvas') as HTMLElement).style.visibility = 'hidden';
    }

    for (let subview of subviews) {
        if (subview.index > 1) break;

        // set the viewport for this subview
        const {x, y, width, height} = subview.viewport;
        const subviewElement = subviewElements[subview.index];
        const streetview = streetviews[subview.index];

        subviewElement.style.left = x + 'px';
        subviewElement.style.bottom = y + 'px';
        subviewElement.style.width = width + 'px';
        subviewElement.style.height = height + 'px';
        subviewElement.style.visibility = 'visible';
        (subviewElement.querySelector('canvas') as HTMLElement).style.visibility = 'visible';

        if (!app.focus.hasFocus && !showUI) {
            // when in device orientation mode, hide pretty much all the UI
            subviewElement.style.visibility = 'hidden';
            (subviewElement.querySelector('canvas') as HTMLElement).style.visibility = 'visible';
            // make sure we don't hide the copyright / terms of use links / etc
            const alwaysShownElements = subviewElement.querySelectorAll('.gm-style-cc');
            for (let i = 0; i < alwaysShownElements.length; i++) {
                (alwaysShownElements.item(i) as HTMLElement).style.visibility = 'visible';
            }
        }
    }
})

function rotationMatrixToEulerZXY(mat, result: Argon.Cesium.Cartesian3) {

    const m11 = mat[Matrix3.COLUMN0ROW0];
    const m12 = mat[Matrix3.COLUMN0ROW1];
    const m13 = mat[Matrix3.COLUMN0ROW2];
    const m21 = mat[Matrix3.COLUMN1ROW0];
    const m22 = mat[Matrix3.COLUMN1ROW1];
    const m23 = mat[Matrix3.COLUMN1ROW2];
    const m31 = mat[Matrix3.COLUMN2ROW0];
    const m32 = mat[Matrix3.COLUMN2ROW1];
    const m33 = mat[Matrix3.COLUMN2ROW2];

    result.x = Math.asin(CesiumMath.clamp(m32, - 1, 1));

    if (Math.abs(m32) < 0.99999) {

        result.y = Math.atan2(- m31, m33);
        result.z = Math.atan2(- m12, m22);

    } else {

        result.y = 0;
        result.z = Math.atan2(m21, m11);

    }

    return result;
}
