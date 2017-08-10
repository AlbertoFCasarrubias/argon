console.log('app');

var cssRenderer = new THREE.CSS3DArgonRenderer();
var hud         = new THREE.CSS3DArgonHUD();
app.view.element.appendChild(cssRenderer.domElement);
app.view.element.appendChild(hud.domElement);

// initialize Argon
var app         = Argon.init();
var Cartesian3  = Argon.Cesium.Cartesian3;
var Cesium      = Argon.Cesium;

app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);

// initialize THREE
var scene           = new THREE.Scene();
var camera          = new THREE.PerspectiveCamera();
var userLocation    = new THREE.Object3D;
scene.add(camera);
scene.add(userLocation);

var renderer = new THREE.WebGLRenderer(
{
    alpha: true,
    logarithmicDepthBuffer: true
});

var boxGeoObject    = new THREE.Object3D();
var box             = new THREE.Object3D();
var loader          = new THREE.TextureLoader();

loader.load( "walmart.png", function ( texture )
{
    var geometry = new THREE.BoxGeometry(2, 2, 2);
    var material = new THREE.MeshBasicMaterial( { map: texture } );
    var mesh = new THREE.Mesh( geometry, material );
    box.add( mesh );
});
boxGeoObject.add(box);

var boxGeoEntity = new Argon.Cesium.Entity(
{
    name: "I have a box",
    position: Cartesian3.ZERO,
    orientation: Cesium.Quaternion.IDENTITY
});


// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
var boxInit = false;

app.updateEvent.addEventListener(function (frame) {
    // get the position and orientation (the 'pose') of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);

    // assuming we know the user's pose, set the position of our
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
    else {
        // if we don't know the user pose we can't do anything
        return;
    }
    // the first time through, we create a geospatial position for
    // the box somewhere near us
    if (!boxInit) {
        var defaultFrame = app.context.getDefaultReferenceFrame();

        // set the box's position to 10 meters away from the user.
        // First, clone the userPose postion, and add 10 to the X
        var boxPos_1 = userPose.position.clone();
        boxPos_1.x += 10;

        // set the value of the box Entity to this local position, by
        // specifying the frame of reference to our local frame
        boxGeoEntity.position.setValue(boxPos_1, defaultFrame);

        // orient the box according to the local world frame
        boxGeoEntity.orientation.setValue(Cesium.Quaternion.IDENTITY);

        // now, we want to move the box's coordinates to the FIXED frame, so
        // the box doesn't move if the local coordinate system origin changes.
        if (Argon.convertEntityReferenceFrame(boxGeoEntity, frame.time, ReferenceFrame.FIXED)) {
            scene.add(boxGeoObject);
            boxInit = true;
        }
    }
    // get the local coordinates of the local box, and set the THREE object
    var boxPose = app.context.getEntityPose(boxGeoEntity);
    boxGeoObject.position.copy(boxPose.position);
    boxGeoObject.quaternion.copy(boxPose.orientation);

    // rotate the boxes at a constant speed, independent of frame rates
    // to make it a little less boring
    box.rotateY(3 * frame.deltaTime / 10000);
});


renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);
