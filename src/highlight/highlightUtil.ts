import { Annotation, AnnotationHighlight, Position, Rect, Shape, Type } from '../@types';

export const getBoundingRect = (shapes: Shape[]): Shape => {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    shapes.forEach(({ height, width, x, y }) => {
        const x2 = x + width;
        const y2 = y + height;

        if (x < minX) {
            minX = x;
        }

        if (y < minY) {
            minY = y;
        }

        if (x2 > maxX) {
            maxX = x2;
        }

        if (y2 > maxY) {
            maxY = y2;
        }
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
};

const centerShape = (shape: Shape): Position => {
    const { height, width } = shape;

    return {
        x: width / 2,
        y: height / 2,
    };
};

export const centerHighlight = (shapes: Shape[]): Position => {
    const boundingShape = getBoundingRect(shapes);
    const { x: shapeX, y: shapeY } = boundingShape;
    const { x: centerX, y: centerY } = centerShape(boundingShape);

    return {
        x: centerX + shapeX,
        y: centerY + shapeY,
    };
};

export function isHighlight(annotation: Annotation): annotation is AnnotationHighlight {
    return annotation?.target?.type === Type.highlight;
}

export const dedupRects = (rects: Shape[]): Shape[] => {
    const dedupedRects: Shape[] = [];

    rects.forEach(curr => {
        const prev = dedupedRects.pop();
        // empty list, push current
        if (!prev) {
            dedupedRects.push(curr);
            return;
        }

        // the same rect, push the larger one
        if (prev.x === curr.x && prev.width === curr.width && Math.abs(prev.y - curr.y) <= 2) {
            dedupedRects.push(prev.height > curr.height ? prev : curr);
            return;
        }

        // different rects, push both
        dedupedRects.push(prev);
        dedupedRects.push(curr);
    });

    return dedupedRects;
};

export const groupByRow = (shapes: Shape[]): Record<number, Shape[]> => {
    const rows: Record<number, Shape[]> = {};
    shapes.forEach(shape => {
        const { y } = shape;
        if (!rows[y]) {
            rows[y] = [shape];
        } else {
            rows[y].push(shape);
        }
    });

    return rows;
};

export const combineRows = (allShapes: Shape[]): Shape[] => {
    const dedupedRects = dedupRects(allShapes);
    const rowMap = groupByRow(dedupedRects);
    return Object.values(rowMap).map(shapes => getBoundingRect(shapes));
};

export const getRelativeRect = (
    { height, width, x, y }: Shape,
    { height: containerHeight, width: containerWidth, x: containerX, y: containerY }: Shape,
): Rect => ({
    height: (height / containerHeight) * 100,
    type: 'rect',
    width: (width / containerWidth) * 100,
    x: ((x - containerX) / containerWidth) * 100,
    y: ((y - containerY) / containerHeight) * 100,
});
