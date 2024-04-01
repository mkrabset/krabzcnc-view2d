import { Matrix3x3 } from '../2d/Matrix3x3';
import { Vector2d } from '../2d/Vector2d';

export class Grid {
    private static readonly margin: number = 15;

    private static smallStep(delta: number, sizeFactor: number): number {
        return Math.pow(10, Math.floor(Math.log10(delta * sizeFactor)) - 1);
    }

    public static drawGrids(canvas: HTMLCanvasElement, r2v: Matrix3x3, sizeFactor: number = 1.3): void {
        const v2r: Matrix3x3 | null = r2v.invert();
        if (v2r === null) {
            throw 'r2v not invertible';
        }
        const nwCorner: Vector2d = v2r.transform(new Vector2d(Grid.margin, Grid.margin));
        const seCorner: Vector2d = v2r.transform(new Vector2d(canvas.width - Grid.margin, canvas.height - Grid.margin));
        const smallStep: number = Grid.smallStep(Math.min(seCorner.x - nwCorner.x, nwCorner.y - seCorner.y), sizeFactor);

        const xValues: number[] = Grid.stepValues(nwCorner.x, seCorner.x, smallStep);
        const yValues: number[] = Grid.stepValues(seCorner.y, nwCorner.y, smallStep);

        Grid.drawGrid(canvas, r2v, false, xValues, yValues, smallStep);
        Grid.drawGrid(canvas, r2v, true, xValues, yValues, smallStep);
    }

    private static stepValues(from: number, to: number, smallStep: number): number[] {
        const result: number[] = [];
        const s = Math.ceil(from / smallStep);
        const e = Math.floor(to / smallStep);
        for (let r = s; r <= e; r++) {
            result.push(r);
        }
        return result;
    }

    public static drawGrid(canvas: HTMLCanvasElement, r2v: Matrix3x3, big: boolean, xValues: number[], yValues: number[], ss: number): void {
        const xVal: number[] = big ? xValues.filter((v) => v % 10 === 0) : xValues.filter((v) => v % 10 !== 0);
        const yVal: number[] = big ? yValues.filter((v) => v % 10 === 0) : yValues.filter((v) => v % 10 !== 0);
        const marg: number = big ? Grid.margin : Grid.margin / 1.2;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        // Render vertical lines
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = big ? 0.4 : 0.15;
        ctx.strokeStyle = '#88c';
        xVal.forEach((x) => {
            const vx = Math.floor(r2v.transform(new Vector2d(x * ss, 0)).x);
            ctx.moveTo(vx, marg);
            ctx.lineTo(vx, canvas.height - marg);
        });
        ctx.stroke();
        ctx.restore();

        // Render horizontal lines
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = big ? 0.4 : 0.15;
        ctx.strokeStyle = '#88c';

        yVal.forEach((y) => {
            const vy = Math.floor(r2v.transform(new Vector2d(0, y * ss)).y);
            ctx.moveTo(marg, vy);
            ctx.lineTo(canvas.width - marg, vy);
        });
        ctx.stroke();
        ctx.restore();

        if (big) {
            Grid.drawAxises(canvas, ctx, xVal, yVal, r2v, marg);
            Grid.drawNumberings(canvas, ctx, xVal, yVal, r2v, ss);
        }
    }

    private static drawAxises(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, xVal: number[], yVal: number[], r2v: Matrix3x3, margin: number): void {
        const xZero = xVal.includes(0);
        const yZero = yVal.includes(0);
        if (xZero || yZero) {
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#88c';

            const vOrigo: Vector2d = r2v.transform(new Vector2d(0, 0));

            if (yZero) {
                const vy = Math.floor(vOrigo.y);
                ctx.moveTo(margin, vy);
                ctx.lineTo(canvas.width - margin, vy);
            }

            if (xZero) {
                const vx = Math.floor(vOrigo.x);
                ctx.moveTo(vx, margin);
                ctx.lineTo(vx, canvas.height - margin);
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    private static drawNumberings(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, xVal: number[], yVal: number[], r2v: Matrix3x3, ss: number): void {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000f';
        ctx.font = 'bold 12px monospace';

        // Draw x values
        xVal.forEach((x) => {
            const rx: number = x * ss;
            const vx: number = r2v.transform(new Vector2d(rx, 0)).x;
            const decimals: number = ss * 10 > 1 ? 0 : -Math.log10(ss * 10);

            ctx.save();
            ctx.translate(vx, 10);
            ctx.fillText(rx.toFixed(decimals), 0, 0);
            ctx.restore();

            ctx.save();
            ctx.translate(vx, canvas.height - 5);
            ctx.fillText(rx.toFixed(decimals), 0, 0);
            ctx.restore();
        });

        // Draw y values
        yVal.forEach((y) => {
            const ry: number = y * ss;
            const vy: number = r2v.transform(new Vector2d(0, ry)).y;
            const decimals = ss * 10 > 1 ? 0 : -Math.log10(ss * 10);
            ctx.save();
            ctx.translate(10, vy);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(ry.toFixed(decimals), 0, 0);
            ctx.restore();

            ctx.save();
            ctx.translate(canvas.width - 5, vy);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(ry.toFixed(decimals), 0, 0);
            ctx.restore();
        });

        ctx.restore();
    }
}
