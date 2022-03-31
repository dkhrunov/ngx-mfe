# Angular micro-frontend library - ngx-mfe

A library for working with MFE in Angular in a plugin-based approach and a routing-based approach.

------

This library depends on [@angular-architects/module-federation v14](https://www.npmjs.com/package/@angular-architects/module-federation) and Angular v13

> If you are using Angular v12 and @angular-architects/module-federation v12.2.0 you should use this [library v1.0.2](https://github.com/dkhrunov/ngx-mfe/tree/1.0.2).


> In version 1.0.8 changed names of some variables:
> - `IMfeModuleRootOptions` interface renamed to `NgxMfeOptions`;
> - Property `delay` in the `NgxMfeOptions` renamed to `loaderDelay`;
> - `OPTIONS` injection token renamed to `NGX_MFE_OPTIONS`;

## Motivation

With the advent of Webpack 5 and the ModuleFederationPlugin, it became possible to separately compiled and deployed code, like microservices on the Backend.

The **ngx-mfe** is an extension of the functionality of the [@angular-architects/module-federation](https://www.npmjs.com/package/@angular-architects/module-federation). Using @angular-architects/module-federation you could only upload one micro-frontend per page (in the Routing), this limitation was the main reason for the creation of this library - **ngx-mfe**.

The main feature of the **ngx-mfe** library is ability to work with micro-frontends directly in the HTML template using a plugin-based approach. You can load more than one micro-frontend per page.

## Features

🔥 Load multiple micro-frontends directly from the HTML template, with the ability to display the loader component during loading, and the fallback component on error.

🔥 More convenient way to load MFE via Angular Routing.

🔥 Configure different remoteEntryUrl of the MFE for different builds (dev/prod/etc.).

## Contents

-   [Conventions](#conventions)
-   [Configuring](#configuring)
-   [Load MFE by Route](#load-mfe-by-route)
-   [Load MFE in HTML template / plugin-based approach](#load-mfe-in-html-template--plugin-based-approach) 
-   [Load MFE using MfeService](#load-mfe-using-mfeservice)

## Conventions

1. Micro-frontend string or MFE string - string is kebab-case style string notation and matches this pattern `"mfe-app/exposed-file-name"`, where:
	- `mfe-app` - this is the micro-frontend name specified in the property name in the `ModuleFederationPlugin`.
	- `exposed-file-name` - it is the exposed file name specified in the object exposes  in the `ModuleFederationPlugin`.

	This string is used in the `LoadMfeModule(mfeString)`, `LoadMfeComponent(mfeString)`, `MfeOutletDirective` and in the `MfeService`.

2. The key of the exposed file from the `ModuleFederationPlugin` must match the name of the exported class from that file.

```js
// webpack.config.js file
new ModuleFederationPlugin({
	[...]
	exposes: {
		HomeModule: 'apps/login/src/app/home/home.module.ts',
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

3. If you use plugin-based approach with `MfeOutletDirective` then you should expose from `ModuleFederationPlugin` both the Component and the Module in which this Component is declared. Example:

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

5. Currently all functions and directives that load micro-frontends has predefined option `type = 'module'`.
	
	More about type as `module` or `script` [here](https://www.angulararchitects.io/en/aktuelles/dynamic-module-federation-with-angular/) and here [migrations guid to Angular v13](https://github.com/angular-architects/module-federation-plugin/blob/main/migration-guide.md)

## Configuring

> For feature modules just import `MfeModule`

Add the ngx-mfe library to a shared property in the ModuleFederationPlugin inside webpack.config.js file for each application in your workspace.

```typescript
module.exports = {
	[...]
	plugins: [
		[...]
		new ModuleFederationPlugin({
			remotes: {},
			shared: share({
				[...]
				"ngx-mfe": {
					singleton: true,
					strictVersion: true,
					requiredVersion: 'auto',
					includeSecondaries: true
				},
				...sharedMappings.getDescriptors(),
			}),
			library: {
				type: 'module'
			},
		}),
		[...]
	],
	[...]
};
```


To configure this library, you should import `MfeModule.forRoot(options: NgxMfeOptions)` to the root module of the Host app(s), and to the root module of the Remote app(s) if you load MFE inside another MFE:

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
			loader: 'loaders-mfe/spinner',
			loaderDelay: 500,
			fallback: 'fallbacks-mfe/not-found',
		}),
	],
})
export class AppModule {}
```

List of all available options:

-   **mfeConfig** - object where **key** is micro-frontend app name specified in `ModuleFederationPlugin` (webpack.config.js) and **value** is remoteEntryUrl string. All data will be sets to `MfeRegistry`.

	*Key* it's the name same specified in webpack.config.js of MFE (Remote) in option name in `ModuleFederationPlugin`. 

	*Value* set the following pattern: `{url}/{remoteEntrypointFilename}`.

	- `url` is the url where the remote application is hosted.

	- `remoteEntrypointFilename` is the filename supplied in the remote's webpack configuration.
		
	Example http://localhost:4201/remoteEntry.js

	You can get `MfeRegistry` by DI:
	```typescript
	class AppComponent {

		constructor(public mfeRegistry: MfeRegistry) {}
	}
	```

	Or you can even get `MfeRegistry` without DI, because this class is written as a singleton:
	```typescript
	const mfeRegistry: MfeRegistry = MfeRegistry.getInstance();
	```

-   **preload** (Optional) - a list of micro-frontend names, their bundles (remoteEntry.js) will be loaded and saved in the cache when the application starts.

Next options are only works in plugin-based approach with `MfeOutletDirective`:
-   **loader** (Optional) - Displayed when loading bundle of micro-frontend. Indicated as a micro-frontend string _example: 'loader-mfe/spinner'._

-   **loaderDelay** (Optional) - The delay between displaying the contents of the bootloader and the micro-frontend. This is to avoid flickering when the micro-frontend loads very quickly. _By default 0._

-   **fallback** (Optional) - Displayed when micro-frontend component loaded with error. Indicated as a micro-frontend string _example: 'fallback-mfe/not-found'._

    > For better UX, add loader and fallback micro-frontends to [preload]() array.

You can get all configured options by injecting NGX_MFE_OPTIONS by DI:

```typescript
class AppComponent {

	constructor(@Inject(NGX_MFE_OPTIONS) public options: NgxMfeOptions) {}
}
```

## Load MFE by Route

To use micro-frontends in Routing, you must import and apply the helper function called `loadMfeModule`, like in the example below:

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

## Load MFE in HTML template / plugin-based approach

This approach allows us to load micro-frontends directly from HTML.

The advantages of this approach are that we can display several MFEs at once on the same page, even display several of the same MFEs.

> More about plugin-based approach [here](https://www.angulararchitects.io/en/aktuelles/dynamic-module-federation-with-angular-2/)

**Notice 1**: for correct work with the plugin-based approach, you must always expose both the Component and the Module in which this Component is declared.

**Notice 2**: you must follow the rule that only one bean must be declared for an exposed Module and that bean must also be exposed.

An example webpack.config.js that exposes the EntryComponent micro-frontend "dashboard-mfe":

```js
return {
	[...]
	resolve: {
		alias: sharedMappings.getAliases(),
	},
	plugins: [
		new ModuleFederationPlugin({
			name: 'dashboard-mfe',
			exposes: {
				// Expose Module
				EntryModule: 'apps/dashboard-mfe/src/app/remote-entry/entry.module.ts',
				// Expose Component that declared in EntryModule
				// @NgModule({ declarations: [EntryComponent] });
				EntryComponent: 'apps/dashboard-mfe/src/app/remote-entry/entry.component.ts',
			},
			filename: 'remoteEntry',
			shared: share({ ... }),
		}),
		sharedMappings.getPlugin(),
	],
};
```

This architectural approach use `MfeOutletDirective`.

1. Just display the component "EntryComponent" of micro-frontend "dashboard-mfe":

```html
<ng-container *mfeOutlet="'dashboard-mfe/entry'"></ng-container>
```

2. You can pass/bind `@Input` and `@Output` props to MFE component:

```html
<!-- app.component.html file -->
<ng-container *mfeOutlet="
	'dashboard-mfe/entry';
	inputs: { text: text$ | async };
	outputs: { click: onClick }
">
</ng-container>
```

```typescript
// app.component.ts file
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
	[...]
	// timer emits after 1 second, then every 2 seconds
	public readonly text$: Observable<number> = timer(1000, 2000);
	[...]
	// on click log to console event
	public onClick(event: MouseEvent): void {
		console.log('clicked', event);
	}
	[...]
}
```

> If you try to bind a @Input() property that is not in the component, then an error will fall into the console:
> "Input **someInput** is not input of **SomeComponent**."

> If you try to bind a @Output() property that is not in the component, then an error will fall into the console:
> "Output **someOutput** is not output of **SomeComponent**."

> If you try to pass a non-function, then an error will fall into the console:
> "Output **someOutput** must be a function."

3. To override the default loader delay, configured in `MfeModule.forRoot({ ... })`, provide custom number in ms to property `loaderDelay`:

```html
<ng-container *mfeOutlet="'dashboard-mfe/entry'; loaderDelay: 1000"></ng-container>
```

4. To override the default loader and fallback components, configured in `MfeModule.forRoot({ ... })`, specify content with `TemplateRef` or MFE string pass it to the appropriate properties `loader` and `fallback`:

> In the example below, `loader` provided as a TemplateRef, and `fallback` is micro-frontend string.

```html
<ng-container *mfeOutlet="
	'address-form/form';
	loader: loader;
	fallback: 'fallback-mfe/not-found'
">
</ng-container>

<ng-template #loader>
	<div>loading...</div>
</ng-template>
```

6. You can also provide a custom injector for a component like this:

```html
<ng-container *mfeOutlet="'address-form/form'; injector: customInjector"></ng-container>
```

## Load MFE using MfeService

You can load micro-frontend module class and component class by using `MfeService`.

> Under the hood `MfeOutletDirective` uses `MfeService` to resolve the micro-frontend component factory.

### MfeService API

-   `resolveComponentFactory<M, C>(mfe: string, injector?: Injector): Promise<ComponentFactory<C>>` - Resolve the micro-frontend component factory.

-   `load<M, C>(mfe: string): Promise<LoadedMfe<M, C>>` - Loads the micro-frontend exposed module class and exposed component class.

```typescript
interface LoadedMfe<TModule = unknown, TComponent = unknown> { 
	ModuleClass: Type<TModule>;
	ComponentClass: Type<TComponent>;
};
 ```

-   `loadModule<M>(mfe: string): Promise<Type<M>>` - Loads an exposed micro-frontend module class.

-   `loadComponent<C>(mfe: string): Promise<Type<C>>` - Loads an exposed micro-frontend component class.
