import {
	AfterViewInit,
	ChangeDetectorRef,
	ComponentFactory,
	ComponentRef,
	Directive,
	EmbeddedViewRef,
	Inject,
	Injector,
	Input,
	OnChanges,
	OnDestroy,
	TemplateRef,
	Type,
	ViewContainerRef
} from '@angular/core';
import { EChangesStrategy, TrackChanges } from '../decorators';
import { validateMfeString } from '../helpers';
import { NGX_MFE_OPTIONS } from '../injection-tokens';
import { NgxMfeOptions } from '../interfaces';
import { DynamicComponentBinding, MfeComponentsCache, MfeService } from '../services';
import { MfeOutletInputs, MfeOutletOutputs } from '../types';

const delay = <T>(time: number) => new Promise<T>((resolve) => setTimeout(resolve, time));

/**
 * Micro-frontend directive for plugin-based approach.
 * -------------
 *
 * This directive allows you to load micro-frontend inside in HTML template.
 *
 * @example
 * <!-- Loads entry component from dashboard micro-frontend app. -->
 * <ng-container *mfeOutlet="'dashboard-mfe/entry'"></ng-container>
 *
 * @example
 * <!--
 *   Loads micro-frontend named - entry from dashboard app with custom loader and custom fallback.
 *   And set input text to micro-frontend component.
 * -->
 * <ng-container *mfeOutlet="
 *     'dashboard/entry';
 *     inputs: { text: text$ | async };
 *     loader: loader;
 *     fallback: fallback
 * ">
 * </ng-container>
 *
 * <ng-template #loader><div>loading...</div></ng-template>
 * <ng-template #fallback><div>ops! Something went wrong</div></ng-template>
 *
 * @example
 * <!--
 *    Loads micro-frontend named - entry from dashboard app with
 *    custom fallback specified as micro-frontend component too.
 * -->
 * <ng-container *mfeOutlet="
 *     'client-dashboard-mfe/entry';
 *     fallback: 'fallback-mfe/default'
 * ">
 * </ng-container>
 */
@Directive({
	// eslint-disable-next-line @angular-eslint/directive-selector
	selector: '[mfeOutlet]',
	exportAs: 'mfeOutlet',
	providers: [DynamicComponentBinding],
})
export class MfeOutletDirective implements OnChanges, AfterViewInit, OnDestroy {
	/**
	 * Micro-frontend string. First half it is app name (remote app)
	 * and second half after slash '/' symbol it is name of exposed component.
	 *
	 * **Notice**
	 *
	 * From micro-frontend app should be exposed both module class and component class.
	 *
	 * @example
	 * // loader-mfe - it is app name
	 * // spinner - exposed component.
	 * // From loader-mfe should be exposed SpinnerComponent and SpinnerModule.
	 * 'loaded-mfe/spinner'
	 */
	@Input('mfeOutlet')
	public mfe!: string;

	/**
	 * A map of Inputs for a micro-frontend component.
	 */
	@Input('mfeOutletInputs')
	public inputs?: MfeOutletInputs;

	/**
	 * A map of Outputs for a micro-frontend component.
	 */
	@Input('mfeOutletOutputs')
	public outputs?: MfeOutletOutputs;

	/**
	 * Custom injector for micro-frontend component.
	 *
	 * @default current injector
	 */
	@Input('mfeOutletInjector')
	public injector?: Injector = this._injector;

	/**
	 * TemplateRef or MFE string or TemplateRef or Component class.
	 * Displayed when loading the micro-frontend.
	 *
	 * **Overrides the loader specified in the global library settings.**
	 *
	 * @default options.loader
	 */
	@Input('mfeOutletLoader')
	public loader?: string | TemplateRef<unknown> | Type<unknown> = this._options.loader;

	/**
	 * Specifies the minimum loader display time in ms.
	 * This is to avoid flickering when the micro-frontend loads very quickly.
	 * 
	 * **Overrides the loaderDelay specified in the global library settings.**
	 *
	 * @default options.loaderDelay
	 */
	@Input('mfeOutletLoaderDelay')
	public loaderDelay = this._options.loaderDelay ?? 0;

