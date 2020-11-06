import React from 'react';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import noop from 'lodash/noop';
import DrawingTarget from './DrawingTarget';
import useOutsideEvent from '../common/useOutsideEvent';
import { AnnotationDrawing, PathGroup, Shape } from '../@types';
import { checkValue } from '../utils/util';
import { getShape } from './drawingUtil';

export type Props = {
    activeId?: string | null;
    annotations: AnnotationDrawing[];
    className?: string;
    onSelect?: (annotationId: string | null) => void;
};

export const DRAWING_TARGET_PADDING = 10;

export function filterDrawing({ target: { path_groups: pathGroups } }: AnnotationDrawing): boolean {
    return pathGroups.reduce<boolean>(
        (prevGroups, { paths }) =>
            prevGroups &&
            paths.reduce<boolean>(
                (prevPaths, { points }) =>
                    prevPaths &&
                    points.reduce<boolean>(
                        (prevPoints, { x, y }) => prevPoints && checkValue(x) && checkValue(y),
                        true,
                    ),
                true,
            ),
        true,
    );
}

export function scaleDrawing(
    annotationDrawing: AnnotationDrawing,
    { height, width }: { height: number; width: number },
): AnnotationDrawing {
    const scaledAnnotationDrawing = cloneDeep(annotationDrawing);
    const {
        target: { path_groups: pathGroups },
    } = scaledAnnotationDrawing;

    pathGroups.forEach(({ paths }) => {
        paths.forEach(({ points }) => {
            points.forEach(point => {
                const { x, y } = point;
                point.x = (x / 100) * width;
                point.y = (y / 100) * height;
            });
        });
    });

    return scaledAnnotationDrawing;
}

export function sortDrawing({ target: targetA }: AnnotationDrawing, { target: targetB }: AnnotationDrawing): number {
    const shapeA = getShape(targetA.path_groups);
    const shapeB = getShape(targetB.path_groups);

    return shapeA.height * shapeA.width > shapeB.height * shapeB.width ? -1 : 1;
}

export function getShapeWithPadding(
    pathGroups: PathGroup[],
    rootDimension: { height: number; width: number },
    padding = DRAWING_TARGET_PADDING,
): Shape {
    const { height, width, x, y } = getShape(pathGroups);
    const { height: rootHeight, width: rootWidth } = rootDimension;

    return {
        height: Math.min(rootHeight, height + padding * 2),
        width: Math.min(rootWidth, width + padding * 2),
        x: Math.max(0, x - padding),
        y: Math.max(0, y - padding),
    };
}

export function DrawingList({ activeId = null, annotations, className, onSelect = noop }: Props): JSX.Element {
    const [isListening, setIsListening] = React.useState(true);
    const [rootDimension, setRootDimension] = React.useState<{ height: number; width: number }>();
    const rootElRef = React.createRef<SVGSVGElement>();

    // Document-level event handlers for focus and pointer control
    useOutsideEvent('mousedown', rootElRef, (): void => {
        onSelect(null);
        setIsListening(false);
    });
    useOutsideEvent('mouseup', rootElRef, (): void => setIsListening(true));

    React.useEffect(() => {
        const { current: rootEl } = rootElRef;
        if (!rootEl) {
            return;
        }
        setRootDimension({
            height: rootEl.clientHeight,
            width: rootEl.clientWidth,
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <svg
            ref={rootElRef}
            className={classNames(className, { 'is-listening': isListening })}
            data-resin-component="drawingList"
        >
            <defs>
                <filter id="ba-DrawingList-shadow">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                    <feComponentTransfer>
                        <feFuncA slope="0.8" type="linear" />
                    </feComponentTransfer>
                </filter>
            </defs>
            {rootDimension &&
                annotations
                    .filter(filterDrawing)
                    .sort(sortDrawing)
                    .map(drawing => scaleDrawing(drawing, rootDimension))
                    .map(({ id, target }) => (
                        <DrawingTarget
                            key={id}
                            annotationId={id}
                            isActive={activeId === id}
                            onSelect={onSelect}
                            pathGruops={target.path_groups}
                            shape={getShapeWithPadding(target.path_groups, rootDimension)}
                        />
                    ))}
        </svg>
    );
}

export default React.memo(DrawingList);
