
let eventSynthesizerFunction:(uievent:UIEvent)=>void;

function getEventSynthesizier() {
    if (eventSynthesizerFunction) return eventSynthesizerFunction;
    
    let currentMouseTarget:Element|Window|undefined;

    const fireMouseLeaveEvents = (target:Element|Window|undefined, relatedTarget:Element|Window|undefined, uievent:MouseEvent) => {
        if (!target) return;
        const eventInit:MouseEventInit = {
            view: uievent.view,
            clientX: uievent.clientX,
            clientY: uievent.clientY,
            screenX: uievent.screenX,
            screenY: uievent.screenY,
            relatedTarget: relatedTarget
        };
        // fire mouseout
        eventInit.bubbles = true;
        target.dispatchEvent(new MouseEvent('mouseout',eventInit));
        // fire mouseleave events
        eventInit.bubbles = false;
        let el = target;
        do { 
            el.dispatchEvent(new MouseEvent('mouseleave',eventInit));
            el = el['parentElement'];
        } while (el)
    }

    const fireMouseEnterEvents = (target:Element|Window, relatedTarget:Element|Window|undefined, uievent:MouseEvent) => {
        const eventInit:MouseEventInit = {
            view: uievent.view,
            clientX: uievent.clientX,
            clientY: uievent.clientY,
            screenX: uievent.screenX,
            screenY: uievent.screenY,
            relatedTarget: relatedTarget
        };
        // fire mouseover
        eventInit.bubbles = true;
        target.dispatchEvent(new MouseEvent('mouseover',eventInit));
        // fire mouseenter events
        eventInit.bubbles = false;
        let el = target;
        do { 
            el.dispatchEvent(new MouseEvent('mouseenter',eventInit));
            el = el['parentElement'];
        } while (el)
    }

    const firePointerEnterEvents = (target:Element|Window, relatedTarget:any, uievent:PointerEvent) => {
        const bubbles = uievent.bubbles;
        // fire pointerover event
        (<any>uievent).bubbles = true;
        target.dispatchEvent(new PointerEvent('pointerover',uievent));
        // fire pointerenter events
        (<any>uievent).bubbles = false;
        let el = target;
        do { 
            el.dispatchEvent(new PointerEvent('pointerenter',uievent));
            el = el['parentElement'];
        } while (el)
        (<any>uievent).bubbles = bubbles;
    }

    const firePointerLeaveEvents = (target:Element|Window|undefined, relatedTarget:any, uievent:PointerEvent) => {
        if (!target) return;
        // fire pointerover event
        (<any>uievent).bubbles = true;
        target.dispatchEvent(new PointerEvent('pointerout',uievent));
        // fire pointerenter events
        (<any>uievent).bubbles = false;
        let el = target;
        do { 
            el.dispatchEvent(new PointerEvent('pointerleave',uievent));
            el = el['parentElement'];
        } while (el)
    }

    const deserializeTouches = (touches:Touch[], target:Element|Window, uievent:TouchEvent) => {
        touches.forEach((t, i)=>{
            if (document.createTouch) {
                touches[i] = document.createTouch(
                    uievent.view, target, t.identifier, 
                    t.clientX, t.clientY, t.screenX, t.screenY
                );
            } else if (typeof Touch !== undefined) {
                (<any>t).target = target;
                touches[i] = new (<any>Touch)(t);
            }
        })
        return touches;
    }
    

    const touchTargets = {};
    const touchStartTimes = {};

    const pointerTargets = {};
    const capturedPointerTargets = {};

    document.documentElement.addEventListener('gotpointercapture', (e)=>{
        capturedPointerTargets[e.pointerId] = e.target;
    })

    document.documentElement.addEventListener('lostpointercapture', (e)=>{
        delete capturedPointerTargets[e.pointerId];
    })

    Element.prototype.setPointerCapture = function (id) { capturedPointerTargets[id] = this; };
    Element.prototype.releasePointerCapture = function (id) { capturedPointerTargets[id] = null; };

    return eventSynthesizerFunction = (uievent:MouseEvent&WheelEvent&TouchEvent&PointerEvent)=>{
        (<any>uievent).view = window;

        let target : Element;

        switch (uievent.type) {
            case 'wheel':
                target = document.elementFromPoint(uievent.clientX, uievent.clientY) || window;
                target.dispatchEvent(new WheelEvent(uievent.type, uievent));
                break;
            case 'mouseleave':
                target = document.elementFromPoint(uievent.clientX, uievent.clientY) || window;
                fireMouseLeaveEvents(currentMouseTarget, undefined, uievent);
                currentMouseTarget = undefined;
                break;
            case 'mouseenter':
                target = document.elementFromPoint(uievent.clientX, uievent.clientY) || window;
                fireMouseEnterEvents(target, undefined, uievent);
                currentMouseTarget = target;
                break;
            case 'mousemove': 
                target = document.elementFromPoint(uievent.clientX, uievent.clientY) || window;
                if (target !== currentMouseTarget) {
                    fireMouseLeaveEvents(currentMouseTarget, target, uievent);
                    fireMouseEnterEvents(target, currentMouseTarget, uievent);
                    currentMouseTarget = target;
                }
                target.dispatchEvent(new MouseEvent(uievent.type, uievent));
                break;
            case 'touchstart':
                const primaryTouch = uievent.changedTouches[0];
                target = document.elementFromPoint(primaryTouch.clientX, primaryTouch.clientY) || window;
                for (const t of (<Touch[]><any>uievent.changedTouches)) {
                    touchTargets[t.identifier] = target;
                    touchStartTimes[t.identifier] = performance.now();
                }
            case 'touchmove':
            case 'touchend':
            case 'touchcancel':
                target = touchTargets[uievent.changedTouches[0].identifier];

                var evt = document.createEvent('TouchEvent');
                
                let touches = deserializeTouches(<any>uievent.touches, target, uievent);
                let targetTouches = deserializeTouches(<any>uievent.targetTouches, target, uievent);
                let changedTouches = deserializeTouches(<any>uievent.changedTouches, target, uievent);

                if (document.createTouchList) {
                    touches = document.createTouchList.apply(document, touches);
                    targetTouches = document.createTouchList.apply(document, targetTouches);
                    changedTouches = document.createTouchList.apply(document, changedTouches);
                }
                
                // Safari, Firefox: must use initTouchEvent.
                if (typeof evt['initTouchEvent'] === "function") {
                    evt['initTouchEvent'](
                        uievent.type, uievent.bubbles, uievent.cancelable, uievent.view, uievent.detail,
                        uievent.screenX, uievent.screenY, uievent.clientX, uievent.clientY,
                        uievent.ctrlKey, uievent.altKey, uievent.shiftKey, uievent.metaKey,
                        touches, targetTouches, changedTouches, 1.0, 0.0
                    );
                } else if ('TouchEvent' in window && TouchEvent.length > 0) {
                    // Chrome: must use TouchEvent constructor.
                    evt = new (<any>TouchEvent)(uievent.type, {
                        cancelable: uievent.cancelable,
                        bubbles: uievent.bubbles,
                        touches: touches,
                        targetTouches: targetTouches,
                        changedTouches: changedTouches
                    });
                } else {
                    evt.initUIEvent(uievent.type, uievent.bubbles, uievent.cancelable, uievent.view, uievent.detail);
                    (<any>evt).touches = touches;
                    (<any>evt).targetTouches = targetTouches;
                    (<any>evt).changedTouches = changedTouches;
                }

                if (uievent.type === 'touchend' || uievent.type == 'touchcancel') {
                    target.dispatchEvent(evt);
                    const primaryTouch = changedTouches[0];
                    (<any>uievent).clientX = primaryTouch.clientX;
                    (<any>uievent).clientY = primaryTouch.clientY;
                    (<any>uievent).screenX = primaryTouch.screenX;
                    (<any>uievent).screenY = primaryTouch.screenY;
                    (<any>uievent).button = 0;
                    (<any>uievent).detail = 1;
                    if (uievent.type === 'touchend') {
                        if (performance.now() - touchStartTimes[primaryTouch.identifier] < 300 && !evt.defaultPrevented) {
                            target.dispatchEvent(new MouseEvent('mousedown', uievent))
                            target.dispatchEvent(new MouseEvent('mouseup', uievent))
                            target.dispatchEvent(new MouseEvent('click', uievent))
                        }
                    } else {
                        target.dispatchEvent(new MouseEvent('mouseout', uievent))
                    }
                    for (const t of (<Touch[]><any>uievent.changedTouches)) {
                        delete touchTargets[t.identifier];
                        delete touchStartTimes[t.identifier];
                    }
                } else {
                    target.dispatchEvent(evt);
                }

                break;
            case 'pointerenter':
            case 'pointerleave':
            case 'pointermove':
            case 'pointercancel':
            case 'pointerdown':
            case 'pointerup':                        
                const previousTarget = pointerTargets[uievent.pointerId];
                const capturedTarget = target = capturedPointerTargets[uievent.pointerId];

                const isLeaving = uievent.type === 'pointerleave' || uievent.type === 'pointercancel';

                const pointerEvent = new PointerEvent(uievent.type, uievent);
                if (capturedTarget) {
                    capturedTarget.dispatchEvent(pointerEvent);
                } else {
                    target = document.elementFromPoint(uievent.clientX, uievent.clientY) || window;
                    if (target !== previousTarget) {
                        firePointerLeaveEvents(previousTarget, target, uievent);
                        if (!isLeaving) firePointerEnterEvents(target, previousTarget, uievent);
                    }
                    target.dispatchEvent(pointerEvent);
                }
                
                if (isLeaving) {
                    delete pointerTargets[uievent.pointerId];
                } else {
                    pointerTargets[uievent.pointerId] = target;
                }
                
                break;
            default:                            
                target = document.elementFromPoint(uievent.clientX, uievent.clientY) || window;
                target.dispatchEvent(new MouseEvent(uievent.type, uievent));
        }
    };
}

export default (typeof document !== 'undefined' && document.createElement) ? 
    getEventSynthesizier : ()=>{ return undefined; };