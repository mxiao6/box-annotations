import * as React from 'react';
import HighlightCanvas from './HighlightCanvas';
import HighlightCreator from './HighlightCreator';
import HighlightList from './HighlightList';
import PopupHighlight from '../components/Popups/PopupHighlight';
import { AnnotationHighlight } from '../@types';
import { isValidHighlight, sortHighlight } from './highlightUtil';

import './HighlightAnnotations.scss';

type Props = {
    activeAnnotationId: string | null;
    annotations: AnnotationHighlight[];
    isCreating: boolean;
    pageEl: HTMLElement;
    setActiveAnnotationId: (annotationId: string | null) => void;
};

type State = {
    selection: Range | null;
};

export default class HighlightAnnotations extends React.Component<Props, State> {
    static defaultProps = {
        annotations: [],
        isCreating: false,
    };

    state: State = {
        selection: null,
    };

    handleAnnotationActive = (annotationId: string | null): void => {
        const { setActiveAnnotationId } = this.props;

        setActiveAnnotationId(annotationId);
    };

    handleSelectionChange = (range: Range | null): void => {
        this.setState({
            selection: range,
        });
    };

    render(): JSX.Element {
        const { activeAnnotationId, annotations, pageEl } = this.props;
        const { selection } = this.state;

        const sortedAnnotations = annotations.filter(isValidHighlight).sort(sortHighlight);

        return (
            <>
                {/* Layer 1: Saved annotations -- visual highlights */}
                <HighlightCanvas activeId={activeAnnotationId} annotations={sortedAnnotations} />

                {/* Layer 2: Saved annotations -- interactable highlights */}
                <HighlightList annotations={sortedAnnotations} onSelect={this.handleAnnotationActive} />

                {/* Layer 3a: Drawn (unsaved) incomplete annotation target, if any */}
                <HighlightCreator
                    className="ba-HighlightAnnotations-creator"
                    onSelectionChange={this.handleSelectionChange}
                    pageEl={pageEl}
                />

                {/* Layer 3b: (unsaved) annotation highlight popup, if 3a is ready */}
                {selection && <PopupHighlight reference={selection} />}
            </>
        );
    }
}
