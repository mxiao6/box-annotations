import { createAction } from '@reduxjs/toolkit';
import { SelectionItem } from './types';
import { Shape } from '../../@types';

export type SelectionArg = {
    location: number;
    pageRect: DOMRect;
    range: Range;
};

type Payload = {
    payload: SelectionItem | null;
};

export const getShape = ({ height, width, x, y }: DOMRect): Shape => ({
    height,
    width,
    x,
    y,
});

export const setSelectionAction = createAction(
    'SET_SELECTION',
    (arg: SelectionArg | null): Payload => {
        if (!arg) {
            return {
                payload: null,
            };
        }

        const { location, pageRect, range } = arg;

        return {
            payload: {
                boundingRect: getShape(range.getBoundingClientRect()),
                location,
                pageRect: getShape(pageRect),
                rects: Array.from(range.getClientRects()).map(getShape),
            },
        };
    },
);

// export const clearSelectionAction = (): PayloadAction<SelectionItem | null, 'SET_SELECTION'> =>
//     setSelectionAction(null);
