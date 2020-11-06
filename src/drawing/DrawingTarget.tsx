import * as React from 'react';
import * as ReactRedux from 'react-redux';
import { white } from 'box-ui-elements/es/styles/variables';
import classNames from 'classnames';
import noop from 'lodash/noop';
import { getIsCurrentFileVersion } from '../store';
import { MOUSE_PRIMARY } from '../constants';
import './DrawingTarget.scss';
import { PathGroup, Path, Shape } from '../@types';
import { Point } from '../region/transformUtil';

type Props = {
    annotationId: string;
    className?: string;
    isActive?: boolean;
    onSelect?: (annotationId: string) => void;
    pathGruops: PathGroup[];
    shape: Shape;
};

export type DrawingTargetRef = HTMLAnchorElement;

export const drawCubicBezier = (points: Point[]): string =>
    points
        .map(({ x, y }, index, array) => {
            const prevPoint = array[index - 1];
            const nextPoint = array[index + 1];
            if (!prevPoint || !nextPoint) {
                return '';
            }

            const xc1 = (x + prevPoint.x) / 2;
            const yc1 = (y + prevPoint.y) / 2;
            const xc2 = (x + nextPoint.x) / 2;
            const yc2 = (y + nextPoint.y) / 2;

            return `C ${xc1} ${yc1}, ${x} ${y}, ${xc2} ${yc2}`;
        })
        .join(' ');

export const getSVGPath = (points: Point[]): string => {
    if (!points || !points.length) {
        return '';
    }

    const { x: startX, y: startY } = points[0];
    const d = drawCubicBezier(points);

    return `M ${startX} ${startY} ${d}`;
};

export const getSVGTarget = (paths: Path[], color: string, size: number, isActive: boolean): JSX.Element => (
    <g className="be-DrawingTarget-group" fill="transparent" stroke={color} strokeWidth={size}>
        {paths.map(({ points }) => {
            const d = getSVGPath(points);
            return (
                <>
                    <g className={classNames('ba-DrawingTarget-decoration', { 'is-active': isActive })}>
                        <path d={d} filter="url(#ba-DrawingList-shadow)" />
                        <path d={d} stroke={white} strokeWidth={size + 2} />
                    </g>
                    <path d={d} />
                </>
            );
        })}
    </g>
);

export const DrawingTarget = (props: Props, ref: React.Ref<DrawingTargetRef>): JSX.Element => {
    const { annotationId, className, isActive = false, onSelect = noop, pathGruops, shape } = props;
    const isCurrentFileVersion = ReactRedux.useSelector(getIsCurrentFileVersion);
    const { height, width, x, y } = shape;

    const handleFocus = (): void => {
        onSelect(annotationId);
    };
    const handleMouseDown = (event: React.MouseEvent<DrawingTargetRef>): void => {
        if (event.buttons !== MOUSE_PRIMARY) {
            return;
        }

        event.preventDefault(); // Prevents focus from leaving the button immediately in some browsers
        event.nativeEvent.stopImmediatePropagation(); // Prevents document event handlers from executing
        event.currentTarget.focus(); // Buttons do not receive focus in Firefox and Safari on MacOS; triggers handleFocus
    };

    return (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
            ref={ref}
            className={classNames('ba-DrawingTarget', className, { 'is-active': isActive })}
            data-resin-iscurrent={isCurrentFileVersion}
            data-resin-itemid={annotationId}
            data-resin-target="highlightDrawing"
            data-testid={`ba-AnnotationTarget-${annotationId}`}
            onFocus={handleFocus}
            onMouseDown={handleMouseDown}
            role="button"
            tabIndex={0}
        >
            <rect fill="transparent" height={height} width={width} x={x} y={y} />
            {pathGruops.map(({ paths, stroke: { color, size } }) => getSVGTarget(paths, color, size, isActive))}
        </a>
    );
};

export default React.forwardRef(DrawingTarget);
