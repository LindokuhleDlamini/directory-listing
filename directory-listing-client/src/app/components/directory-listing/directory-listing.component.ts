import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DirectoryListingService } from '../../services/Directory-Listing-Service';
import { DirectoryListing } from '../../models/Directory-Listing';
import { FileItem } from 'src/app/models/File-Item';
import { SearchResult } from 'src/app/models/Search-Result';
import { NavigationHistory } from 'src/app/models/Navigation-History';
import { NavigationService } from 'src/app/services/Navigation-Service';
import { SearchService } from 'src/app/services/Search-Service';
import { BookmarkService } from 'src/app/services/Bookmark-Service';

@Component({
  selector: 'app-directory-listing',
  templateUrl: './directory-listing.component.html',
  styleUrls: ['./directory-listing.component.scss']
})
export class DirectoryListingComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  currentPath: string = '/';
  directoryListing: DirectoryListing | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  currentPage: number = 1;
  pageSize: number = 1000;
  pageSizeOptions: number[] = [100, 500, 1000, 2000, 5000];
  totalItems: number = 0;
  totalPages: number = 0;
  showSearch: boolean = false;
  searchTerm: string = '';
  isSearching: boolean = false;
  searchResults: FileItem[] = [];
  navigationHistory: NavigationHistory[] = [];
  showBookmarksPanel: boolean = false;

  constructor(private directoryListingService: DirectoryListingService, private navigationService: NavigationService, private searchService: SearchService, private bookmarkService: BookmarkService) {
  }

  ngOnInit(): void {
    this.loadDirectory(this.currentPath);

    this.navigationService.getHistory().subscribe(history => {
      this.navigationHistory = history;
    });
  }

  loadDirectory(path: string, page: number = 1): void {
    this.isLoading = true;
    this.error = null;

    this.directoryListingService.getDirectoryListing(path, page, this.pageSize).subscribe({
      next: (response) => {
        this.directoryListing = response;
        this.currentPath = response.path;
        this.currentPage = response.page || 1;
        this.totalItems = response.totalCount;
        this.totalPages = response.totalPages || 1;
        this.isLoading = false;

        this.navigationService.addToHistory(path);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load directory';
        this.isLoading = false;
        this.directoryListing = null;
      }
    });

  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDirectory(this.currentPath, page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadDirectory(this.currentPath, 1);
  }

  getPaginationInfo(): string {
    if (!this.directoryListing) return '';

    const start = ((this.currentPage - 1) * this.pageSize) + 1;
    const end = Math.min(start + this.pageSize - 1, this.totalItems);

    return `Showing ${start} to ${end} of ${this.totalItems} items`;
  }

  navigateToParent(): void {
    const parentPath = this.currentPath.split('/').slice(0, -1).join('/') || '/';
    this.loadDirectory(parentPath);
  }

  navigateToPath(path: string): void {
    this.loadDirectory(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  refresh(): void {
    this.loadDirectory(this.currentPath);

    const refreshBtn = document.querySelector('.btn[title="Refresh"]');
    if (refreshBtn) {
      refreshBtn.classList.add('rotating');
      setTimeout(() => {
        refreshBtn.classList.remove('rotating');
      }, 1000);
    }
  }

  getBreadcrumbs(): string[] {
    if (this.currentPath === '/') return ['/'];

    const parts = this.currentPath.split('/').filter(part => part !== '');
    const breadcrumbs = ['/'];

    for (let i = 0; i < parts.length; i++) {
      breadcrumbs.push('/' + parts.slice(0, i + 1).join('/'));
    }

    return breadcrumbs;
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;

    if (this.showSearch) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
      }, 100);
    }
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    this.searchService.searchDirectory(this.currentPath, this.searchTerm).subscribe({
      next: (searchResult: SearchResult) => {
        this.searchResults = searchResult.results;
        this.isSearching = false;
      },
      error: (err: any) => {
        this.error = err.message;
        this.isSearching = false;
        this.searchResults = [];
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.showSearch = false;
  }

  navigateBack(): void {
    const previousPath = this.navigationService.goBack();
    if (previousPath) {
      this.loadDirectory(previousPath);
    }
  }

  getParentPath(): string {
    if (this.currentPath === '/') return '';
    return this.currentPath.split('/').slice(0, -1).join('/') || '/';
  }

  canGoBack(): boolean {
    return this.navigationHistory.length > 1;
  }

  getBreadcrumbName(path: string): string {
    if (path === '/') return 'Root';
    return path.split('/').pop() || path;
  }

  handleError(error: any): void {
    console.error('Navigation error:', error);
    this.error = error.message || 'An unexpected error occurred';
    this.isLoading = false;

    setTimeout(() => {
      this.error = null;
    }, 5000);
  }

  loadBookmarks(): void {
    this.bookmarkService.getAllBookmarks().subscribe();
  }

  toggleBookmarksPanel(): void {
    this.showBookmarksPanel = !this.showBookmarksPanel;
  }

}
