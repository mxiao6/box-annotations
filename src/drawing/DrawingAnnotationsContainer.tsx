import { connect } from 'react-redux';
import DrawingAnnotations from './DrawingAnnotations';
import withProviders from '../common/withProviders';
import { AnnotationDrawing } from '../@types';
import { AppState, getActiveAnnotationId, getAnnotationsForLocation, setActiveAnnotationIdAction } from '../store';
import { isDrawing } from './drawingUtil';

export type Props = {
    activeAnnotationId: string | null;
    annotations: AnnotationDrawing[];
};

export const mapStateToProps = (state: AppState, { location }: { location: number }): Props => {
    return {
        activeAnnotationId: getActiveAnnotationId(state),
        annotations: getAnnotationsForLocation(state, location).filter(isDrawing),
    };
};

export const mapDispatchToProps = {
    setActiveAnnotationId: setActiveAnnotationIdAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(withProviders(DrawingAnnotations));
