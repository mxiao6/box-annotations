import debounce from 'lodash/debounce';
import BaseAnnotator, { Options } from '../common/BaseAnnotator';
import BaseManager from '../common/BaseManager';
import { centerRegion, isRegion, RegionManager } from '../region';
import { Event } from '../@types';
import { getAnnotation } from '../store/annotations';
import { getSelection } from './docUtil';
import { HighlightManager } from '../highlight';
import { Mode, setSelectionAction } from '../store';
import { scrollToLocation } from '../utils/scroll';
import './DocumentAnnotator.scss';

// Pdf.js textLayer enhancement requires waiting for 300ms (they hardcode this magic number)
const TEXT_LAYER_ENHANCEMENT = 300;
// Wait 500ms for keyboard selection
const SELECTION_CHANGE_DEBOUNCE = 500;

export default class DocumentAnnotator extends BaseAnnotator {
    annotatedEl?: HTMLElement;

    managers: Map<number, Set<BaseManager>> = new Map();

    selectionChangeTimer?: number;

    isMouseSelecting = false;

    mouseEventHandlerAdded = false;

    constructor(options: Options) {
        super(options);

        this.addListener(Event.ANNOTATIONS_MODE_CHANGE, this.handleChangeMode);
        document.addEventListener('selectionchange', this.debounceHandleSelectionChange);
    }

    destroy(): void {
        clearTimeout(this.selectionChangeTimer);

        this.removeListener(Event.ANNOTATIONS_MODE_CHANGE, this.handleChangeMode);
        document.removeEventListener('selectionchange', this.debounceHandleSelectionChange);

        if (this.mouseEventHandlerAdded && this.annotatedEl) {
            this.annotatedEl.addEventListener('mousedown', this.handleMouseDown);
            this.annotatedEl.addEventListener('mouseup', this.handleMouseUp);
        }

        super.destroy();
    }

    getAnnotatedElement(): HTMLElement | null | undefined {
        return this.containerEl?.querySelector('.bp-doc');
    }

    getPageManagers(pageEl: HTMLElement): Set<BaseManager> {
        const pageNumber = this.getPageNumber(pageEl);
        const pageReferenceEl = this.getPageReference(pageEl);
        const managers = this.managers.get(pageNumber) || new Set();

        // Destroy any managers that were attached to page elements that no longer exist
        managers.forEach(manager => {
            if (!manager.exists(pageEl)) {
                manager.destroy();
                managers.delete(manager);
            }
        });

        // Lazily instantiate managers as pages are added or re-rendered
        if (managers.size === 0) {
            if (this.isFeatureEnabled('highlightText')) {
                managers.add(new HighlightManager({ location: pageNumber, referenceEl: pageReferenceEl }));
            }
            managers.add(new RegionManager({ location: pageNumber, referenceEl: pageReferenceEl }));
        }

        return managers;
    }

    getPageNumber(pageEl: HTMLElement): number {
        return parseInt(pageEl.dataset.pageNumber || '', 10) || 1;
    }

    getPageReference(pageEl: HTMLElement): HTMLElement {
        const annotationsLayerEl = pageEl.querySelector('.annotationLayer') as HTMLElement;
        const canvasLayerEl = pageEl.querySelector('.canvasWrapper') as HTMLElement;
        const textLayerEl = pageEl.querySelector('.textLayer') as HTMLElement;
        return annotationsLayerEl || textLayerEl || canvasLayerEl; // Use the optional layers if they're available
    }

    getPage(pageNumber: number): HTMLElement | undefined {
        return this.getPages().find(pageEl => pageNumber === this.getPageNumber(pageEl));
    }

    getPages(): HTMLElement[] {
        // TODO: Inject page/container elements from Preview SDK rather than DOM?
        return this.annotatedEl ? Array.from(this.annotatedEl.querySelectorAll('.page')) : [];
    }

    handleMouseDown = (): void => {
        this.isMouseSelecting = true;

        clearTimeout(this.selectionChangeTimer);
        this.store.dispatch(setSelectionAction(null));
    };

    handleMouseUp = (): void => {
        this.isMouseSelecting = false;

        this.selectionChangeTimer = window.setTimeout(() => {
            this.store.dispatch(setSelectionAction(getSelection()));
        }, TEXT_LAYER_ENHANCEMENT);
    };

    handleChangeMode = ({ mode }: { mode: Mode }): void => {
        if (!this.annotatedEl) {
            return;
        }

        if (mode === Mode.HIGHLIGHT) {
            this.annotatedEl.classList.add('ba-is-highlighting');
        } else {
            this.annotatedEl.classList.remove('ba-is-highlighting');
        }
    };

    handleSelectionChange = (): void => {
        if (this.isMouseSelecting) {
            return;
        }

        this.store.dispatch(setSelectionAction(getSelection()));
    };

    debounceHandleSelectionChange = debounce(this.handleSelectionChange, SELECTION_CHANGE_DEBOUNCE);

    render(): void {
        // Clear previous selection
        this.store.dispatch(setSelectionAction(null));

        if (!this.mouseEventHandlerAdded && this.annotatedEl) {
            this.annotatedEl.addEventListener('mousedown', this.handleMouseDown);
            this.annotatedEl.addEventListener('mouseup', this.handleMouseUp);
        }

        this.getPages()
            .filter(({ dataset }) => dataset.loaded && dataset.pageNumber)
            .forEach(pageEl => this.renderPage(pageEl));
    }

    renderPage(pageEl: HTMLElement): void {
        const pageManagers = this.getPageManagers(pageEl);
        const pageNumber = this.getPageNumber(pageEl);

        // Render annotations for every page
        pageManagers.forEach(manager =>
            manager.render({
                intl: this.intl,
                store: this.store,
            }),
        );

        this.managers.set(pageNumber, pageManagers);
    }

    scrollToAnnotation(annotationId: string | null): void {
        if (!annotationId) {
            return;
        }

        const annotation = getAnnotation(this.store.getState(), annotationId);
        const annotationPage = annotation?.target.location.value ?? 1;
        const annotationPageEl = this.getPage(annotationPage);

        if (!annotation || !annotationPage || !annotationPageEl || !this.annotatedEl) {
            return;
        }

        if (isRegion(annotation)) {
            scrollToLocation(this.annotatedEl, annotationPageEl, {
                offsets: centerRegion(annotation.target.shape),
            });
        }
    }
}
