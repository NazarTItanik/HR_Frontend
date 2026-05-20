import { Component, Input } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { RouterLink, RouterLinkActive } from '@angular/router';


@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  // This variable controls if the drawer is open or closed
  @Input() expanded = false;

}
