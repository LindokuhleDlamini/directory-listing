import { Component, Input, OnInit } from '@angular/core';
import { BookmarkService } from '../../services/Bookmark-Service';

@Component({
  selector: 'app-bookmark-button',
  templateUrl: './bookmark-button.component.html',
  styleUrls: ['./bookmark-button.component.scss']
})
export class BookmarkButtonComponent implements OnInit {
  @Input() path: string = '';
  @Input() name: string = '';
  @Input() showLabel: boolean = false;
  @Input() size: 'sm' | 'lg' = 'sm';

  isBookmarked: boolean = false;
  isLoading: boolean = false;
  existingBookmark: any = null;

  constructor(
    private bookmarkService: BookmarkService,
  ) {}

  ngOnInit(): void {
      this.checkBookmarkStatus();
  }

  checkBookmarkStatus(): void {
    this.bookmarkService.getBookmarkByPath(this.path).subscribe(bookmark => {
      this.existingBookmark = bookmark;
      this.isBookmarked = !!bookmark;
    });
  }

  toggleBookmark(): void {
    this.isLoading = true;
    if (this.isBookmarked && this.existingBookmark) {
      this.removeBookmark();
    } else {
      this.addBookmark();
    }
  }

  addBookmark(): void {
    const bookmarkName = this.name || this.path.split('/').pop() || this.path;
    this.bookmarkService.createBookmark(bookmarkName, this.path).subscribe({
      next: (bookmark) => {
        this.isBookmarked = true;
        this.existingBookmark = bookmark;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to add bookmark:', error);
        this.isLoading = false;
      }
    });
  }

  removeBookmark(): void {
    if (!this.existingBookmark) return;

    this.bookmarkService.deleteBookmark(this.existingBookmark.id).subscribe({
      next: () => {
        this.isBookmarked = false;
        this.existingBookmark = null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to remove bookmark:', error);
        this.isLoading = false;
      }
    });
  }

  get buttonClass(): string {
    const baseClass = `btn ${this.size === 'lg' ? 'btn-lg' : 'btn-sm'}`;
    return this.isBookmarked 
      ? `${baseClass} btn-warning` 
      : `${baseClass} btn-outline-secondary`;
  }

  get iconClass(): string {
    return this.isBookmarked ? 'bi-star-fill' : 'bi-star';
  }

  get tooltipText(): string {
    return this.isBookmarked ? 'Remove bookmark' : 'Add to bookmarks';
  }
}