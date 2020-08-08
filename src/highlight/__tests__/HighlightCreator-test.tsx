import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import HighlightCreator from '../HighlightCreator';

describe('HighlightCreator', () => {
    const defaults = {
        onSelectionChange: jest.fn(),
        pageEl: document.createElement('div'),
    };
    const getWrapper = (props = {}): ShallowWrapper => shallow(<HighlightCreator {...defaults} {...props} />);

    beforeEach(() => {
        jest.spyOn(React, 'useEffect').mockImplementation(func => func());
    });

    describe('render', () => {
        test('should add class', () => {
            const wrapper = getWrapper();

            expect(wrapper.hasClass('ba-HighlightCreator')).toBe(true);
        });
    });
});
