import debounce from 'lodash/debounce';
import BaseAnnotator, { Options } from '../common/BaseAnnotator';
import BaseManager from '../common/BaseManager';
import { centerRegion, isRegion, RegionManager } from '../region';
import { Event } from '../@types';
import { getAnnotation } from '../store/annotations';
import { getSelectionItem } from '../highlight/highlightUtil';
import { Mode, setSelectionAction } from '../store';
import { scrollToLocation } from '../utils/scroll';
import './DocumentAnnotator.scss';

const TEXT_LAYER_ENHANCEMENT = 300;

export default class DocumentAnnotator extends BaseAnnotator {
    annotatedEl?: HTMLElement;

    managers: Map<number, Set<BaseManager>> = new Map();

    selectionChangeTimer?: number | undefined;

    constructor(options: Options) {
        super(options);

        this.addListener(Event.ANNOTATIONS_MODE_CHANGE, this.handleChangeMode);
        document.addEventListener('selectionchange', this.handleSelectionChange);
    }

    destroy(): void {
        if (this.selectionChangeTimer) {
            clearTimeout(this.selectionChangeTimer);
        }

        this.removeListener(Event.ANNOTATIONS_MODE_CHANGE, this.handleChangeMode);
        document.removeEventListener('selectionchange', this.handleSelectionChange);

        super.destroy();
    }

    init(scale = 1, rotation = 0): void {
        super.init(scale, rotation);

        // Clear previous selection
        this.store.dispatch(setSelectionAction(null));
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

    handleSelectionChange = debounce(
        (): void => {
            // Clear previous selection immediately
            this.store.dispatch(setSelectionAction(null));

            // Wait Pdf.js textLayer enhancement for 300ms (they hardcode this magic number)
            this.selectionChangeTimer = window.setTimeout(() => {
                this.store.dispatch(setSelectionAction(getSelectionItem()));
                this.selectionChangeTimer = undefined;
            }, TEXT_LAYER_ENHANCEMENT);
        },
        TEXT_LAYER_ENHANCEMENT,
        {
            // The previous selection needs to be cleared immediately when selection changes
            // Below options make sure the function is triggered on the leading edge of the timeout,
            // instead of on the trailing edge
            leading: true,
            trailing: false,
        },
    );

    render(): void {
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
