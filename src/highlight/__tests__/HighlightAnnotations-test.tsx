import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import HighlightAnnotations from '../HighlightAnnotations';
import HighlightCreator from '../HighlightCreator';
import { HighlightList } from '../HighlightList';

jest.mock('../HighlightCreator');

describe('components/highlight/HighlightAnnotations', () => {
    const defaults = {
        activeAnnotationId: null,
        isCreating: false,
        pageEl: document.createElement('div'),
        setActiveAnnotationId: jest.fn(),
    };

    const getWrapper = (props = {}): ShallowWrapper<{}, {}, HighlightAnnotations> =>
        shallow(<HighlightAnnotations {...defaults} {...props} />);

    describe('render()', () => {
        test('should render a RegionCreator if in creation mode', () => {
            const wrapper = getWrapper({ isCreating: true });
            const creator = wrapper.find(HighlightCreator);

            expect(wrapper.find(HighlightList).exists()).toBe(true);
            expect(creator.hasClass('ba-HighlightAnnotations-creator')).toBe(true);
        });
    });

    describe('handleAnnotationActive()', () => {
        test('should call setActiveAnnotationId', () => {
            const wrapper = getWrapper();
            const instance = wrapper.instance();

            instance.handleAnnotationActive('123');

            expect(defaults.setActiveAnnotationId).toHaveBeenCalledWith('123');
        });
    });
});
