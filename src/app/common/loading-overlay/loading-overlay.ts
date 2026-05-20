// loading-overlay.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading-service/loading-service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading.isLoading()) {
      <div class="loading-overlay">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(2px);
    }
    .loading-spinner i {
      font-size: 3rem;
      color: white;
    }
  `]
})
export class LoadingOverlayComponent {
  loading = inject(LoadingService);
}