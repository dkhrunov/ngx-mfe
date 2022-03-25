import { IMfeConfig } from '../interfaces';

/**
 * Registry of micro-frontends apps.
 */
export class MfeRegistry {
	private static _instance: MfeRegistry;
	private readonly _mfeConfig: IMfeConfig;

	private constructor(mfeConfig: IMfeConfig) {
		this._mfeConfig = mfeConfig;
	}

	/**
	 * Get instance of the MfeRegistry
	 */
	public static getInstance(mfeConfig?: IMfeConfig): MfeRegistry {
		if (!MfeRegistry._instance) {
			if (!mfeConfig)
				throw new Error(
					'MfeConfig should be provided for first time used MfeRegistry.getInstance(mfeConfig)'
				);

			MfeRegistry._instance = new MfeRegistry(mfeConfig);
		}

		return MfeRegistry._instance;
	}

	/**
	 * Get the remote entry URL the micro-frontend app
	 * @param mfeApp Micro-frontend app name
	 */
	public getMfeRemoteEntry(mfeApp: string): string {
		return this._mfeConfig[mfeApp];
	}
}
