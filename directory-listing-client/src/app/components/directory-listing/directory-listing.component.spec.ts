import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DirectoryListingComponent } from './directory-listing.component';
import { DirectoryListingService } from '../../services/Directory-Listing-Service';
import { NavigationService } from '../../services/Navigation-Service';
import { of, throwError } from 'rxjs';
import { DirectoryListing } from 'src/app/models/Directory-Listing';

describe('DirectoryListingComponent', () => {
  let component: DirectoryListingComponent;
  let fixture: ComponentFixture<DirectoryListingComponent>;
  let directoryListingService: jasmine.SpyObj<DirectoryListingService>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    const fileSystemSpy = jasmine.createSpyObj('DirectoryListingService', [
      'getDirectoryListing',
      'search'
    ]);

    const navigationSpy = jasmine.createSpyObj('NavigationService', [
      'addToHistory',
      'getHistory',
      'goBack'
    ]);

    await TestBed.configureTestingModule({
      declarations: [DirectoryListingComponent],
      providers: [
        { provide: DirectoryListingService, useValue: fileSystemSpy },
        { provide: NavigationService, useValue: navigationSpy }
      ]
    }).compileComponents();

    directoryListingService = TestBed.inject(DirectoryListingService) as jasmine.SpyObj<DirectoryListingService>;
    navigationService = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectoryListingComponent);
    component = fixture.componentInstance;
  });

  it('should handle large directory listings with pagination', fakeAsync(() => {
    const mockResponse = {
      path: '/large-dir',
      items: Array(1000).fill(0).map((_, i) => ({
        name: `file${i}.txt`,
        path: `/large-dir/file${i}.txt`,
        size: 1024,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      })),
      totalCount: 100000,
      page: 1,
      pageSize: 1000,
      totalPages: 100
    } as DirectoryListing;

    directoryListingService.getDirectoryListing.and.returnValue(of(mockResponse));
    navigationService.getHistory.and.returnValue(of([]));

    component.ngOnInit();
    tick();

    expect(component.directoryListing).toEqual(mockResponse);
    expect(component.totalItems).toBe(100000);
    expect(component.totalPages).toBe(100);
    expect(component.currentPage).toBe(1);
  }));

  it('should handle pagination navigation for large directories', fakeAsync(() => {
    const page1Response = {
      path: '/large-dir',
      items: Array(1000).fill(0).map((_, i) => ({
        name: `file${i}.txt`,
        path: `/large-dir/file${i}.txt`,
        size: 1024,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      })),
      totalCount: 100000,
      page: 1,
      pageSize: 1000,
      totalPages: 100
    } as DirectoryListing;

    const page2Response = {
      ...page1Response,
      page: 2,
      items: Array(1000).fill(0).map((_, i) => ({
        name: `file${i + 1000}.txt`,
        path: `/large-dir/file${i + 1000}.txt`,
        size: 1024,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      }))
    } as DirectoryListing;

    directoryListingService.getDirectoryListing.and.returnValues(of(page1Response), of(page2Response));
    navigationService.getHistory.and.returnValue(of([]));

    component.ngOnInit();
    tick();

    // Navigate to page 2
    component.onPageChange(2);
    tick();

    expect(directoryListingService.getDirectoryListing).toHaveBeenCalledWith('/large-dir', 2, 1000);
    expect(component.currentPage).toBe(2);
    expect(component.directoryListing?.items[0]?.name).toBe('file1000.txt');
  }));

  it('should handle errors when loading large directories', fakeAsync(() => {
    directoryListingService.getDirectoryListing.and.returnValue(
      throwError(() => new Error('Directory too large'))
    );
    navigationService.getHistory.and.returnValue(of([]));

    component.ngOnInit();
    tick();

    expect(component.error).toBe('Directory too large');
    expect(component.isLoading).toBeFalse();
    expect(component.directoryListing).toBeNull();
  }));

  it('should handle page size changes for large directories', fakeAsync(() => {
    const mockResponse = {
      path: '/large-dir',
      items: Array(5000).fill(0).map((_, i) => ({
        name: `file${i}.txt`,
        path: `/large-dir/file${i}.txt`,
        size: 1024,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      })),
      totalCount: 100000,
      page: 1,
      pageSize: 5000,
      totalPages: 20
    } as DirectoryListing;

    directoryListingService.getDirectoryListing.and.returnValue(of(mockResponse));
    navigationService.getHistory.and.returnValue(of([]));

    component.ngOnInit();
    tick();

    // Change page size
    component.onPageSizeChange(5000);
    tick();

    expect(directoryListingService.getDirectoryListing).toHaveBeenCalledWith('/large-dir', 1, 5000);
    expect(component.pageSize).toBe(5000);
    expect(component.totalPages).toBe(20);
  }));

  it('should handle rapid consecutive navigation requests', fakeAsync(() => {
    const responses = Array(5).fill(0).map((_, page) => ({
      path: '/large-dir',
      items: Array(1000).fill(0).map((_, i) => ({
        name: `file${i + (page * 1000)}.txt`,
        path: `/large-dir/file${i + (page * 1000)}.txt`,
        size: 1024,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      })),
      totalCount: 5000,
      page: page + 1,
      pageSize: 1000,
      totalPages: 5
    })) as DirectoryListing[];

    directoryListingService.getDirectoryListing.and.returnValues(
      of(responses[0]),
      of(responses[1]),
      of(responses[2]),
      of(responses[3]),
      of(responses[4])
    );
    navigationService.getHistory.and.returnValue(of([]));

    component.ngOnInit();
    tick();

    component.onPageChange(2);
    component.onPageChange(3);
    component.onPageChange(4);
    component.onPageChange(5);
    tick();

    expect(directoryListingService.getDirectoryListing).toHaveBeenCalledTimes(5);
    expect(component.currentPage).toBe(5);
  }));
});
