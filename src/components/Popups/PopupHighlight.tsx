import * as React from 'react';
import noop from 'lodash/noop';
import { FormattedMessage } from 'react-intl';
import IconHighlight from '../../icons/IconHighlight';
import messages from './messages';
import PopupBase from './PopupBase';
import { DOMRectMini } from '../../store';
import { Options } from './Popper';
import './PopupHighlight.scss';

export type Props = {
    onClick?: (event: React.MouseEvent) => void;
    rect: DOMRectMini;
};

const options: Partial<Options> = {
    modifiers: [
        {
            name: 'arrow',
            options: {
                element: '.ba-Popup-arrow',
            },
        },
        {
            name: 'eventListeners',
            options: {
                scroll: false,
            },
        },
        {
            name: 'offset',
            options: {
                offset: [0, 8],
            },
        },
        {
            name: 'preventOverflow',
            options: {
                padding: 5,
            },
        },
    ],
    placement: 'bottom',
};

export default function PopupHighlight({ onClick = noop, rect }: Props): JSX.Element {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const { x, y, height, width } = rect;

    const reference = {
        getBoundingClientRect: () => ({
            bottom: y + height,
            height,
            left: x,
            right: x + width,
            top: y,
            width,
        }),
    };

    const handleEvent = (event: Event): void => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleClick = (event: React.MouseEvent): void => {
        onClick(event);
    };

    // stopPropagation in onMouseUp doesn't work because
    // mouseup event listener is attached to real dom
    React.useEffect(() => {
        const { current: buttonEl } = buttonRef;

        if (buttonEl) {
            buttonEl.addEventListener('mousedown', handleEvent);
            buttonEl.addEventListener('mouseup', handleEvent);
        }

        return () => {
            if (buttonEl) {
                buttonEl.removeEventListener('mousedown', handleEvent);
                buttonEl.removeEventListener('mouseup', handleEvent);
            }
        };
    }, [buttonRef]);

    return (
        <PopupBase className="ba-PopupHighlight" options={options} reference={reference}>
            <button ref={buttonRef} className="btn-plain ba-PopupHighlight-button" onClick={handleClick} type="button">
                <IconHighlight className="ba-PopupHighlight-icon" />
                <FormattedMessage {...messages.highlightPromoter} />
            </button>
        </PopupBase>
    );
}
