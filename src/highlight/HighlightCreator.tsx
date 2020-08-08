import React from 'react';
import classNames from 'classnames';
import { getSelectionRange } from './highlightUtil';
import './HighlightCreator.scss';

type Props = {
    className?: string;
    onSelectionChange: (range: Range | null) => void;
    pageEl: HTMLElement;
};

export default function HighlightCreator({ className, onSelectionChange, pageEl }: Props): JSX.Element {
    const handleMouseUp = (): void => {
        setTimeout(() => {
            onSelectionChange(getSelectionRange());
        }, 300);
    };

    const handleSelectionChange = (): void => {
        const selection = document.getSelection();

        if (!selection || selection.isCollapsed) {
            onSelectionChange(null);
        }
    };

    React.useEffect(() => {
        // Only document has selectionchange event. Document-level event listener
        // allows the creator to respond even if the selection is on other pages
        document.addEventListener('selectionchange', handleSelectionChange);
        pageEl.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            pageEl.removeEventListener('mouseup', handleMouseUp);
        };
    });

    return <div className={classNames(className, 'ba-HighlightCreator')} data-testid="ba-HighlightCreator" />;
}
