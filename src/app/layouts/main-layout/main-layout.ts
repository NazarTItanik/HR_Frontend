import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../common/header/header';
import { Sidebar } from '../../common/sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Sidebar],
  template: `
    <app-header (toggleMenu)="sidebarExpanded = !sidebarExpanded"></app-header>
    <div style="display: flex; height: calc(100vh - 70px);">
      <app-sidebar [expanded]="sidebarExpanded"></app-sidebar>
      <main style="flex-grow: 1; padding: 0.5rem; overflow-y: auto; background: #eef0f4;">
        <router-outlet></router-outlet> 
      </main>
    </div>
  `
})
export class MainLayout {
  sidebarExpanded = false;
}