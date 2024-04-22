import React, {CSSProperties, KeyboardEventHandler, MouseEventHandler, useEffect, useRef, useState} from 'react';
import {Grid} from './Grid';
import {Vector2d} from '../2d/Vector2d';
import {Matrix3x3} from '../2d/Matrix3x3';

export type m3x3 = [[number, number, number], [number, number, number], [number, number, number]];

export interface View2dProps {
    canvasId?: string;
    width: number;
    height: number;
    initialPixPrUnit?: number;
    zoomAllowed?: boolean;
    panAllowed?: boolean;
    gridSizeFactor?: number;
    onMouseDown?: MouseEventHandler | undefined;
    onMouseUp?: MouseEventHandler | undefined;
    onWheel?: MouseEventHandler | undefined;
    onMouseMove?: MouseEventHandler | undefined;
    onKeyDown?: KeyboardEventHandler | undefined;
    onKeyUp?: KeyboardEventHandler | undefined;
    repaint?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, real2view: m3x3) => void;
    styles?: CSSProperties | undefined;
    dummy?: number;
    unitMultiplier?: number;
}

const defaultCenter: Vector2d = new Vector2d(0, 0);
const defaultPixPrUnit = 5;

export const View2d = (props: View2dProps) => {
    const defaultGridSizeFactor = 1.3;

    // The real world coordinates of the position in the middle of the screen
    const [realCenter, setRealCenter] = useState(defaultCenter);

    // Zoom level measured in pixels pr real world unit
    const [pixPrUnit, setPixPrUnit] = useState(props.initialPixPrUnit ?? defaultPixPrUnit);

    // Current mouse position in View2d coordinates
    const [mousePos, setMousePos] = useState(new Vector2d(0, 0));

    // Flag indicating if mouse button is pressed
    const [mouseDown, setMouseDown] = useState(false);

    const canvasId = props.canvasId ?? 'view2d';

    const unitMultiplier: number = (props.unitMultiplier === 0 || props.unitMultiplier === undefined)
        ? 1
        : props.unitMultiplier

    const unitScaleRef = useRef<number>(unitMultiplier);

    useEffect(() => repaint(), [realCenter, pixPrUnit, props.width, props.height, props.dummy, props.repaint]);

    useEffect(() => {
        const prevUnitScale: number = unitScaleRef.current
        unitScaleRef.current = unitMultiplier
        setPixPrUnit(pixPrUnit * unitMultiplier / prevUnitScale);
        repaint();
    }, [props.unitMultiplier]);

    // Calculates matrix for transforming from real world coordinates into view coordinates
    // e.g.: (read chain backwards)
    // 1. translate real world center to origo
    // 2. scale to resolution
    // 3. translate center (now at origo) back to middle of screen.
    const real2view = () => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const viewCenter: Vector2d = new Vector2d(canvas.width / 2, canvas.height / 2);
        return Matrix3x3.chain([
            Matrix3x3.translate(viewCenter),
            Matrix3x3.scale(pixPrUnit, -pixPrUnit), // y is negated, since view uses downward as positive y direction
            Matrix3x3.scale(1 / unitMultiplier, 1 / unitMultiplier),
            Matrix3x3.translate(realCenter.neg())
        ]);
    };

    const repaint = () => {
        const canvas: HTMLCanvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        const r2v = real2view();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines and coordinate values
        const gridR2V = Matrix3x3.chain([r2v, Matrix3x3.scale(unitMultiplier, unitMultiplier)])
        Grid.drawGrids(canvas, gridR2V, props.gridSizeFactor ?? defaultGridSizeFactor);

        if (props.repaint) {
            props.repaint(canvas, ctx, r2v.toArray());
        }
    };

    // Apply zoom change on mouse wheel movement
    const wheel = (e: any) => {
        const zoomAllowed = props.zoomAllowed ?? true;
        if (zoomAllowed) {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
            const rect = canvas.getBoundingClientRect();
            const zoomPosInView = new Vector2d(e.clientX - rect.left, e.clientY - rect.top);
            const zoomFactor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
            const v2r = real2view().invert();
            if (v2r === null) {
                throw 'r2v not invertible';
            }
            const v2rZoomed = Matrix3x3.multiply(v2r, Matrix3x3.scaleAt(zoomFactor, zoomFactor, zoomPosInView));
            const viewCenter: Vector2d = new Vector2d(canvas.width / 2, canvas.height / 2);
            const newRealCenter = v2rZoomed.transform(viewCenter);
            setRealCenter(newRealCenter);
            setPixPrUnit(pixPrUnit / zoomFactor);
        }
        if (props.onWheel) {
            props.onWheel(e);
        }
    };

    // Register mouse position, pan view if mouse is pressed
    const onMouseMove = (e: any) => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        canvas.focus();
        const rect = canvas.getBoundingClientRect();
        const from = mousePos;
        const to = new Vector2d(e.clientX - rect.left, e.clientY - rect.top);
        const viewDelta = to.minus(from);
        setMousePos(to);
        const panAllowed = props.panAllowed ?? true;
        if (panAllowed && mouseDown && !viewDelta.isZero()) {
            const v2r = real2view().invert();
            if (v2r === null) {
                throw 'r2v not invertible';
            }
            const v2rTranslated = Matrix3x3.multiply(v2r, Matrix3x3.translate(viewDelta.neg()));
            const viewCenter: Vector2d = new Vector2d(canvas.width / 2, canvas.height / 2);
            const newRealCenter = v2rTranslated.transform(viewCenter);
            setRealCenter(newRealCenter);
        }
        if (props.onMouseMove) {
            props.onMouseMove(e);
        }
    };

    const onMouseDown = (e: any) => {
        setMouseDown(true);
        if (props.onMouseDown) {
            props.onMouseDown(e);
        }
    };

    const onMouseUp = (e: any) => {
        setMouseDown(false);
        if (props.onMouseUp) {
            props.onMouseUp(e);
        }
    };

    const onKeyUp = (e: any) => {
        if (props.onKeyUp) {
            props.onKeyUp(e);
        }
    };

    const onKeyDown = (e: any) => {
        if (props.onKeyDown) {
            props.onKeyDown(e);
        }
    };

    const propStyles: CSSProperties = props.styles ?? {};

    return (
        <div>
            <canvas
                id={canvasId}
                tabIndex={0}
                width={props.width}
                height={props.height}
                onWheel={wheel}
                onMouseMove={onMouseMove}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onKeyUp={onKeyUp}
                onKeyDown={onKeyDown}
                style={{background: '#fafad8', ...propStyles}}
            />
        </div>
    );
};
