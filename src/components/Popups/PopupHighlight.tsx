import * as React from 'react';
// import { FormattedMessage } from 'react-intl';
// import messages from './messages';
import PopupBase from './PopupBase';
import { Options } from './Popper';
import './PopupCursor.scss';

export type Props = {
    rect: DOMRect;
};

const options: Partial<Options> = {
    modifiers: [
        {
            name: 'arrow',
            options: {
                element: '.ba-Popup-arrow',
                padding: 10,
            },
        },
        {
            name: 'offset',
            options: {
                offset: [0, 15],
            },
        },
    ],
    placement: 'bottom',
};

export default function PopupCursor({ rect }: Props): JSX.Element {
    const reference = {
        getBoundingClientRect: () => rect,
    };

    return (
        <PopupBase className="ba-PopupHighlight" options={options} reference={reference}>
            Highlight and Comment
        </PopupBase>
    );
}
