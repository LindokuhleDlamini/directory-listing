import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, retry, throwError } from 'rxjs';
import { DirectoryListing } from 'src/app/models/Directory-Listing';
import { environment } from '../../environments/environment';
import { CacheUtils } from '../utils/CacheUtlis';
import { FileItem } from '../models/File-Item';

@Injectable({
  providedIn: 'root'
})
export class DirectoryListingService {
  private apiUrl = environment.apiUrl;
  private retryCount = 2;
  private cache: CacheUtils;

  constructor(private http: HttpClient) {
    this.cache = new CacheUtils();
  }

  getDirectoryListing(path: string, page: number = 1, pageSize: number = 1000): Observable<DirectoryListing> {
    const cacheKey = `dir:${path}:${page}:${pageSize}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return of(cached);
    }

    const params = new HttpParams()
      .set('path', path)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<DirectoryListing>(`${this.apiUrl}/directoryListing/directory`, { params }).pipe(
      map((directoryListing: DirectoryListing) => {
        this.cache.set(cacheKey, directoryListing, 60000);
        return directoryListing;
      }),
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getDirectoryListingRange(
    path: string,
    startIndex: number,
    endIndex: number
  ): Observable<FileItem[]> {
    const pageSize = endIndex - startIndex;
    const page = Math.floor(startIndex / pageSize) + 1;

    return this.getDirectoryListing(path, page, pageSize)
      .pipe(
        map(response => response.items),
        debounceTime(100),
        distinctUntilChanged()
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = `An unknown error occurred: ${error}`;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = this.getServerErrorMessage(error);
    }

    console.error('FileSystemService error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'Network error: Unable to connect to server';
      case 400:
        return error.error?.details || 'Invalid request';
      case 403:
        return 'Access denied: You do not have permission to access this directory';
      case 404:
        return 'Directory not found';
      case 500:
        return 'Server error: Please try again later';
      default:
        return error.error?.details || `Server returned ${error.status}: ${error.statusText}`;
    }
  }
}