import { MfeConfig } from './mfe-config.interface';
import { RemoteComponent } from './remote-component.interface';

/**
 * Global options.
 */
export interface NgxMfeOptions {
	/**
	 * Options for each micro-frontend app.
	 */
	mfeConfig: MfeConfig;
	/**
   * List of names of remote appls, declared apps will be downloaded immediately and stored in the cache.
	 */
	preload?: string[];
	/**
	 * Loader remote component.
	 *
	 * Shows when load bundle of the micro-frontend.
	 *
	 * For better UX, add this micro-frontend to {@link preload} array.
	 */
	loader?: RemoteComponent;
	/**
	 * The delay between displaying the contents of the bootloader and the micro-frontend.
	 *
	 * This is to avoid flickering when the micro-frontend loads very quickly.
	 */
	loaderDelay?: number;
	/**
	 * Fallback remote component.
	 * 
	 * Showing when an error occurs while loading bundle
	 * or when trying to display the contents of the micro-frontend.
	 *
	 * For better UX, add this micro-frontend to {@link preload} array.
	 */
	fallback?: RemoteComponent;
}
