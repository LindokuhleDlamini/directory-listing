import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'dateFormat'
})
export class DateFormatPipe implements PipeTransform {
  transform(value: Date | string | null | undefined, format: string = 'medium'): string {
    if (!value) return '-';
    
    const date = typeof value === 'string' ? new Date(value) : value;
    return new DatePipe('en-US').transform(date, format) || '-';
  }
}