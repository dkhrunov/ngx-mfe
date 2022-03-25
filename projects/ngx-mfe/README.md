# Angular micro-frontend library - ngx-mfe

#### This library depends on [@angular-architects/module-federation v14.2.1](https://github.com/angular-architects/module-federation-plugin)

> Thanks to Manfred Steyer for your [series of posts](https://www.angulararchitects.io/en/aktuelles/the-microfrontend-revolution-module-federation-in-webpack-5/) about Module Federation in Webpack 5 and Micro-frontends.

> Note: before using, check out a [series of posts](https://www.angulararchitects.io/en/aktuelles/the-microfrontend-revolution-module-federation-in-webpack-5/) from Manfred Steyer.

> I recommend using the nx monorepository.

> If you are using Angular v12 and @angular-architects/module-federation v12.2.0 you should use this library v1.0.2.

## Contents

-   [Сonvention](#convention)
-   [Configuration](#configuration)
-   [Configuration options](#configuration-options)
-   [Use in Routing](#use-in-routing)
-   [Use in plugin-based approach](#use-in-plugin-based-approach)
-   [Use MfeService](#use-mfeservice)

## Сonvention

1. Micro-frontend string or MFE string means this type of string 'mfe-app/exposed-component'. All elements in this line are designed in kebab-case style. The first half in the example above 'mfe-app/' is the name of the mfe application, the second half is the name of a exposed component or module declared in the ModuleFederationPlugin in webpack.config.js.

2. The key of the exposed element from the ModuleFederationPlugin must match the element's class name.

```js
// webpack.config.js file
new ModuleFederationPlugin({
	[...]
	exposes: {
		'HomeModule': 'apps/login/src/app/home/home.module.ts',
	},
	[...]
});
```

```typescript
// home.module.ts file
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';


@NgModule({
	declarations: [HomeComponent],
	imports: [
		CommonModule,
		RouterModule.forChild([
			{
				path: '',
				component: HomeComponent,
			},
		]),
	],
})
export class HomeModule {}
```

3. If you use plugin-based approach with **MfeOutletDirective** then you should expose from ModuleFederationPlugin both component and module, that decalred this component. They should have same name and differ only in the '*...Component*' or '*...Module*' prefix, example of home.component.ts:

```js
new ModuleFederationPlugin({
	[...]
	exposes: {
		'HomeModule': 'apps/login/src/app/home/home.module.ts',
		'HomeComponent': 'apps/login/src/app/home/home.component.ts',
	},
	[...]
});
```

4. Internal сonvention. All micro-frontend designations are in kebab-case style. This means that if you have a micro-frontend named `fallbacks-mfe`, then you must specify the line `fallback-mfe/component` in all functions and directives of this library. Same rule for component name, if you have a component named `NotFoundComponent` you must sets `fallbacks-mfe/not-found`.

5. All functions and directives load micro-frontends with predefined option `type = 'module'`. More about type as `module` or `script` [here](https://www.angulararchitects.io/en/aktuelles/dynamic-module-federation-with-angular/) and here [migrations guid to Angular v13](https://github.com/angular-architects/module-federation-plugin/blob/main/migration-guide.md)

## Configuration

To configure this library, you should import MfeModule to core.module/app.module once for the entire application:

```typescript
@NgModule({
	imports: [
		MfeModule.forRoot({
			mfeConfig: {
				"dashboard-mfe": "http://localhost:4201/remoteEntry.js",
				"loaders-mfe": "http://localhost:4202/remoteEntry.js",
				"fallbacks-mfe": "http://localhost:4203/remoteEntry.js"
			},
			preload: ['loaders-mfe', 'fallbacks-mfe'],
			delay: 500,
			loader: 'loaders-mfe/spinner',
			fallback: 'fallbacks-mfe/not-found',
		}),
	],
})
export class CoreModule {}
```

## Configuration options

List of all available options:

-   **mfeConfig** - its map, key is micro-frontend app name and value is remoteEntryUrl string.
	> remoteEntryUrl - URL where runs micro-frontends.

    > More about remoteEntryUrl in Micro-frontends world [here](https://www.angulararchitects.io/en/aktuelles/the-microfrontend-revolution-module-federation-in-webpack-5/)

-   **preload** (Optional) - list of micro-frontends, bundles of the specified micro-frontends will be loaded immediately and saved in the cache.
-   **delay** (Optional) *Now only works in plugin-based approach*. - The delay between displaying the contents of the bootloader and the micro-frontend. This is to avoid flickering when the micro-frontend loads very quickly. _By default 0._
-   **loader** (Optional) *Now only works in plugin-based approach*. - Displayed when loading bundle of micro-frontend. Indicated as a micro-frontend string _example: 'loader-mfe/spinner'._
-   **fallback** (Optional) *Now only works in plugin-based approach*. - Displayed when micro-frontend component loaded with error. Indicated as a micro-frontend string _example: 'fallback-mfe/not-found'._

    > For better UX, add loader and fallback micro-frontends to [preload]() array.

## Use in Routing

To use micro-frontends in Routing, it is enough to import and use the helper function called **loadMfeModule**, like in the example below:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loadMfeModule } from '@dkhrunov/ng-mfe';

const routes: Routes = [
	{
		path: 'dashboard',
		loadChildren: () => loadMfeModule('dashboard-mfe/entry'),
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' })],
	exports: [RouterModule],
})
export class AppRoutingModule {}
```

## Use in plugin-based approach

This approach allows us to load micro-frontends directly from HTML.

> More about plugin-based approach [here](https://www.angulararchitects.io/en/aktuelles/dynamic-module-federation-with-angular-2/)

### NOTICE:

#### To work correctly with this approach, you must always expose both the module and the component declared in this module.

#### You must also follow the rule - one component per module.

An example webpack.config.js that exposes the EntryComponent micro-frontend "dashboard-mfe":

```js
return {
	...
	resolve: {
		alias: sharedMappings.getAliases(),
	},
	plugins: [
		new ModuleFederationPlugin({
			name: 'dashboard-mfe',
			exposes: {
				// Expose Module
				EntryModule: 'apps/dashboard-mfe/src/app/remote-entry/entry.module.ts',
				// Expose Component that declared in EntryModule @NgModule({ declarations: [EntryComponent] });
				EntryComponent: 'apps/dashboard-mfe/src/app/remote-entry/entry.component.ts',
			},
			filename: 'remoteEntry',
			shared: share({
				'@angular/core': {
					singleton: true,
					strictVersion: true,
					requiredVersion: 'auto',
				},
				'@angular/common': {
					singleton: true,
					strictVersion: true,
					requiredVersion: 'auto',
				},
				'@angular/common/http': {
					singleton: true,
					strictVersion: true,
					requiredVersion: 'auto',
				},
				'@angular/router': {
					singleton: true,
					strictVersion: true,
					requiredVersion: 'auto',
				},
				rxjs: {
					singleton: true,
					strictVersion: true,
					requiredVersion: 'auto',
				},
				'rxjs/operators': {
					singleton: true,
					strictVersion: true,
					requiredVersion: '^7',
				},
				...sharedMappings.getDescriptors(),
			}),
		}),
		sharedMappings.getPlugin(),
	],
};
```

This architectural approach will use **MfeOutletDirective**.

1. Just display the component "EntryComponent" of micro-frontend "dashboard-mfe":

```html
<ng-container *mfeOutlet="'dashboard-mfe/entry'"></ng-container>
```

2. Display the component with @Input() data binding. For data binding use property `input`:

```html
<ng-container *mfeOutlet="'dashboard-mfe/entry'; inputs: { text: text$ | async };"></ng-container>
```

> If you try to bind a @Input() property that is not in the component, then an error will fall into the console:
> "Input **someInput** is not input of **SomeComponent**."

3. Display the component with @Output() data binding. For @Output() binding use property `output`:

```html
<ng-container *mfeOutlet="'dashboard-mfe/entry'; inputs: { text: text$ | async };"></ng-container>
```

> If you try to bind a @Output() property that is not in the component, then an error will fall into the console:
> "Output **someOutput** is not output of **SomeComponent**."

> If you try to pass a non-function, then an error will fall into the console:
> "Output **someOutput** must be a function."

4. To override the default loader delay, confgured in `MfeModule.ForRoot({ ... })`, provide custom number in ms to property `loaderDelay`:

```html
<ng-container *mfeOutlet="'dashboard-mfe/entry'; loaderDelay: 1000"></ng-container>
```

5. To override the default loader or fallback components, confgured in `MfeModule.ForRoot({ ... })`, provide TemplateRef or micro-frontend string to property `loader` and `fallback`:

> In the example below, loader provided as a TemplateRef, and fallback is micro-frontend string.

```html
<ng-container
	*mfeOutlet="
	'dashboard-mfe/entry';
	loader: loader;
	fallback: 'fallback-mfe/not-found'
"
>
</ng-container>

<ng-template #loader>
	<div>loading...</div>
</ng-template>
```

6. You can also provide a custom injector for a component like this:

```html
<ng-container *mfeOutlet="'dashboard-mfe/entry'; injector: customInjector"></ng-container>
```

## Use MfeService

You can load micro-frontend module class and component class by using **MfeService**.

> Under the hood **MfeOutletDirective** uses **MfeService** to resolve the micro-frontend component factory.

### MfeService API

-   `resolveComponentFactory<M, C>(mfe: string, injector?: Injector): Promise<ComponentFactory<C>>` - Resolve the micro-frontend component factory.

-   `load<M, C>(mfe: string): Promise<LoadedMfe<M, C>>` - Loads the micro-frontend exposed module class and exposed component class.

-   `loadModule<M>(mfe: string): Promise<Type<M>>` - Loads an exposed micro-frontend module class.

-   `loadComponent<C>(mfe: string): Promise<Type<C>>` - Loads an exposed micro-frontend component class.
