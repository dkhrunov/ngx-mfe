import { IMfeConfig } from './mfe-config.interface';

/**
 * Global options.
 */
export interface NgxMfeOptions {
	/**
	 * Options for each micro-frontend app.
	 */
	mfeConfig: IMfeConfig;
	/**
	 * List of micro-fronts, bundles of the specified micro-fronts
	 * will be loaded immediately and saved in the cache.
	 */
	preload?: string[];
	/**
	 * Loader micro-frontend.
	 *
	 * Shows when load bundle of another micro-frontend.
	 *
	 * For better UX, add this micro-frontend to {@link preload} array.
	 */
	loader?: string;
	/**
	 * The delay between displaying the contents of the bootloader and the micro-frontend.
	 *
	 * This is to avoid flickering when the micro-frontend loads very quickly.
	 */
	loaderDelay?: number;
	/**
	 * Fallback micro-frontend.
	 *
	 * Showing when an error occurs while loading bundle
	 * or when trying to display the contents of another micro-frontend.
	 *
	 * For better UX, add this micro-frontend to {@link preload} array.
	 */
	fallback?: string;
}
