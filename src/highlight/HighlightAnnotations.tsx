import * as React from 'react';
import noop from 'lodash/noop';
import HighlightCanvas from './HighlightCanvas';
import HighlightCreator from './HighlightCreator';
import HighlightList from './HighlightList';
import HighlightSvg from './HighlightSvg';
import HighlightTarget from './HighlightTarget';
import PopupHighlight from '../components/Popups/PopupHighlight';
import PopupReply from '../components/Popups/PopupReply';
import { AnnotationHighlight, Rect } from '../@types';
import { CreateArg } from './actions';
import { CreatorItemHighlight, CreatorStatus, DOMRectMini, Mode, SelectionArg, SelectionItem } from '../store';
import './HighlightAnnotations.scss';

type Props = {
    activeAnnotationId: string | null;
    annotations: AnnotationHighlight[];
    createHighlight?: (arg: CreateArg) => void;
    isCreating: boolean;
    location: number;
    message: string;
    resetCreator: () => void;
    selection: SelectionItem | null;
    setActiveAnnotationId: (annotationId: string | null) => void;
    setMessage: (message: string) => void;
    setMode: (mode: Mode) => void;
    setSelection: (selection: SelectionArg | null) => void;
    setStaged: (staged: CreatorItemHighlight | null) => void;
    setStatus: (status: CreatorStatus) => void;
    staged?: CreatorItemHighlight | null;
    status: CreatorStatus;
};

const HighlightAnnotations = (props: Props): JSX.Element => {
    const {
        activeAnnotationId,
        annotations = [],
        createHighlight = noop,
        isCreating = false,
        message,
        resetCreator,
        selection,
        setActiveAnnotationId,
        setSelection,
        setMessage,
        setMode,
        setStaged,
        setStatus,
        staged,
        status,
    } = props;
    const [highlightRef, setHighlightRef] = React.useState<HTMLAnchorElement | null>(null);

    const canReply = status !== CreatorStatus.started && status !== CreatorStatus.init;
    const isPending = status === CreatorStatus.pending;

    const handleAnnotationActive = (annotationId: string | null): void => {
        setActiveAnnotationId(annotationId);
    };

    const handleCancel = (): void => {
        resetCreator();
    };

    const handleChange = (text = ''): void => {
        setMessage(text);
    };

    const handleSubmit = (): void => {
        if (!staged) {
            return;
        }

        createHighlight({ ...staged, message });
    };

    const filterRects = (rectList: DOMRectMini[]): DOMRectMini[] => {
        const rects: DOMRectMini[] = [];

        // Deduplicate similar rects
        rectList.forEach(curr => {
            const prev = rects.pop();
            // empty list, push current
            if (!prev) {
                rects.push(curr);
                return;
            }

            // different rects, push both
            if (prev.x !== curr.x || prev.width !== curr.width || Math.abs(prev.y - curr.y) > 2) {
                rects.push(prev);
                rects.push(curr);
                return;
            }

            // the same rect, push the larger one
            rects.push(prev.height > curr.height ? prev : curr);
        });

        return rects;
    };

    const getStaged = (): CreatorItemHighlight | null => {
        if (!selection) {
            return null;
        }

        const { location, pageRect, rects } = selection;
        const { height: pageHeight, width: pageWidth, x: pageX, y: pageY } = pageRect;

        const shapes: Rect[] = filterRects(rects).map(({ height, width, x, y }) => ({
            height: (height / pageHeight) * 100,
            type: 'rect',
            width: (width / pageWidth) * 100,
            x: ((x - pageX) / pageWidth) * 100,
            y: ((y - pageY) / pageHeight) * 100,
        }));

        return { location, shapes };
    };

    const handlePromote = (): void => {
        if (!selection) {
            return;
        }

        setMode(Mode.HIGHLIGHT);
        setStaged(getStaged());
        setStatus(CreatorStatus.staged);

        setSelection(null);
    };

    React.useEffect(() => {
        if (!isCreating || !selection) {
            return;
        }

        setStaged(getStaged());
        setStatus(CreatorStatus.staged);

        clearSelection();
    }, [isCreating, selection]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            {/* Layer 1: Saved annotations */}
            <HighlightList activeId={activeAnnotationId} annotations={annotations} onSelect={handleAnnotationActive} />

            {/* Layer 2: Drawn (unsaved) incomplete annotation target, if any */}
            {isCreating && <HighlightCreator className="ba-HighlightAnnotations-creator" />}

            {/* Layer 3a: Staged (unsaved) highlight target, if any */}
            {isCreating && staged && (
                <div className="ba-HighlightAnnotations-target">
                    <HighlightCanvas shapes={staged.shapes} />
                    <HighlightSvg>
                        <HighlightTarget ref={setHighlightRef} annotationId="staged" shapes={staged.shapes} />
                    </HighlightSvg>
                </div>
            )}

            {/* Layer 3b: Staged (unsaved) annotation description popup, if 3a is ready */}
            {isCreating && staged && canReply && highlightRef && (
                <div className="ba-HighlightAnnotations-popup">
                    <PopupReply
                        isPending={isPending}
                        onCancel={handleCancel}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        reference={highlightRef}
                        value={message}
                    />
                </div>
            )}

            {!isCreating && selection && <PopupHighlight onClick={handlePromote} rect={selection.boundingRect} />}
        </>
    );
};

export default HighlightAnnotations;
