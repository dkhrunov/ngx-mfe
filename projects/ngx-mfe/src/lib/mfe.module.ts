import { loadRemoteEntry } from '@angular-architects/module-federation';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { MfeOutletDirective } from './directives';
import { validateMfeString } from './helpers';
import { NGX_MFE_OPTIONS } from './injection-tokens';
import { NgxMfeOptions } from './interfaces';
import { MfeRegistry } from './registry';

/**
 * Core lib of micro-frontend architecture.
 * ---------------
 *
 * For core module provide MfeModule.forRoot(options). <br/>
 *
 * For feature modules provide MfeModule.
 */
@NgModule({
	declarations: [MfeOutletDirective],
	exports: [MfeOutletDirective],
})
export class MfeModule {
	/**
	 * Sets global configuration of Mfe lib.
	 * @param options Object of options.
	 */
	public static forRoot(options: NgxMfeOptions): ModuleWithProviders<MfeModule> {
		const mfeRegistry = MfeRegistry.getInstance(options.mfeConfig);
		const loadMfeBundle = loadMfeBundleWithMfeRegistry(mfeRegistry);

		if (options.loader) validateMfeString(options.loader);
		if (options.fallback) validateMfeString(options.fallback);

		if (options.preload) {
			options.preload.map((mfe) => loadMfeBundle(mfe));
		}

		return {
			ngModule: MfeModule,
			providers: [
				{
					provide: MfeRegistry,
					useValue: mfeRegistry,
				},
				{
					provide: NGX_MFE_OPTIONS,
					useValue: options,
				},
			],
		};
	}
}

/**
 * Loads micro-frontend app bundle (HOF - High Order Function).
 * ------
 *
 * Returns function that can load micro-frontend app by provided name.
 * @param mfeRegistry Registry of micro-frontends apps.
 */
function loadMfeBundleWithMfeRegistry(mfeRegistry: MfeRegistry): (mfe: string) => Promise<void> {
	return (mfe: string): Promise<void> => {
		const remoteEntry = mfeRegistry.getMfeRemoteEntry(mfe);

		return loadRemoteEntry({ type: 'module', remoteEntry});
	};
}
