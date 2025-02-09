import {Component} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from "@angular/material/sidenav";
import {NgForOf, NgStyle} from "@angular/common";
import {CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragRelease, DragDropModule, Point} from "@angular/cdk/drag-drop";

interface Shape {
  id: number;
  type: string;
  position: Point;
  text: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    NgForOf,
    NgStyle,
    DragDropModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  shapes: Shape[] = [];
  nextId = 1;

  shapeTextChanged(shapeId: number, event: Event) {
    const shape = this.shapes.find(s => s.id === shapeId);
    if (shape && event.target) {
      shape.text = (event.target as HTMLInputElement).value;
    }
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer?.getData('text/plain');

    if (type) {
      const x = event.layerX;
      const y = event.layerY;
      const position = this.toPoint(x, y);

      console.log(position);

      const newShape: Shape = {
          id: this.nextId++,
          type,
          position,
          text: ''
        }
      ;

      this.shapes.push(newShape);
    }
  }

  onDragStart(event: DragEvent, type: string) {
    event.dataTransfer?.setData('text/plain', type); // Передаем тип формы
  }

  toPoint(x: number, y: number): Point {
    return {x: x, y: y};
  }

  onDragEnd($event: CdkDragEnd, id: number) {
    console.log($event);
    // this.shapes.map(shape => {
    //     if (shape.id === id) {
    //       console.log($event.distance.x);
    //       console.log($event.dropPoint.x);
    //       shape.position = {
    //         x: shape.position.x  + $event.distance.x,
    //         y: shape.position.y + $event.distance.y
    //       };
    //       console.log(shape.position.x);
    //     }
    //   }
    // )
  }
}