	/**
	 * TemplateRef or MFE string or TemplateRef or Component class.
	 * Displayed when loading or compiling a micro-frontend with an error.
	 *
	 * **Overrides fallback the specified in the global library settings.**
	 *
	 * @default options.fallback
	 */
	@Input('mfeOutletFallback')
	public fallback?: string | TemplateRef<unknown> | Type<unknown> = this._options.fallback;

	private _mfeComponentFactory?: ComponentFactory<unknown>;
	private _mfeComponentRef?: ComponentRef<unknown>;
	private _loaderComponentRef?: ComponentRef<unknown> | EmbeddedViewRef<unknown>;
	private _fallbackComponentRef?: ComponentRef<unknown> | EmbeddedViewRef<unknown>;

	constructor(
		private readonly _vcr: ViewContainerRef,
		private readonly _injector: Injector,
		private readonly _cache: MfeComponentsCache,
		private readonly _mfeService: MfeService,
		private readonly _binding: DynamicComponentBinding,
		@Inject(NGX_MFE_OPTIONS) private readonly _options: NgxMfeOptions
	) {}

	@TrackChanges('mfe', 'validateMfe', { compare: true })
	@TrackChanges('loader', 'validateLoader', { compare: true })
	@TrackChanges('fallback', 'validateFallback', { compare: true })
	@TrackChanges('mfe', 'render', {
		compare: true,
		strategy: EChangesStrategy.NonFirst
	})
	@TrackChanges('inputs', 'transferInputs', {
		strategy: EChangesStrategy.NonFirst,
		compare: true,
	})
	public ngOnChanges(): void {
		return;
	}

	public ngOnDestroy(): void {
		this._clear();
	}

	public ngAfterViewInit(): void {
		this.render();
	}

	/**
	 * Checks that value of directive is correct micro-frontend string.
	 *
	 * @param value Value
	 *
	 * @internal
	 */
	protected validateMfe(value: string): void {
		validateMfeString(value);
	}

	/**
	 * Checks that value of loader Input is correct micro-frontend string.
	 *
	 * @param value Value
	 *
	 * @internal
	 */
	protected validateLoader(value: string | TemplateRef<unknown> | Type<unknown>): void {
		if (typeof value === 'string') {
			validateMfeString(value);
		}
	}

	/**
	 * Checks that value  of fallback Input is correct micro-frontend string.
	 *
	 * @param value Value
	 *
	 * @internal
	 */
	protected validateFallback(value: string | TemplateRef<unknown> | Type<unknown>): void {
		if (typeof value === 'string') {
			validateMfeString(value);
		}
	}

	/**
	 * Transfer MfeOutletInputs to micro-frontend component.
	 *
	 * Used when changing input "inputs" of this directive.
	 *
	 * @internal
	 */
	 protected transferInputs(): void {
		if (!this._mfeComponentRef || !this._mfeComponentFactory) return;

		this._binding.bindInputs(
			this._mfeComponentFactory.inputs,
			this.inputs ?? {},
			this._mfeComponentRef?.instance
		);

		// Workaround for bug related to Angular and dynamic components.
		// Link - https://github.com/angular/angular/issues/36667#issuecomment-926526405
		this._mfeComponentRef?.injector.get(ChangeDetectorRef).detectChanges();
	}

	/**
	 * Rerender micro-frontend component.
	 *
	 * While loading bundle of micro-frontend showing loader.
	 * If error occur then showing fallback.
	 *
	 * Used when changing input "mfe" of this directive.
	 *
	 * @internal
	 */
	 protected async render(): Promise<void> {
		try {
			// If some component already rendered then need to unbind outputs
			if (this._mfeComponentFactory) this._binding.unbindOutputs();

			if (!this._cache.isRegistered(this.mfe)) {
				await this._showLoader();
			}

			await this._showMfe();
		} catch (e) {
			console.error(e);
			await this._showFallback();
		}
	}

