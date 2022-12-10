# Angular micro-frontend library - ngx-mfe

A library for working with MFE in Angular in a plugin-based approach and with Angular routing.

> If you have production build issues check this [issue](https://github.com/dkhrunov/ngx-mfe/issues/7). __This issue has been fixed in version 2.0.0.__

Have problems with updates? Check out the  [migration guides](../../migration-guide.md).

## Contents

- [Version Compliance](#version-compliance)
- [Motivation](#motivation)
- [Features](#features)
- [Examples](#examples)
- [Conventions](#conventions)
- [Configuring](#configuring)
- [Display MFE in HTML template / plugin-based approach](#display-mfe-in-html-template--plugin-based-approach)
- [Display Angular v14 Standalone Components](#display-angular-v14-standalone-components)
- [Passing Data to the MFE Component via mfeOutlet directive](#passing-data-to-the-mfe-component-via-mfeoutlet-directive)
- [Load MFE by Route](#load-mfe-by-route)
- [Changelog](#changelog)

## Version Compliance
ngx-mfe                               | v1.0.0  | v1.0.5  | v2.0.0  | v3.0.0  |
--------------------------------------| ------- | ------- | ------- | ------- |
Angular                               | v12.0.0 | v13.0.0 | v13.0.0 | v14.0.0 |
@angular-architects/module-federation | v12.0.0 | v14.0.0 | v14.0.0 | v14.3.0 |

## Motivation

When Webpack 5 came along and the Module Federation plugin, it became possible to separately compile and deploy code for front-end applications, thereby breaking up a monolithic front-end application into separate and independent **M**icro**F**ront**E**nd (MFE) applications.

The **ngx-mfe** is an extension of the functionality of the [@angular-architects/module-federation](https://www.npmjs.com/package/@angular-architects/module-federation). Using @angular-architects/module-federation you could only upload one micro-frontend per page (in the Routing), this limitation was the main reason for the creation of this library.

The key feature of the **ngx-mfe** library is ability to work with micro-frontends directly in the HTML template using a plugin-based approach. You can load more than one micro-frontend per page.

> You can use both **ngx-mfe** and **@angular-architects/module-federation** libs together in the same project.

## Features

🔥 Load multiple micro-frontend directly from an HTML template with the ability to display a loader component during loading and a fallback component when an error occurs during loading and/or rendering of the mfe component.

🔥 Easy to use, just declare structural directive `*mfeOutlet` in your template.

🔥 Supports Angular Standalone Components.

🔥 More convenient way to load MFE via Angular Routing.

🔥 It's easy to set up different remoteEntryUrl MFEs for different builds (dev/prod/etc).

## Examples

- [Example of an application using ngx-mfe v1.](https://github.com/dkhrunov/ngx-mfe-test/tree/lesson_4)
- [Example of an application using ngx-mfe v2.](https://github.com/dkhrunov/ngx-mfe-test/tree/update-to-ngx-mfe-v2)
- [Example of an application using ngx-mfe v3 with Angular 14 Standalone Components.](https://github.com/dkhrunov/ngx-mfe-test)
- [Here you can find a series of articles about Micro-frontends/Module Federation and a step-by-step guide to building an application with Micro-frontends.](https://dekh.medium.com/angular-micro-frontend-architecture-part-1-3-the-concept-of-micro-frontend-architecture-2ff56a5ac264)

## Conventions

1. To display a standalone MFE component, you only need to __the component file itself__.

    > A standalone component is a component that does not have any dependencies provided or imported in the module where that component is declared.
    >
    > Since Angular v14 standalone component it is component that marked with `standalone: true` in `@Component({...})` decorator.

    When you display a standalone MFE component through `[mfeOutlet]` directive you must omit `[mfeOutletModule]` input.

    ```typescript
    // Standalone Component - standalone.component.ts
    import { Component } from '@angular/core';
    import { CommonModule } from '@angular/common';

    @Component({
      selector: 'app-standalone',
      standalone: true,
      imports: [CommonModule],
      template: ` <p>Standalone component works!</p> `,
      styles: [],
    })
    export class StandaloneComponent {}
    ```

    ```typescript
    // dashboard-mfe webpack.config
    {
      new ModuleFederationPlugin({
        name: 'dashboard-mfe',
        filename: 'remoteEntry.js',
        exposes: {
          StandaloneComponent: 'apps/dashboard-mfe/src/app/standalone.component.ts',
        },
        [...]
      });
    }
    ```

    ```html
    <!-- shell-app -->
    <ng-template
      mfeOutlet="dashboard-mfe"
      mfeOutletComponent="StandaloneComponent"
    >
    </ng-template>
    ```

2. To display an MFE component with dependencies in the module where the component was declared, you must expose both __the component file and the module file__ from ModuleFederationPlugin.

    > This approach is widely used and recommended.

    When you display this type of MFE component with the `[mfeOutlet]` directive, you must declare an input `[mfeOutletModule]` with the value of the exposed module name.

3. The file key of an exposed Module or Component (declared in the ModuleFederationPlugin in the 'expose' property) must match the class name of that file. 
    
    For the plugin-based approach, when loads MFE using `[mfeOutlet]` directive you must declare Component in the exposed Module and the Component name must match the file key of an exposed Component class.

    ```typescript
    // webpack.config
    {
      new ModuleFederationPlugin({
        name: 'dashboard-mfe',
        filename: 'remoteEntry.js',
        exposes: {
          // EntryModule is the key of the entry.module.ts file and corresponds to the exported EntryModule class from this file.
          EntryModule: 'apps/dashboard-mfe/src/app/remote-entry/entry.module.ts',
          // the EntryComponent is key of file entry.module.ts, and match to exported EntryComponent class from that file.
          EntryComponent: 'apps/dashboard-mfe/src/app/remote-entry/entry.component.ts',
        },
        [...]
      });
    }
    ```

    > If the name of Module doesn't match, you can specify a custom name for this Module in the @Input() property `mfeOutletOptions = { componentName: 'CustomName' }` of `[mfeOutlet]` directive, and pass `{ moduleName: 'CustomName' }` options to the `loadMfe()` function;

    >  If the name of Component doesn't match, you can specify a custom name for this Component in the @Input() property `mfeOutletOptions = { componentName: 'CustomName' }` of `[mfeOutlet]` directive, and pass `{ moduleName: 'CustomName' }` options to the `loadMfe()` function;

4. You must follow the rule that only one Component must be declared for an exposed Module. This is known as SCAM (**S**ingle **C**omponent **A**ngular **M**odule) pattern.

## Configuring

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

To configure this library, you must import `MfeModule.forRoot(options: NgxMfeOptions)` into the root module of the Host app(s) and the root module of the Remote apps in order for Remote to work correctly when running as a standalone application:

> For feature modules just import `MfeModule` without options, where, you may need the functionality of the library, for example, the `MfeOutlet` directive.

For core / app module:
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
      loader: {
        app: 'loaders',
        module: 'SpinnerModule',
        component: 'SpinnerComponent',
      },
      loaderDelay: 500,
      fallback: {
        app: 'fallbacks',
        module: 'MfeFallbackModule',
        component: 'MfeFallbackComponent',
      },
    }),
  ],
})
export class AppModule {}
```

For feature module:
```typescript
@NgModule({
  imports: [
    MfeModule,
  ],
})
export class Feature1Module {}
```

### List of all available options:

- **mfeConfig** - object where **key** is micro-frontend app name specified in `ModuleFederationPlugin` (webpack.config.js) and **value** is remoteEntryUrl string. All data will be sets to [MfeRegistry](https://github.com/dkhrunov/ngx-mfe/blob/master/projects/ngx-mfe/src/lib/registry/mfe-registry.ts).

	**Key** it's the name same specified in webpack.config.js of MFE (Remote) in option name in `ModuleFederationPlugin`.

 	**Value** set the following pattern: `{url}/{remoteEntrypointFilename}`.

  - `url` is the url where the remote application is hosted.

  - `remoteEntrypointFilename` is the filename supplied in the remote's webpack configuration.
  
	Example <http://localhost:4201/remoteEntry.js>

	You can get `MfeRegistry` from DI:

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

- **loader** (Optional) - Displayed when loading the micro-frontend. Implements the `RemoteComponent` interface.

  *Example:*
  ```typescript
  // Globally uses the "SpinnerComponent" loader component declared in the "SpinnerModule" of the app "loaders".
  loader: {
    app: 'loaders',
    module: 'SpinnerModule',
    component: 'SpinnerComponent',
  },
  ```

 	> For better UX, add loader micro-frontends to the `preload`.

- **fallback** (Optional) - Displayed when loading or compiling a micro-frontend with an error. Implements the `RemoteComponent` interface.

 	*Example:*
  ```typescript
  // Globally uses the "MfeFallbackComponent" fallback component declared in the "MfeFallbackModule" of the app "fallbacks".
  fallback: {
    app: 'fallbacks',
    module: 'MfeFallbackModule',
    component: 'MfeFallbackComponent',
  },
  ```

  > For better UX, add fallback micro-frontends to the `preload`.

You can get all configured options by injecting `NGX_MFE_OPTIONS` by DI:

```typescript
class AppComponent {
  constructor(@Inject(NGX_MFE_OPTIONS) public options: NgxMfeOptions) {}
}
```

## Display MFE in HTML template / plugin-based approach

This approach allows us to load micro-frontends directly from HTML.

The advantages of this approach are that we can display several MFEs at once on the same page, even display several of the same MFEs.

> More about plugin-based approach [here](https://dekh.medium.com/angular-micro-frontend-architecture-part-3-3-mfe-plugin-based-approach-f36dc9849b0).

> Full code of this example can be found at https://github.com/dkhrunov/ngx-mfe-test.

Example app:

![image](https://user-images.githubusercontent.com/25565058/187071276-11e1dd5c-6fe4-4d7c-94df-2bf74331d900.png)

An example webpack.config.js that exposes the "MfeTestComponent" (brown border in the screenshot above):

```js
// webpack.config.js
return {
	[...]
	resolve: {
		alias: sharedMappings.getAliases(),
	},
	plugins: [
		new ModuleFederationPlugin({
			name: 'test',
			exposes: {
        MfeTestModule: 'apps/test/src/app/mfe-test/mfe-test.module.ts',
        MfeTestComponent: 'apps/test/src/app/mfe-test/mfe-test.component.ts',
			},
			filename: 'remoteEntry',
			shared: share({ ... }),
		}),
		sharedMappings.getPlugin(),
	],
};
```

  1. Just display the component "MfeTestComponent" inside other MFE component "Form" from "address-form" app:

    One variant:
    ```html
    <ng-template
      mfeOutlet="test"
      mfeOutletModule="MfeTestModule"
      mfeOutletComponent="MfeTestComponent"
    >
    </ng-template>
    ```

    Other variant:
    ```html
    <ng-container
      *mfeOutlet="
        'test';
        module: 'MfeTestModule';
        component: 'MfeTestComponent'
      "
    >
    </ng-container>
    ```

    > These two examples are equal and display the MFE "MfeTestComponent".

2. You can pass/bind `@Input` and `@Output` props to MFE component:

    ```html
    <!-- form.component.html file -->
    <ng-container
      *mfeOutlet="
        'test';
        module: 'MfeTestModule';
        component: 'MfeTestComponent';
        inputs: { text: text$ | async };
        outputs: { click: onClick };
      "
    ></ng-container>
    ```

    ```typescript
    // form.component.ts file
    @Component({
      selector: 'app-form',
      templateUrl: './form.component.html',
      styleUrls: ['./form.component.scss'],
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    export class FormComponent {
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

    > If you try to bind a @Output() property that is not in the component, then an error will fall into the console:
    > "Output **someOutput** is not output of **SomeComponent**."
    >
    > If you try to pass a non-function, then an error will fall into the console:
    > "Output **someOutput** must be a function."

3. To override the default loader delay, configured in `MfeModule.forRoot({ ... })`, provide custom number in ms to property `loaderDelay`:

    ```html
    <ng-container
      *mfeOutlet="
        'test';
        module: 'MfeTestModule';
        component: 'MfeTestComponent';
        loaderDelay: 1000
      "
    ></ng-container>
	  ```

4. To override the default loader and fallback MFE components, configured in `MfeModule.forRoot({ ... })`, specify content with `TemplateRef`, pass it to the appropriate properties `loader` and `fallback`:

    ```html
    <ng-container
      *mfeOutlet="
        'test';
        module: 'MfeTestModule';
        component: 'MfeTestComponent';
        loader: loaderTpl;
        fallback: fallbackTpl
      "
    ></ng-container>

    <ng-template #loaderTpl>
      <div>loading...</div>
    </ng-template>

    <ng-template #fallbackTpl>
      <div>Ooops! Something went wrong</div>
    </ng-template>
    ```

    ```html
    <!-- TemplateRef that render loader as MFE component -->
    <ng-template
      mfeOutlet="test"
      mfeOutletModule="MfeTestModule"
      mfeOutletComponent="MfeTestComponent"
      [mfeOutletLoader]="loaderMfeTpl"
    ></ng-template>

    <ng-template #loaderMfeTpl>
      <ng-template
        mfeOutlet="loaders-mfe"
        mfeOutletModule="SpinnerModule"
        mfeOutletComponent="SpinnerComponent"
        [mfeOutletLoader]="undefined"
        [mfeOutletLoaderDelay]="0"
      >
      </ng-template>
    </ng-template>
    ```

6. You can also provide a custom injector for a component like this:

    ```html
    <ng-template
      mfeOutlet="test"
      mfeOutletModule="MfeTestModule"
      mfeOutletComponent="MfeTestComponent"
      [mfeOutletInjector]="customInjector"
    ></ng-template>
    ```

## Display Angular v14 Standalone components

Example app:

![image](https://user-images.githubusercontent.com/25565058/187071276-11e1dd5c-6fe4-4d7c-94df-2bf74331d900.png)

An example webpack.config.js that exposes the "StandaloneComponent" (green border in the screenshot above):

```js
// webpack.config.js
return {
	[...]
	resolve: {
		alias: sharedMappings.getAliases(),
	},
	plugins: [
		new ModuleFederationPlugin({
			name: 'test',
			exposes: {
        [...]
        StandaloneComponent: 'apps/test/src/app/standalone/standalone.component.ts',
			},
			filename: 'remoteEntry',
			shared: share({ ... }),
		}),
		sharedMappings.getPlugin(),
	],
};
```

```typescript
// standalone.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-standalone',
	standalone: true,
	imports: [CommonModule],
	template: ` <p>Standalone component works!</p> `,
	styles: [],
})
export class StandaloneComponent {}
```

```html
<!-- form.component.html of the address-form app -->
[...]
<h3>Angular v14 Standalone component loaded as MFE:</h3>
<ng-template
  mfeOutlet="test"
  mfeOutletComponent="StandaloneComponent"
></ng-template>
```

## Passing Data to the MFE Component via mfeOutlet directive

After using this library for some time, as the author of this library, I came to the conclusion that using @Inputs and @Outputs of an MFE component through the `[mfeOutletInputs]` `[mfeOutletOutputs]` properties is not the best practice. Try to make your MFE components as independent as possible from the external environment. But if you still have to pass some values ​​to the component, you can do it in two ways:

1. As I wrote above through the properties `[mfeOutletInputs]` `[mfeOutletOutputs]`

    component.html:
    ```html
    <ng-template
      mfeOutlet="test"
      mfeOutletModule="MfeTestModule"
      mfeOutletComponent="MfeTestComponent"
      [mfeOutletInputs]="{ text: text$ | async }"
      [mfeOutletOutputs]="{ click: onClick }"
    >
    </ng-template>
    ```

    component.ts
    ```typescript
    @Component({ ... })
    export class Component {
      public text$ = new BehaviorSubject<string>('Test string');

      constructor() { }

      public onClick(bool: MouseEvent): void {
        console.log('login', bool);
      }
    }
    ```

2. The second way is to create a new injector and add the necessary data for the MFE component to it. The `[mfeOutlet]` directive has the `[mfeOutletInjector]` property through which you can pass the desired injector, when the component is created, the previously passed injector in the `[mfeOutletInjector]` property will be used instead of the current injector.

    component.html:
    ```html
    <ng-template
      mfeOutlet="test"
      mfeOutletModule="MfeTestModule"
      mfeOutletComponent="MfeTestComponent"
      [mfeOutletInjector]="testComponentInjector"
    >
    </ng-template>
    ```

    component.ts
    ```typescript
    @Component({ ... })
    export class Component {
      public readonly testComponentInjector: Injector;

      constructor(private readonly _injector: Injector) {
        this.testComponentInjector = Injector.create({
          parent: this._injector,
          providers: [
            {
              provide: TEST_DATA,
              useValue: data,
            },
          ],
        });
      }
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
    loadChildren: () => loadMfe('dashboard-mfe', 'EntryModule'),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

## Changelog

### Changes in __v2.1.0__ 
Fixed:
- Fix error, if the fallback is also unavailable, then simply clear the view;

Refactored:
- Renamed `MfeService` to `RemoteComponentLoader`;
- Renamed `MfeComponentsCache` to `RemoteComponentsCache`;
- Renamed `ModularRemoteComponent` type to `RemoteComponentWithModule`;
- Wrapped to `ngZone.runOutside` the `loadMfe` function calls inside the `RemoteComponentLoader`;
- Added new type `ComponentWithNgModuleRef<TComponent, TModule>`, that holds component class `Type<T>` and `NgModuleRef`;
- Changed cached value for `RemoteComponentWithModule` from `ComponentFactory` to `ComponentWithNgModuleRef`;
- In `RemoteComponentLoader` (old name `MfeService`) renamed function `loadModularComponent` to `loadComponentWithModule`
- Changed return type of method `loadComponentWithModule` inside class `RemoteComponentLoader` from `Promise<ComponentFactory<TComponent>>` to `Promise<ComponentWithNgModuleRef<TComponent, TModule>>`;

### Changes in __v2.0.0__ (_Breaking changes_)

__Why has the API changed?__ - The problem is that when you use the `[mfeOutlet]` directive [issue](https://github.com/dkhrunov/ngx-mfe/issues/7), it tries to find the component inside the compiled module by name (as a string), but in runtime the class name will be optimized and replaced with a short character. For example, you have a class `TestComponent`, it can be changed to the class name `a` and this causes this error.

#### General:
- To properly use the plugin-based approach in a micro-frontend architecture, or simply if you are use `[mfeOutlet]` directive, you must now expose both the component file and module file in which the component is declared to the ModuleFederationPlugin.

  __Rarerly :__ or, if your micro-frontend component is standalone (a standalone component is a component that does not have any dependencies declared or imported in the module where that component is declared), then it is sufficient to provide just that component file to the ModuleFederationPlugin;

- Now __ngx-mfe__ does not use `Micro-frontend string` (or anouther name `MFE string`) is a kebab-case style string and matches the pattern `"mfe-app-name/exposed-file-name"` (__it was used until version 2.0.0__);

- `MFE string` has been replaced by a new type `RemoteComponent`;

- The `validateMfe` function has been removed (__it was used until version 2.0.0__);

- The `loader` and `fallback` properties in the `NgxMfeOptions` has been changed from `MFE string` to `RemoteComponent` type:
 
  Before v2.0.0:
  ```typescript
  @NgModule({
    declarations: [AppComponent],
    imports: [
      BrowserModule,
      BrowserAnimationsModule,
      MfeModule.forRoot({
        mfeConfig: {
          "dashboard-mfe": "http://localhost:4201/remoteEntry.js",
          "loaders-mfe": "http://localhost:4202/remoteEntry.js",
          "fallbacks-mfe": "http://localhost:4203/remoteEntry.js"
        },
        loader: 'loaders/spinner',
        fallback: 'fallbacks/mfe-fallback',
      }),
    ],
    bootstrap: [AppComponent],
  })
  export class AppModule {}
  ```

  Since v2.0.0:
  ```typescript
  @NgModule({
    declarations: [AppComponent],
    imports: [
      BrowserModule,
      BrowserAnimationsModule,
      MfeModule.forRoot({
        mfeConfig: {
          "dashboard-mfe": "http://localhost:4201/remoteEntry.js",
          "loaders-mfe": "http://localhost:4202/remoteEntry.js",
          "fallbacks-mfe": "http://localhost:4203/remoteEntry.js"
        },
        loader: {
          app: 'loaders',
          module: 'SpinnerModule',
          component: 'SpinnerComponent',
        },
        fallback: {
          app: 'fallbacks',
          module: 'MfeFallbackModule',
          component: 'MfeFallbackComponent',
        },
      }),
    ],
    bootstrap: [AppComponent],
  })
  export class AppModule {}
  ```
  
- Removed `moduleName` property from `LoadMfeOptions` type;
- Now, wherever you need to specify the name of the exposed file through the config in the webpack.config in the ModuleFederationPlugin, you must specify exactly the same name as in the config itself, the kebab-style name was used earlier.
  ```javascript
  // webpack.config.js
  exposes: {
    // LoginModule name of the exposed file login.module.ts
		LoginModule: 'apps/auth-mfe/src/app/login/login.module.ts',
	},  
  ```

  Before v2.0.0:
  ```typescript
  loadMfe('auth-mfe/login-module')
  ```

  Since v2.0.0:
  ```typescript
  loadMfe('auth-mfe' 'LoginModule')
  ```

#### LoadMfe function:
- Arguments changed in `LoadMfe` function:
  
  Before v2.0.0:
  ```typescript
  async function loadMfe<T = unknown>(mfeString: string, options?: LoadMfeOptions): Promise<Type<T>> {}
  ```

  Since v2.0.0:
  ```typescript
  async function loadMfe<T = unknown>(remoteApp: string, exposedFile: string, options?: LoadMfeOptions): Promise<Type<T>> {}
  ```
  - `remoteApp` - is the name of the remote app as specified in the webpack.config.js file in the ModuleFederationPlugin in the __name__ property;
  - `exposedFile` - is the key (or name) of the exposed file specified in the webpack.config.js file in the ModuleFederationPlugin in the __exposes__ property;

#### MfeOutlet directive:
- Since the `Mfe string` has been removed from the library, the API of `[mfeOutlet]` directive has changed:
  1. `mfeOutletLoader` and  `mfeOutletFallback` now accept only `TemplateRef`, more details below.
  2. To load a standalone component, you must specify the following details: `mfeOutlet` with the name of the application, `mfeOutletComponent` with the name of the component's open file from the ModuleFederationPlugin in webpack.config. But to load a non-standalone component, you must additionally specify `mfeOutletModule` with the name of the open module file in which the component is declared for the ModuleFederationPlugin in webpack.config.
  3.
- `@Input('mfeOutletOptions')' options` changed type from `MfeComponentFactoryResolverOptions` to `LoadMfeOptions`;
- `@Input('mfeOutletLoader')' loader` and `@Input('mfeOutletFallback') fallback` now accept only `TemplateRef`, not `TemplateRef` or `Mfe string`. But you can still use micro-frontend component for `loader` and `fallback` in the `[mfeOutlet]`, like in the example below:

  ```html
  <!-- With Mfe loader -->
  <ng-template
    mfeOutlet="dashboard-mfe"
    mfeOutletModule="EntryModule"
    mfeOutletComponent="EntryComponent"
    [mfeOutletLoader]="loaderMfe"
  >
  </ng-template>

  <!-- Mfe component for loader -->
  <ng-template #loaderMfe>
      <!-- For loader Mfe you should set mfeOutletLoader to undefined, and mfeOutletLoaderDelay to 0. For better UX. -->
      <ng-template
        mfeOutlet="loaders-mfe"
        mfeOutletModule="SpinnerModule"
        mfeOutletComponent="SpinnerComponent"
        [mfeOutletLoader]="undefined"
        [mfeOutletLoaderDelay]="0"
      >
      </ng-template>
  </ng-template>

  <!-- With simple HTML content as loader -->
  <ng-template
    mfeOutlet="dashboard-mfe"
    mfeOutletModule="EntryModule"
    mfeOutletComponent="EntryComponent"
    [mfeOutletLoader]="loaderMfe"
  >
  </ng-template>
  
  <!-- Simple HTML content. -->
  <ng-template #loader>
      <div>loading...</div>
  </ng-template>
  ```

#### MfeComponentFactoryResolver:
- The `MfeComponentFactoryResolver` has been replaced with `MfeService` and the API has been changed;
- The `MfeComponentFactoryResolverOptions` type has been removed;

#### MfeComponentCache
- Now the `MfeComponentCache` not only saves `ComponentFactory<T>` but also `Type<T>`;
- In version 2.1.0 `ComponentFactory<T>` was replaced to `ComponentWithNgModuleRef<TComponent, TModule>`;

#### DynamicComponentBinding
- The `bindInputs()` and `bindOutputs()` methods now require `ComponentRef<any>` in the first argument, `MfeOutletInputs`/`MfeOutletOutputs` are method dependent in the second, and the third argument has been removed;
- The `DynamicComponentInputs` and `DynamicComponentOutputs` types have been removed because these types are replaced in `bindInputs()` and `bindOutputs()` respectively by the `ComponentRef<any>` type;
- The `validateInputs()` method has been removed;
- The `validateOutputs()` method is now private;

---------------

### Changes in __v1.1.0__:

- Deleted the `loadMfeComponent` helper function;
- Deleted the `parseMfeString` helper function;
- Renamed the `loadMfeModule` helper function to `loadMfe` and added optional parameter `options: LoadMfeOptions`. `LoadMfeOptions` has property a `moduleName`, that sets a custom name for the Module class within the opened file, and has `type` that specify type of Module Federation;
- Renamed the `MfeService` to `MfeComponentFactoryResolver`;
- `MfeComponentFactoryResolver` has the same method as `MfeService`, but now it can accepts an optional `options: MfeComponentFactoryResolver` parameter. This parameter extends `LoadMfeOptions` type, added a `componentName` parameter, that sets a custom name for the Component class.
- Added new Input prop to the `MfeOutletDirective` - `options: MfeComponentFactoryResolver`, this parameter provided to `resolveComponentFactory` method of the `MfeComponentFactoryResolver` when resolving the component factory of MFE.
- Since **v1.1.0** you don't need to expose from `ModuleFederationPlugin` for plugin-based approach both Module and Component, just specify the Module file.

	The exposed Module key must match the name of the exposed module without the 'Module' suffix. Also, if the name doesn't match, you can specify a custom Module name in the options `{ moduleName: 'CustomName' }` in the property `mfeOutletOptions` inside `MfeOutletDirective` and in the options parameter of the `loadMfe` helper function.

	For the plugin-based approach, when loads MFE using `MfeOutletDirective` you must declare Component in the exposed Module and the Component name must match the exposed Module key without suffix 'Component'. Also, if the name doesn't match, you can specify a custom Component name in the Input property `mfeOutletOptions = { componentName: 'CustomName' }`;

---------------

### Changes in __v1.0.8__:

- `IMfeModuleRootOptions` interface renamed to `NgxMfeOptions`;
- Property `delay` in the `NgxMfeOptions` renamed to `loaderDelay`;
- `OPTIONS` injection token renamed to `NGX_MFE_OPTIONS`;

---------------
