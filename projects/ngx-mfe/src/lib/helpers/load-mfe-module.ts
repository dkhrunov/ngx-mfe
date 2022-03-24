import { loadRemoteModule } from '@angular-architects/module-federation';
import { Type } from '@angular/core';
import { parseMfeString } from './parse-mfe-string';
import { validateMfeString } from './validate-mfe-string';

/**
 * Loads exposed module of the micro-frontend.
 *
 * @param mfe The name of the micro-frontend and the name of the exposed module in this micro-frontend,
 * are given after slash symbol "/", for example: 'auth-mfe/login'.
 */
export async function loadMfeModule<T = unknown>(mfe: string): Promise<Type<T>> {
	validateMfeString(mfe);

	const options = parseMfeString(mfe, 'Module');
	const bundle = await loadRemoteModule(options);

	return bundle[options.exposedModule];
}
