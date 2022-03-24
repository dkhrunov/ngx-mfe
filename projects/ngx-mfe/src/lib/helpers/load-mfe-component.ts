import { loadRemoteModule } from '@angular-architects/module-federation';
import { Type } from '@angular/core';
import { parseMfeString } from './parse-mfe-string';
import { validateMfeString } from './validate-mfe-string';

/**
 * Loads exposed component of the micro-frontend.
 *
 * @param mfe The name of the micro-frontend and the name of the exposed component in this micro-frontend,
 * are given after slash symbol "/", for example: 'auth-mfe/login'.
 */
export async function loadMfeComponent<T = unknown>(mfe: string): Promise<Type<T>> {
	validateMfeString(mfe);

	const options = parseMfeString(mfe, 'Component');
	const bundle = await loadRemoteModule(options);

	return bundle[options.exposedModule];
}
