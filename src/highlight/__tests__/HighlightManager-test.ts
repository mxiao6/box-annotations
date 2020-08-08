import ReactDOM from 'react-dom';
import { createIntl } from 'react-intl';
import HighlightManager, { Options } from '../HighlightManager';
import { createStore } from '../../store';

jest.mock('react-dom', () => ({
    render: jest.fn(),
    unmountComponentAtNode: jest.fn(),
}));

describe('HighlightManager', () => {
    const intl = createIntl({ locale: 'en' });
    const rootEl = document.createElement('div');
    const getOptions = (options: Partial<Options> = {}): Options => ({
        pageEl: rootEl as HTMLElement,
        referenceEl: rootEl.querySelector('.reference') as HTMLElement,
        ...options,
    });
    const getLayer = (): HTMLElement => rootEl.querySelector('[data-testid="ba-Layer--highlight"]') as HTMLElement;
    const getWrapper = (options?: Partial<Options>): HighlightManager => new HighlightManager(getOptions(options));

    beforeEach(() => {
        rootEl.classList.add('root');
        rootEl.innerHTML = '<div class="reference" />'; // referenceEl
    });

    describe('constructor', () => {
        test('should set all necessary properties', () => {
            const wrapper = getWrapper();

            expect(wrapper.location).toEqual(1);
            expect(wrapper.reactEl).toEqual(getLayer());
        });
    });

    describe('destroy()', () => {
        test('should unmount the React node and remove the root element', () => {
            const wrapper = getWrapper();

            wrapper.destroy();

            expect(ReactDOM.unmountComponentAtNode).toHaveBeenCalledWith(wrapper.reactEl);
        });
    });

    describe('exists()', () => {
        test('should return a boolean based on its presence in the page element', () => {
            const wrapper = getWrapper();

            expect(wrapper.exists(rootEl)).toBe(true);
            expect(wrapper.exists(document.createElement('div'))).toBe(false);
        });
    });

    describe('render()', () => {
        test('should format the props and pass them to the underlying components', () => {
            const wrapper = getWrapper();

            wrapper.render({ intl, store: createStore() });

            expect(ReactDOM.render).toHaveBeenCalled();
        });
    });

    describe('style', () => {
        test('should assign the style object to the root element', () => {
            const wrapper = getWrapper();

            wrapper.style({ left: '5px', top: '10px' });

            expect(getLayer().style.left).toEqual('5px');
            expect(getLayer().style.top).toEqual('10px');
        });
    });
});
