import {Component} from '@angular/core';
import {MatDrawer, MatDrawerContent, MatDrawerContainer} from "@angular/material/sidenav";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    // Здесь можно добавить логику размещения элемента на канвасе
    console.log('Form moved onto canvas');
  }
}
