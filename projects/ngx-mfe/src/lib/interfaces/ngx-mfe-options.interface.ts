import { Type } from '@angular/core';
import { MfeConfig } from './mfe-config.interface';

/**
 * Global options.
 */
export interface NgxMfeOptions<TLoader = unknown, TFallback = unknown> {
	/**
	 * Options for each micro-frontend app.
	 */
	mfeConfig: MfeConfig;
	/**
	 * List of micro-fronts, bundles of the specified micro-fronts
	 * will be loaded immediately and saved in the cache.
	 */
	preload?: string[];
	/**
	 * Loader component.
	 * 
	 * Accepts an MFE string or Component class.
	 *
	 * Shows when load bundle of the micro-frontend.
	 *
	 * For better UX, add this micro-frontend to {@link preload} array.
	 */
	loader?: string | Type<TLoader>;
	/**
	 * The delay between displaying the contents of the bootloader and the micro-frontend.
	 *
	 * This is to avoid flickering when the micro-frontend loads very quickly.
	 */
	loaderDelay?: number;
	/**
	 * Fallback component.
	 * 
	 * Accepts an MFE string or Component class.
	 *
	 * Showing when an error occurs while loading bundle
	 * or when trying to display the contents of the micro-frontend.
	 *
	 * For better UX, add this micro-frontend to {@link preload} array.
	 */
	fallback?: string | Type<TFallback>;
}
