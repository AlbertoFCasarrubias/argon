/// <reference types="cesium" />
import { SerializedEntityState } from './common';
import { Entity, JulianDate, PerspectiveFrustum, PerspectiveOffCenterFrustum, Quaternion, Cartesian3, ReferenceFrame, Matrix4, Transforms, Cartographic } from './cesium/cesium-imports';
export * from './utils/command-queue';
export * from './utils/event';
export * from './utils/message-channel';
export { default as getEventSynthesizier } from './utils/ui-event-synthesizer';
export { default as createEventForwarder } from './utils/ui-event-forwarder';
export declare function isNativeFunction(f: Function): boolean;
export declare const hasNativeWebVRImplementation: boolean;
export declare const suggestedWebGLContextAntialiasAttribute: boolean;
export declare function stringIdentifierFromReferenceFrame(referenceFrame: string | ReferenceFrame | Entity): string;
export declare function jsonEquals(left?: {}, right?: {}): boolean;
/**
 * Computes a 4x4 transformation matrix from a reference frame with an east-up-south axes centered at the provided origin to the provided ellipsoid's fixed reference frame. The local axes are defined as:
 * The x axis points in the local east direction.
 * The y axis points in the points in the direction of the ellipsoid surface normal which passes through the position..
 * The z axis points in the local south direction.
 */
export declare const eastUpSouthToFixedFrame: Transforms.ConversionFunction;
/**
 * Get array of ancestor reference frames of a Cesium Entity, ordered from
 * farthest ancestor to the passed frame, excluding the passed frame.
 * @param frame A Cesium Entity to get ancestor reference frames.
 * @param frames An array of reference frames of the Cesium Entity.
 */
export declare function getAncestorReferenceFrames(frame: Entity, result?: never[]): (Entity | ReferenceFrame)[];
/**
 * Get array of ancestor reference frames of a Cesium Entity, ordered from
 * farthest ancestor which has a valid pose to the passed frame, excluding the passed frame.
 * @param frame A Cesium Entity to get ancestor reference frames.
 * @param frames An array of reference frames of the Cesium Entity.
 */
export declare function getReachableAncestorReferenceFrames(frame: Entity, time: JulianDate, result?: never[]): (Entity | ReferenceFrame)[];
/**
 * Gets the value of the Position property at the provided time and in the provided reference frame.
 * @param entity The entity to get position.
 * @param time The time for which to retrieve the value.
 * @param referenceFrame The desired referenceFrame of the result.
 * @param result The object to store the value into.
 * @return The modified result parameter.
 */
export declare function getEntityPositionInReferenceFrame(entity: Entity, time: JulianDate, referenceFrame: Entity | ReferenceFrame, result: Cartesian3): Cartesian3 | undefined;
/**
 * Alias of getEntityPositionInReferenceFrame
 */
export declare const getEntityPosition: typeof getEntityPositionInReferenceFrame;
/**
 * Get the value of the Orientation property at the provided time and in the provided reference frame.
 * @param entity The entity to get position.
 * @param time The time for which to retrieve the value.
 * @param referenceFrame The desired referenceFrame of the result.
 * @param result The object to store the value into.
 * @return The modified result parameter.
 */
export declare function getEntityOrientationInReferenceFrame(entity: Entity, time: JulianDate, referenceFrame: ReferenceFrame | Entity, result: Quaternion): Quaternion | undefined;
/**
 * Alias of getEntityOrientationInReferenceFrame
 */
export declare const getEntityOrientation: typeof getEntityOrientationInReferenceFrame;
/**
 * Create a SerializedEntityPose from a source entity.
 * @param entity The entity which the serialized pose represents.
 * @param time The time which to retrieve the pose.
 * @param referenceFrame The reference frame to use for generating the pose.
 * If a target reference frame is not provided, the entity pose will be
 * serialized according to the furthest ancestor frame that resolves to a valid pose.
 * @return An EntityPose object with orientation, position and referenceFrame.
 */
export declare function getSerializedEntityState(entity: Entity, time: JulianDate, frame?: ReferenceFrame | Entity): SerializedEntityState | null;
/**
 * If urlParser does not have a value, throw error message "resolveURL requires DOM api".
 * If inURL is undefined, throw error message "expected inURL".
 * Otherwise, assign value of inURL to urlParser.href.
 * @param inURL A URL needed to be resolved.
 * @returns A URL ready to be parsed.
 */
export declare function resolveURL(inURL: string): string;
/**
 * Parse URL to an object describing details of the URL with href, protocol,
 * hostname, port, pathname, search, hash, host.
 * @param inURL A URL needed to be parsed.
 * @return An object showing parsed URL with href, protocol,
 * hostname, port, pathname, search, hash, host.
 */
export declare function parseURL(inURL: string): {
    href: string;
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    host: string;
};
export declare function resolveElement(elementOrSelector: string | HTMLElement): Promise<{}>;
export declare function decomposePerspectiveOffCenterProjectionMatrix(mat: Matrix4, result: PerspectiveOffCenterFrustum): PerspectiveOffCenterFrustum;
export declare function decomposePerspectiveProjectionMatrix(mat: Matrix4, result: PerspectiveFrustum): PerspectiveFrustum;
/**
 * Convert an Entity's position and orientation properties to a new reference frame.
 * The properties must be constant properties.
 * @param entity The entity to convert.
 * @param time The time which to retrieve the pose up the reference chain.
 * @param referenceFrame The reference frame to convert the position and oriention to.
 * @return a boolean indicating success or failure.  Will be false if either property is
 * not constant, or if either property cannot be converted to the new frame.
 */
export declare function convertEntityReferenceFrame(entity: Entity, time: JulianDate, frame: ReferenceFrame | Entity): boolean;
export declare const isIOS: boolean;
export declare const isAndroid: boolean;
export declare function installArgonApp(): void;
export declare function openInArgonApp(): void;
declare const rAF: any;
declare const cAF: any;
export { rAF as requestAnimationFrame, cAF as cancelAnimationFrame };
export declare function deprecated(alternative?: string): MethodDecorator;
export declare const defaultTerrainProvider: any;
export declare function updateHeightFromTerrain(cartographic: Cartographic): Promise<Cartographic>;