	/**
	 * Shows micro-frontend component.
	 *
	 * @internal
	 */
	private async _showMfe(): Promise<void> {
		const [_, componentFactory] = await Promise.all([
			delay(this.loaderDelay),
			this._mfeService.resolveComponentFactory(this.mfe, this.injector),
		]);

		this._clear();

		const componentRef = this._vcr.createComponent(componentFactory, undefined, this.injector);
		componentRef.changeDetectorRef.detectChanges();

		this._mfeComponentFactory = componentFactory;
		this._mfeComponentRef = componentRef;

		this._bindMfeData();
	}

	/**
	 * Shows loader content.
	 *
	 * @internal
	 */
	private async _showLoader(): Promise<void> {
		if (this.loader) {
			this._loaderComponentRef = await this._displayComponent(this.loader);
		}
	}

	/**
	 * Shows fallback content.
	 *
	 * @internal
	 */
	private async _showFallback(): Promise<void> {
		if (this.fallback) {
			this._fallbackComponentRef = await this._displayComponent(this.fallback);
		}
	}

	/**
	 * Shows MFE | TemlateRer | Component content
	 * @param templateRefOrMfeString MFE string or TemlateRef or Component 
	 */
	private async _displayComponent<TComponent = unknown, TModule = unknown>(
		mfeString: string
	): Promise<ComponentRef<TComponent>>;
	private async _displayComponent<TContext = unknown>(
		templateRef: TemplateRef<TContext>
	): Promise<EmbeddedViewRef<TContext>>;
	private async _displayComponent<TComponent = unknown>(
		component: Type<TComponent>
	): Promise<ComponentRef<TComponent>>;
	private async _displayComponent<
		TComponent = unknown,
		TModule = unknown,
		TContext = unknown
	>(
		content: string | TemplateRef<TContext> | Type<TComponent>
	): Promise<EmbeddedViewRef<TContext> | ComponentRef<TComponent>>;
	private async _displayComponent<
		TComponent = unknown,
		TModule = unknown,
		TContext = unknown
	>(
		content: string | TemplateRef<TContext> | Type<TComponent>
	): Promise<EmbeddedViewRef<TContext> | ComponentRef<TComponent>> {
		this._clear();

		// MFE
		if (typeof content === 'string') {
			const componentFactory = await this._mfeService.resolveComponentFactory<TModule, TComponent>(content, this.injector);
			const componentRef = this._vcr.createComponent(
				componentFactory,
				undefined,
				this.injector
			);
			componentRef.changeDetectorRef.detectChanges();
			return componentRef;
		}
		// TemplateRef
		else if (content instanceof TemplateRef) {
			return this._vcr.createEmbeddedView(content);
		}
		// Component
		else {
			return this._vcr.createComponent(content);
		}
	}

	/**
	 * Binding the initial data of the micro-frontend.
	 *
	 * @internal
	 */
	private _bindMfeData(): void {
		if (!this._mfeComponentRef || !this._mfeComponentFactory) {
			throw new Error(
				`_bindMfeData method must be called after micro-frontend component "${this.mfe}" has been initialized.`
			);
		}

		this._binding.bindInputs(
			this._mfeComponentFactory.inputs,
			this.inputs ?? {},
			this._mfeComponentRef?.instance
		);
		this._binding.bindOutputs(
			this._mfeComponentFactory.outputs,
			this.outputs ?? {},
			this._mfeComponentRef?.instance
		);

		// Workaround for bug related to Angular and dynamic components.
		// Link - https://github.com/angular/angular/issues/36667#issuecomment-926526405
		this._mfeComponentRef?.injector.get(ChangeDetectorRef).detectChanges();
	}

	/**
	 * Destroy all displayed components.
	 *
	 * @internal
	 */
	private _clear() {
		this._loaderComponentRef?.destroy();
		this._fallbackComponentRef?.destroy();
		this._mfeComponentRef?.destroy();
		this._vcr.clear();
	}
}
