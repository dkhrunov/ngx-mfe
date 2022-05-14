# Angular micro-frontend library - ngx-mfe

A library for working with MFE in Angular in a plugin-based approach and a routing-based approach.

## Changelog

This library depends on [@angular-architects/module-federation v14](https://www.npmjs.com/package/@angular-architects/module-federation) and Angular v13

If you are using Angular v12 and @angular-architects/module-federation v12.2.0 you should use this [library v1.0.2](https://github.com/dkhrunov/ngx-mfe/tree/1.0.2).

### Changes in v1.1.0:

- Deleted the `loadMfeComponent` helper function;
- Deleted the `parseMfeString` helper function;
- Renamed the `loadMfeModule` helper function to `loadMfe` and added optional parameter `options: LoadMfeOptions`. `LoadMfeOptions` has property a `moduleName`, that sets a custom name for the Module class within the opened file, and has `type` that specify type of Module Federation;
- Renamed the `MfeService` to `MfeComponentFactoryResolver`;
- `MfeComponentFactoryResolver` has the same method as `MfeService`, but now it can accepts an optional `options: MfeComponentFactoryResolver` parameter. This parameter extends `LoadMfeOptions` type, added a `componentName` parameter, that sets a custom name for the Component class.
- Added new Input prop to the `MfeOutletDirective` - `options: MfeComponentFactoryResolver`, this parameter provided to `resolveComponentFactory` method of the `MfeComponentFactoryResolver` when resolving the component factory of MFE.
- Since **v1.1.0** you don't need to expose from `ModuleFederationPlugin` for plugin-based approach both Module and Component, just specify the Module file.

	The exposed Module key must match the name of the exposed module without the 'Module' suffix. Also, if the name doesn't match, you can specify a custom Module name in the options `{ moduleName: 'CustomName' }` in the property `mfeOutletOptions` inside `MfeOutletDirective` and in the options parameter of the `loadMfe` helper function.

	For the plugin-based approach, when loads MFE using `MfeOutletDirective` you must declare Component in the exposed Module and the Component name must match the exposed Module key without suffix 'Component'. Also, if the name doesn't match, you can specify a custom Component name in the Input property `mfeOutletOptions = { componentName: 'CustomName' }`;


### Changes in v1.0.8:

- `IMfeModuleRootOptions` interface renamed to `NgxMfeOptions`;
- Property `delay` in the `NgxMfeOptions` renamed to `loaderDelay`;
- `OPTIONS` injection token renamed to `NGX_MFE_OPTIONS`;

## Motivation

With the advent of Webpack 5 and the ModuleFederationPlugin, it became possible to separately compiled and deployed code, like microservices on the Backend.

The **ngx-mfe** is an extension of the functionality of the [@angular-architects/module-federation](https://www.npmjs.com/package/@angular-architects/module-federation). Using @angular-architects/module-federation you could only upload one micro-frontend per page (in the Routing), this limitation was the main reason for the creation of this library - **ngx-mfe**.

The main feature of the **ngx-mfe** library is ability to work with micro-frontends directly in the HTML template using a plugin-based approach. You can load more than one micro-frontend per page.

## Features

🔥 Load multiple micro-frontends directly from the HTML template, with the ability to display the loader component during loading, and the fallback component on error.

🔥 More convenient way to load MFE via Angular Routing.

🔥 Configure different remoteEntryUrl of the MFE for different builds (dev/prod/etc.).

## Example

- [Here you can find an example application using Micro-frontend architecture.](https://github.com/dkhrunov/ngx-mfe-test)
- [Here you can find a series of articles about Micro-frontends/Module Federation and a step-by-step guide to building an application with Micro-frontends.](https://dekh.medium.com/angular-micro-frontend-architecture-part-1-3-the-concept-of-micro-frontend-architecture-2ff56a5ac264)

## Contents

- [Conventions](#conventions)
- [Configuring](#configuring)
- [Load MFE by Route](#load-mfe-by-route)
- [Load MFE in HTML template / plugin-based approach](#load-mfe-in-html-template--plugin-based-approach)

## Conventions

1. Micro-frontend string or MFE string - string is kebab-case style and matches this pattern `"mfe-app/exposed-file-name"`, where:

- `mfe-app` - this is the micro-frontend name specified in the property `name` in the `ModuleFederationPlugin`.
- `exposed-file-name` - it is the exposed file name in kebab-case style specified in the object `exposes` in the `ModuleFederationPlugin`.

	**Example:** For an `address-form` MFE with an exposed `FormModule` file, the MFE string must be `"address-form/form"`.

 	```js
	// webpack.config.js file
	new ModuleFederationPlugin({
		name: "address-form",
		filename: "remoteEntry.js",
		exposes: {
			Form: 'apps/address-form/src/app/form/form.module.ts',
		},
		[...]
	});
 	```

	```typescript
	// form.module.ts file
	import { CommonModule } from '@angular/common';
	import { NgModule } from '@angular/core';
	import { RouterModule } from '@angular/router';
	import { FormComponent } from './form.component';

	@NgModule({
		declarations: [FormComponent],
		imports: [
			CommonModule,
			RouterModule.forChild([
				{
					path: '',
					component: FormComponent,
				},
			]),
		],
	})
	export class FormModule {}
	```

2. Since **v1.1.0** you don't need to expose from `ModuleFederationPlugin` for plugin-based approach both Module and Component, just specify the Module file.

	The exposed Module key must match the name of the public module without the 'Module' suffix. Also, if the name doesn't match, you can specify a custom Module name in the options `{ moduleName: 'CustomName' }` in the property `mfeOutletOptions` iside `MfeOutletDirective` and in the options parameter of the `loadMfe` helper function.

	For the plugin-based approach, when loads MFE using `MfeOutletDirective` you must declare Component in the exposed Module and the Component name must match the exposed Module key without suffix 'Component'. Also,if the name doesn't match, you can specify a custom Component name in the Input property `mfeOutletOptions = { componentName: 'CustomName' }`;

## Configuring

> For feature modules just import `MfeModule`

Add the **ngx-mfe** library to a shared property in the ModuleFederationPlugin inside webpack.config.js file for each application in your workspace.

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

To configure this library, you should import `MfeModule.forRoot(options: NgxMfeOptions)` to the root module of the Host app(s) and to the root module of the Remote app(s), so that Remote works properly when working as a standalone app:

> For feature modules just import `MfeModule` without options, where, you may need the functionality of the library, for example, the `MfeOutletDirective` directive.

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

- **mfeConfig** - object where **key** is micro-frontend app name specified in `ModuleFederationPlugin` (webpack.config.js) and **value** is remoteEntryUrl string. All data will be sets to [MfeRegistry](https://github.com/dkhrunov/ngx-mfe/blob/development/projects/ngx-mfe/src/lib/registry/mfe-registry.ts).

	*Key* it's the name same specified in webpack.config.js of MFE (Remote) in option name in `ModuleFederationPlugin`.

 	*Value* set the following pattern: `{url}/{remoteEntrypointFilename}`.

- `url` is the url where the remote application is hosted.

- `remoteEntrypointFilename` is the filename supplied in the remote's webpack configuration.
  
	Example <http://localhost:4201/remoteEntry.js>

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

- **preload** (Optional) - a list of micro-frontend names, their bundles (remoteEntry.js) will be loaded and saved in the cache when the application starts.

Next options are only works in plugin-based approach with `MfeOutletDirective`:

- **loaderDelay** (Optional) - Specifies the minimum loader display time in ms. This is to avoid flickering when the micro-frontend loads very quickly.

 	*By default is 0.*

- **loader** (Optional) - Displayed when loading the micro-frontend. Specified as a MFE string or Component class.

 	*Example: 'loader-mfe/spinner'.*

 	> For better UX, add loader micro-frontends to the `preload`.

- **fallback** (Optional) - Displayed when loading or compiling a micro-frontend with an error. Specified as a MFE string or Component class.

 	*Example: 'fallback-mfe/not-found'.*

    > For better UX, add fallback micro-frontends to the `preload`.

You can get all configured options by injecting `NGX_MFE_OPTIONS` by DI:

```typescript
class AppComponent {

 	constructor(@Inject(NGX_MFE_OPTIONS) public options: NgxMfeOptions) {}
}
```

## Load MFE by Route

To use micro-frontends in Routing, you must import and apply the helper function called `loadMfe`, like in the example below:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loadMfe } from '@dkhrunov/ng-mfe';

const routes: Routes = [
	{
		path: 'dashboard',
		loadChildren: () => loadMfe('dashboard-mfe/entry'),
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

More about plugin-based approach [here](https://dekh.medium.com/angular-micro-frontend-architecture-part-3-3-mfe-plugin-based-approach-f36dc9849b0).

> **Notice 1**: The exposed Module key must match the name of the public module without the 'Module' suffix. Also, if the name doesn't match, you can specify a custom Module name in the options `{ moduleName: 'CustomName' }` in the property `mfeOutletOptions` iside `MfeOutletDirective` and in the options parameter of the `loadMfe` helper function.
>
> For the plugin-based approach, when loads MFE using `MfeOutletDirective` you must declare Component in the exposed Module and the Component name must match the exposed Module key without suffix 'Component'. Also,if the name doesn't match, you can specify a custom Component name in the Input property `mfeOutletOptions = { componentName: 'CustomName' }`;

> **Notice 2**: you must follow the rule that only one component must be declared for an exposed Module.

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
				EntryModule: 'apps/dashboard-mfe/src/app/remote-entry/entry.module.ts',
        // Prior to version 1.1.0, you must expose the Component declared in this Module.
        // uncomment next line if using ngx-mfe below version in 1.1.0
				// EntryComponent: 'apps/dashboard-mfe/src/app/remote-entry/entry.component.ts',
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

	> In the example below, `loader` provided as a TemplateRef, and `fallback` as a micro-frontend string.

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
