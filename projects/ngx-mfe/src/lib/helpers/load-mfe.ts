import { Type } from '@angular/core';
import { loadRemoteModule, LoadRemoteModuleOptions } from '@angular-architects/module-federation';

import { MfeRegistry } from '../registry';

/**
 *  Options for ```loadMfe``` function.
 */
export type LoadMfeOptions = {
	/**
	 * Set custom exposed module name, by default module name = exposedItem + 'Module'.
	 */
	moduleName?: string,
	/**
	 * Type of loaded module as a ```script``` or as a ```module```.
	 */
	type?: LoadRemoteModuleOptions['type'];
};

const loadMfeDefaultOptions: LoadMfeOptions = { type: 'module' };

/**
 * Loads remote bundle.
 *
 * @param remoteApp The name of the micro-frontend app decalred in ModuleFederationPlugin.
 * @param exposedModule  The key of the exposed module decalred in ModuleFederationPlugin.
 * @param options (Optional) object of options.
 */
export async function loadMfe<T = unknown>(
	remoteApp: string,
	exposedModule: string,
	options: LoadMfeOptions = loadMfeDefaultOptions
): Promise<Type<T>> {
  const _options: LoadMfeOptions = { ...loadMfeDefaultOptions, ...options };
	const remoteEntry = MfeRegistry.getInstance().getMfeRemoteEntry(remoteApp);
	const loadRemoteModuleOptions: LoadRemoteModuleOptions =
		_options.type === 'module'
			? { type: _options.type, remoteEntry, exposedModule }
			: { type: _options.type, remoteEntry, exposedModule, remoteName: remoteApp };
	const bundle = await loadRemoteModule(loadRemoteModuleOptions);
  const moduleName = _options.moduleName ?? exposedModule;
  const module = bundle[moduleName]

  if (!module) {
    throw new Error(`Module with name "${moduleName}" does not exist in the exposed file. Key of exposed file must match with class name in this file (Key of exposed file it is key of  'exposes' object in webpack config inside ModuleFederationPlugin).`);
  }

	return module;
}
