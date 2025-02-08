import {Component} from '@angular/core';
import {MatDrawer, MatDrawerContent, MatDrawerContainer} from "@angular/material/sidenav";
import {NgForOf, NgStyle} from "@angular/common";

interface Shape {
  id: number;
  type: string;
  x: number;
  y: number;
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
    NgStyle
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  shapes: Shape[] = [];
  nextId = 1;
  draggingShape: Shape | null = null;
  offsetX: number = 0;
  offsetY: number = 0;

  shapeTextChanged(shapeId: number, event: Event) {
    const shape = this.shapes.find(s => s.id === shapeId);
    if (shape && event.target) {
      shape.text = (event.target as HTMLInputElement).value;
    }
  }

  handleMouseDown(event: MouseEvent, shape: Shape) {
    event.preventDefault();
    this.draggingShape = shape;
    this.offsetX = event.clientX - shape.x;
    this.offsetY = event.clientY - shape.y;
  }

  handleMouseMove(event: MouseEvent) {
    if (this.draggingShape) {
      event.preventDefault();
      this.draggingShape.x = event.clientX - this.offsetX;
      this.draggingShape.y = event.clientY - this.offsetY;
    }
  }

  handleMouseUp() {
    this.draggingShape = null;
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer?.getData('text/plain'); // Получаем тип формы

    if (type) {
      const canvasRect = (event.target as HTMLElement).getBoundingClientRect();
      const x = event.offsetX; // Позиция на канвасе
      const y = event.offsetY;

      this.shapes.push({
        id: this.nextId++,
        type,
        x,
        y,
        text: ""
      });
    }
  }

  onDragStart(event: DragEvent, type: string) {
    event.dataTransfer?.setData('text/plain', type); // Передаем тип формы
  }
}
