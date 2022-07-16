# Migration Guide to v2

__Why has the API changed?__ - The problem is that when you use the `[mfeOutlet]` directive [issue](https://github.com/dkhrunov/ngx-mfe/issues/7), it tries to find the component inside the compiled module by name (as a string), but in runtime the class name will be optimized and replaced with a short character. For example, you have a class `TestComponent`, it can be changed to the class name `a` and this causes this error.

## General:
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

## LoadMfe function:
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

## MfeOutlet directive:
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

## MfeComponentFactoryResolver:
- The `MfeComponentFactoryResolver` has been replaced with `MfeService` and the API has been changed;
- The `MfeComponentFactoryResolverOptions` type has been removed;

## MfeComponentCache
- Now the `MfeComponentCache` not only saves `ComponentFactory<T>` but also `Type<T>`;
- In version 2.1.0 `ComponentFactory<T>` was replaced to `ComponentWithNgModuleRef<TComponent, TModule>`;

## DynamicComponentBinding
- The `bindInputs()` and `bindOutputs()` methods now require `ComponentRef<any>` in the first argument, `MfeOutletInputs`/`MfeOutletOutputs` are method dependent in the second, and the third argument has been removed;
- The `DynamicComponentInputs` and `DynamicComponentOutputs` types have been removed because these types are replaced in `bindInputs()` and `bindOutputs()` respectively by the `ComponentRef<any>` type;
- The `validateInputs()` method has been removed;
- The `validateOutputs()` method is now private;