import { Annotation, AnnotationHighlight, Rect, Type } from '../@types';
import { checkValue } from '../utils/util';

export function isHighlight(annotation: Annotation): annotation is AnnotationHighlight {
    return annotation?.target?.type === Type.highlight;
}

export function isValidHighlight({ target }: AnnotationHighlight): boolean {
    const { shapes = [] } = target;

    return shapes.reduce((isValid: boolean, rect: Rect) => {
        const { height, width, x, y } = rect;
        return isValid && checkValue(height) && checkValue(width) && checkValue(x) && checkValue(y);
    }, true);
}

export function getHighlightArea(shapes: Rect[]): number {
    return shapes.reduce((area, { height, width }) => area + height * width, 0);
}

export function sortHighlight(
    { target: targetA }: AnnotationHighlight,
    { target: targetB }: AnnotationHighlight,
): number {
    const { shapes: shapesA } = targetA;
    const { shapes: shapesB } = targetB;

    // Render the smallest highlights last to ensure they are always clickable
    return getHighlightArea(shapesA) > getHighlightArea(shapesB) ? -1 : 1;
}

export function getPageEl(location: number): HTMLElement | null {
    return document.querySelector(`[data-page-number="${location}"]`);
}

export function getSelectionRange(): Range | null {
    const selection = window.getSelection();
    if (!selection?.focusNode) {
        return null;
    }
    const range = selection.getRangeAt(0);

    return range.collapsed ? null : range;
}

export function getSelections(): Rect[] | null {
    const range = getSelectionRange();

    if (!range) {
        return null;
    }

    const rectList: Rect[] = Array.from(range.getClientRects())
        .filter(({ x, y, height, width }) => x > 0 && y > 0 && height < window.innerHeight && width < window.innerWidth)
        .map(({ x, y, height, width }) => ({
            x,
            y,
            height,
            width,
            type: 'rect',
        }));
    if (!rectList.length) {
        return null;
    }

    const rects: Rect[] = [];
    // Deduplicate similar rects
    rectList.forEach(curr => {
        const prev = rects.pop();
        // empty list, push current
        if (!prev) {
            rects.push(curr);
            return;
        }

        // different ranges, push both
        if (prev.x !== curr.x || prev.width !== curr.width || Math.abs(prev.y - curr.y) > 2) {
            rects.push(prev);
            rects.push(curr);
            return;
        }

        // the same range, push the larger one
        rects.push(prev.height > curr.height ? prev : curr);
    });

    return rects;
}
