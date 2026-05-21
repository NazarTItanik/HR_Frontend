import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { BulkAction } from '../../models/BulkAction';

@Component({
  selector: 'app-bulk-popover',
  standalone: true,
  imports: [CommonModule, ButtonModule, PopoverModule],
template: `
  <div *ngIf="selectedItems.length > 0">
    <p-button icon="pi pi-bars" 
              label="Actions" 
              severity="secondary" 
              (onClick)="op.toggle($event)">
    </p-button>

    <p-popover #op>
      <div class="flex flex-column gap-1" style="min-width: 40px">
        <p-button *ngFor="let action of actions" 
          styleClass="w-full"
          [icon] = "action.icon"
          [label]="action.label"
          [severity]="action.severity || 'secondary'"
          text
          (onClick)="action.execute(getIds()); op.hide()">
        </p-button>
      </div>
    </p-popover>
  </div>
`
})
export class BulkPopoverComponent {
  @Input() selectedItems: any[] = [];
  @Input() actions: BulkAction[] = [];

  getIds(): string[] {
    return this.selectedItems.map(item => item.id);
  }
}