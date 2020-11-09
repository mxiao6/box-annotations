import * as React from 'react';
import * as ReactRedux from 'react-redux';
import classNames from 'classnames';
import noop from 'lodash/noop';
import { white } from 'box-ui-elements/es/styles/variables';
import { MOUSE_PRIMARY } from '../constants';
import { Path, Stroke, TargetDrawing } from '../@types';
import { Point } from '../region/transformUtil';
import { getIsCurrentFileVersion } from '../store';
import { getShape } from './drawingUtil';
import './DrawingTarget.scss';

type Props = {
    annotationId: string;
    className?: string;
    isActive?: boolean;
    onSelect?: (annotationId: string) => void;
    target: TargetDrawing;
};

export const DRAWING_TARGET_BORDER = 1;

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

export const getSVGTarget = (paths: Path[], { color, size }: Stroke, isActive: boolean): JSX.Element => (
    <g className="be-DrawingTarget-group" fill="transparent" stroke={color} strokeWidth={size}>
        {paths.map(({ points }) => {
            const d = getSVGPath(points);
            return (
                <>
                    <g className={classNames('ba-DrawingTarget-decoration', { 'is-active': isActive })}>
                        <path d={d} filter="url(#ba-DrawingList-shadow)" vectorEffect="non-scaling-stroke" />
                        <path
                            d={d}
                            stroke={white}
                            strokeWidth={size + DRAWING_TARGET_BORDER * 2}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                    <path d={d} vectorEffect="non-scaling-stroke" />
                </>
            );
        })}
    </g>
);

export const DrawingTarget = (props: Props, ref: React.Ref<DrawingTargetRef>): JSX.Element => {
    const isCurrentFileVersion = ReactRedux.useSelector(getIsCurrentFileVersion);
    const {
        annotationId,
        className,
        isActive = false,
        onSelect = noop,
        target: { path_groups: pathGroups },
    } = props;
    const { height, width, x, y } = getShape(pathGroups);
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const handleFocus = (): void => {
        onSelect(annotationId);
    };
    const handleMouseDown = (event: React.MouseEvent<DrawingTargetRef>): void => {
        if (event.buttons !== MOUSE_PRIMARY) {
            return;
        }
        const activeElement = document.activeElement as HTMLElement;

        onSelect(annotationId);

        event.preventDefault(); // Prevents focus from leaving the button immediately in some browsers
        event.nativeEvent.stopImmediatePropagation(); // Prevents document event handlers from executing

        // IE11 won't apply the focus to the SVG anchor, so this workaround attempts to blur the existing
        // active element.
        if (activeElement && activeElement !== event.currentTarget && activeElement.blur) {
            activeElement.blur();
        }

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
            href="#"
            onFocus={handleFocus}
            onMouseDown={handleMouseDown}
            role="button"
            tabIndex={0}
        >
            <rect
                fill="transparent"
                height={height}
                transform={`translate(-${centerX * 0.1}, -${centerY * 0.1}) scale(1.1)`}
                width={width}
                x={x}
                y={y}
            />
            {pathGroups.map(({ paths, stroke }) => getSVGTarget(paths, stroke, isActive))}
        </a>
    );
};

export default React.forwardRef(DrawingTarget);
