import { connect } from 'react-redux';
import { AppState, getAnnotationMode, getSelectionForLocation, SelectionItem } from '../store';
import HighlightAnnotations from './HighlightAnnotations';
import withProviders from '../common/withProviders';

export type Props = {
    isCreating: boolean;
    selection: SelectionItem | null;
};

export const mapStateToProps = (state: AppState, { location }: { location: number }): Props => ({
    isCreating: getAnnotationMode(state) === 'highlight',
    selection: getSelectionForLocation(state, location),
});

export default connect(mapStateToProps)(withProviders(HighlightAnnotations));
