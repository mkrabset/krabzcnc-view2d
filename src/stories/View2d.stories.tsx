import type {Meta, StoryObj} from '@storybook/react';
import {useArgs} from '@storybook/preview-api'
import {m3x3, View2d, View2dProps} from '../components'
import {Matrix3x3} from "../2d/Matrix3x3";
import tree from './view2d-assets/tree.json'
import React from 'react';
import {Vector2d} from "../2d/Vector2d";


// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Example/View2d',
    component: View2d,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    // tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {},
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        canvasId: "view2d",
        width: 700,
        height: 400
    },
} satisfies Meta<typeof View2d>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args



// Basic story showing empty component without any content inside
export const Primary: Story = {
    args: {}
};


// Story showing rendering of shapes, with line-thickness measured in real-world or view proportions
export const Shapes: Story = {
    args: {
        initialPixPrUnit: 2,
        repaint: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, real2view: m3x3) => {
            const r2v: Matrix3x3 = new Matrix3x3(real2view)

            // Draw an orange shape with line-width measured in pixels
            renderPaths(ctx, r2v, tree, '#fa8e')

            // Draw an blue rotated square with line-width measured real-world size
            ctx.save()
            ctx.beginPath()
            ctx.strokeStyle = '#66e8'
            ctx.lineJoin = 'round'
            ctx.lineWidth = 4
            ctx.transform(...r2v.ctxArgs())
            ctx.moveTo(-30, -25)
            ctx.lineTo(25, -30)
            ctx.lineTo(30, 25)
            ctx.lineTo(-25, 30)
            ctx.lineTo(-30, -25)
            ctx.closePath()
            //ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.stroke()
            ctx.restore()
        }
    },
};

type vec2d = [number, number]

type LSeg = { type: string, s: vec2d, e: vec2d }

type BSeg = { type: string, s: vec2d, c1: vec2d, c2: vec2d, e: vec2d }

type Seg = LSeg | BSeg

type Path = Seg[]

const renderPaths = (ctx: CanvasRenderingContext2D, r2v: Matrix3x3, paths: Path[], strokeStyle: string) => {
    ctx.save()
    ctx.strokeStyle = strokeStyle
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2


    paths.forEach(path => {
        ctx.transform(...r2v.ctxArgs())
        ctx.beginPath()
        path.forEach((seg, index) => {
            if (index === 0) {
                ctx.moveTo(...seg.s)
            }
            if (seg.type === 'line') {
                ctx.lineTo(...seg.e)
            } else {
                const bez = seg as BSeg
                ctx.bezierCurveTo(...bez.c1, ...bez.c2, ...bez.e)
            }
        })
        ctx.closePath()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.stroke()
    })

    ctx.restore()
}





// Story for tracking mouse position in real-world and view coordinates
let mousePos: Vector2d = new Vector2d(0, 0)
export const MousePosition: Story = {
    args: {
        canvasId: 'view2dCanvas',
        dummy: 0,
        repaint: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, real2view: m3x3) => {
            const r2v: Matrix3x3 = new Matrix3x3(real2view)
            const v2r: Matrix3x3 = r2v.invert() as Matrix3x3
            const realMousePos = v2r.transform(mousePos)

            ctx.save()
            ctx.fillStyle = '#44fc'
            ctx.textAlign = 'center'
            ctx.font = 'bold 18px monospace'
            ctx.fillText(`Mouse position (real): x:${realMousePos.x.toFixed(8)}, y=${realMousePos.y.toFixed(8)}`, canvas.width / 2, canvas.height / 3)
            ctx.fillText(`Mouse position (view): x:${mousePos.x.toFixed(2)}, y=${mousePos.y.toFixed(2)}`, canvas.width / 2, canvas.height / 3 * 2)

        }
    },
    render: (args: View2dProps) => {
        const [{dummy}, updateArgs] = useArgs()

        const onMouseMove = (e: any) => {
            const canvas = document.getElementById("view2dCanvas") as HTMLCanvasElement
            const rect: DOMRect = canvas.getBoundingClientRect()
            mousePos = new Vector2d(e.clientX - rect.left, e.clientY - rect.top)
            updateArgs({dummy: dummy + 1})
        }

        return <View2d {...args} dummy={dummy} onMouseMove={onMouseMove}/>
    }
}


