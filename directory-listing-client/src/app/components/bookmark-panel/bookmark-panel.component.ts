import { Component, OnInit } from '@angular/core';
import { BookmarkService } from '../../services/Bookmark-Service';
import { NavigationService } from '../../services/Navigation-Service';
import { Bookmark } from 'src/app/models/Bookmark';

@Component({
  selector: 'app-bookmark-panel',
  templateUrl: './bookmark-panel.component.html',
  styleUrls: ['./bookmark-panel.component.scss']
})
export class BookmarksPanelComponent implements OnInit {
  bookmarks: Bookmark[] = [];
  isLoading: boolean = false;
  error: string = '';
  isOpen: boolean = false;

  constructor(
    private bookmarkService: BookmarkService,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {

        this.loadBookmarks();

    
  }

  loadBookmarks(): void {

    this.isLoading = true;
    this.error = '';

    this.bookmarkService.getAllBookmarks().subscribe({
      next: (bookmarks) => {
        this.bookmarks = bookmarks.sort((a, b) => 
          (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0)
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.details || 'Failed to load bookmarks';
        this.isLoading = false;
      }
    });
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadBookmarks();
    }
  }
  

  navigateToBookmark(bookmark: Bookmark): void {
    //this.navigationService.(bookmark.path);
    this.updateBookmarkAccess(bookmark);
    this.isOpen = false;
  }

  updateBookmarkAccess(bookmark: Bookmark): void {
    this.bookmarkService.updateBookmarkAccess(bookmark.id).subscribe({
      next: (updatedBookmarks) => {
        this.bookmarks = updatedBookmarks.sort((a, b) => 
          (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0)
        );
      },
      error: (error) => {
        console.error('Failed to update bookmark access:', error);
      }
    });
  }

  deleteBookmark(bookmark: Bookmark, event: Event): void {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to remove this bookmark?')) {
      return;
    }

    this.bookmarkService.deleteBookmark(bookmark.id).subscribe({
      next: () => {
        this.bookmarks = this.bookmarks.filter(b => b.id !== bookmark.id);
      },
      error: (error) => {
        this.error = error.error?.details || 'Failed to delete bookmark';
      }
    });
  }

  editBookmark(bookmark: Bookmark, event: Event): void {
    event.stopPropagation();
    
    const newName = prompt('Enter a new name for this bookmark:', bookmark.name);
    if (newName && newName.trim() !== '') {
      this.bookmarkService.updateBookmark(bookmark.id, { name: newName.trim() }).subscribe({
        next: (updatedBookmarks: Bookmark[]) => {
          this.bookmarks = updatedBookmarks
        },
        error: (error: any) => {
          this.error = error.error?.details || 'Failed to update bookmark';
        }
      });
    }
  }

  // get canManageBookmarks() {
  //   //return this.authService.isAuthenticated();
  // }

  get hasBookmarks(): boolean {
    return this.bookmarks.length > 0;
  }

  get sortedBookmarks(): Bookmark[] {
    return this.bookmarks.sort((a, b) => 
      (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0)
    );
  }
}