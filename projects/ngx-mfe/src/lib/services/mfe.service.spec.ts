import { TestBed } from '@angular/core/testing';
import { MfeComponentFactoryResolver } from './mfe-component-factory-resolver.service';

describe('MfeComponentFactoryResolver', () => {
	let service: MfeComponentFactoryResolver;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(MfeComponentFactoryResolver);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
