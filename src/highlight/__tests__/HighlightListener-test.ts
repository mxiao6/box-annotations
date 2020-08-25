import HighlightListener from '../HighlightListener';
import { AppStore, getIsInitialized } from '../../store';
import { mockRange } from '../../store/selection/__mocks__/range';

jest.mock('lodash/debounce', () => (func: Function) => func);
jest.mock('../../store', () => ({
    getIsInitialized: jest.fn(() => false),
    setSelectionAction: jest.fn(arg => arg),
}));

jest.useFakeTimers();

describe('HighlightListener', () => {
    const defaults = {
        getSelection: jest.fn(() => ({ location: 1, range: mockRange })),
        store: ({
            dispatch: jest.fn(),
            getState: jest.fn(),
        } as unknown) as AppStore,
    };
    const mockAnnotatedEl = ({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    } as unknown) as HTMLElement;

    const getListener = (options = {}): HighlightListener => {
        return new HighlightListener({ ...defaults, ...options });
    };

    let listener: HighlightListener;

    beforeEach(() => {
        listener = getListener();
    });

    afterEach(() => {
        if (listener) {
            listener.destroy();
        }
        jest.clearAllMocks();
    });

    describe('constructor()', () => {
        test('should add selectionchange event listener', () => {
            jest.spyOn(document, 'addEventListener');

            listener = getListener();

            expect(document.addEventListener).toHaveBeenCalledWith('selectionchange', listener.handleSelectionChange);
        });
    });

    describe('destroy()', () => {
        test('should clear timeout and remove event handlers', () => {
            listener.annotatedEl = mockAnnotatedEl;
            listener.selectionChangeTimer = 1;
            jest.spyOn(document, 'removeEventListener');

            listener.destroy();

            expect(clearTimeout).toHaveBeenCalledWith(1);
            expect(document.removeEventListener).toHaveBeenCalledWith(
                'selectionchange',
                listener.handleSelectionChange,
            );
            expect(listener.annotatedEl.removeEventListener).toHaveBeenCalledTimes(2);
        });
    });

    describe('init()', () => {
        test('should clear previous selection and add listeners', () => {
            listener.init(mockAnnotatedEl);

            expect(defaults.store.dispatch).toHaveBeenCalledWith(null);
            expect(mockAnnotatedEl.addEventListener).toHaveBeenCalledTimes(2);
        });

        test('should not add listeners if already initialized', () => {
            (getIsInitialized as jest.Mock).mockReturnValueOnce(true);

            listener.init(mockAnnotatedEl);

            expect(mockAnnotatedEl.addEventListener).not.toHaveBeenCalled();
        });
    });

    describe('setSelection()', () => {
        test('should dispatch selection', () => {
            listener.setSelection();

            expect(defaults.store.dispatch).toHaveBeenCalledWith({ location: 1, range: mockRange });
        });
    });

    describe('handleMouseDown', () => {
        test('should clear timeout and selection', () => {
            listener.selectionChangeTimer = 1;

            listener.handleMouseDown(({ buttons: 1 } as unknown) as MouseEvent);

            expect(listener.isMouseSelecting).toBe(true);
            expect(clearTimeout).toHaveBeenCalledWith(1);
            expect(defaults.store.dispatch).toHaveBeenCalledWith(null);
        });

        test('should do nothing if is not primary button', () => {
            listener.handleMouseDown(({ buttons: 2 } as unknown) as MouseEvent);

            expect(listener.isMouseSelecting).toBe(false);
        });
    });

    describe('handleMouseUp()', () => {
        test('should set selection', () => {
            listener.isMouseSelecting = true;
            listener.setSelection = jest.fn();

            listener.handleMouseUp();

            expect(listener.isMouseSelecting).toBe(false);

            jest.runAllTimers();

            expect(listener.setSelection).toHaveBeenCalled();
        });

        test('should do nothing if select not using mouse', () => {
            listener.handleMouseUp();

            expect(window.setTimeout).not.toHaveBeenCalled();
        });
    });

    describe('handleSelectionChange()', () => {
        test('should clear selection and dispatch new selection', () => {
            listener.setSelection = jest.fn();

            listener.handleSelectionChange();

            expect(listener.setSelection).toHaveBeenCalled();
        });

        test('should do nothing if select using mouse', () => {
            listener.isMouseSelecting = true;
            listener.setSelection = jest.fn();

            listener.handleSelectionChange();

            expect(listener.setSelection).not.toHaveBeenCalled();
        });
    });
});
