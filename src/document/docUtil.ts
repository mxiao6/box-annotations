import { Rect } from '../@types';
import { SelectionItem } from '../store';

/**
 * Finds the closest ancestor DOM element with the specified class.
 */
export function findClosestElWithClass(element: HTMLElement | null, className: string): HTMLElement | null {
    for (
        let el = element;
        el && el !== ((document as unknown) as HTMLElement);
        el = el.parentNode as HTMLElement | null
    ) {
        if (el.classList && el.classList.contains(className)) {
            return el;
        }
    }

    return null;
}

/**
 * Returns the page element and page number that the element is on.
 * If not found return null/-1
 */
export function getPageInfo(element: HTMLElement): { pageEl: HTMLElement | null; page: number } {
    const pageEl = findClosestElWithClass(element, 'page') || null;
    const page = parseInt((pageEl && pageEl.getAttribute('data-page-number')) || '-1', 10);

    return { pageEl, page };
}

/**
 * Returns current selections with page number
 */
export function getSelections(): SelectionItem | null {
    const selection = window.getSelection();
    if (!selection?.focusNode) {
        return null;
    }

    const range = selection.getRangeAt(0);

    // If is click not selection
    if (range.collapsed) {
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

    const { page } = getPageInfo(selection.focusNode as HTMLElement);

    return { location: page, selections: rects };
}
