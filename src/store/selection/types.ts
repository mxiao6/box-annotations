import { Shape } from '../../@types';

export type SelectionState = {
    selection: SelectionItem | null;
};

export type SelectionItem = {
    boundingRect: Shape;
    containerRect: Shape;
    location: number;
    rects: Array<Shape>;
};
