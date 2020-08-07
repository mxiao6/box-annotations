import * as React from 'react';
import HighlightCreator from './HighlightCreator';
import PopupHighlight from '../components/Popups/PopupHighlight';
import { SelectionItem } from '../store';

import './HighlightAnnotations.scss';

type Props = {
    isCreating: boolean;
    location: number;
    selection: SelectionItem | null;
};

export default class HighlightAnnotations extends React.PureComponent<Props> {
    static defaultProps = {
        isCreating: false,
    };

    getRect = ({ selections }: SelectionItem): DOMRect => {
        const bottoms = selections.map(({ y, height }) => y + height);
        const lefts = selections.map(({ x }) => x);
        const rights = selections.map(({ x, width }) => x + width);

        const mostBottom = Math.max(...bottoms);
        const mostLeft = Math.min(...lefts);
        const mostRight = Math.max(...rights);

        return new DOMRect(mostLeft, mostBottom, mostRight - mostLeft, 0);
    };

    render(): JSX.Element {
        const { isCreating, selection } = this.props;
        return (
            <>
                {isCreating && <HighlightCreator className="ba-HighlightAnnotations-creator" />}

                {selection && <PopupHighlight rect={this.getRect(selection)} />}
            </>
        );
    }
}
