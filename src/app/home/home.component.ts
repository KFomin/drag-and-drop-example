import {Component} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from "@angular/material/sidenav";
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
      const canvasRect = (event.target as HTMLElement).closest('.canvas')?.getBoundingClientRect();
      if (canvasRect) {
        const newX = event.clientX - this.offsetX;
        const newY = event.clientY  - this.offsetY;

        const newShape: Shape = { ...this.draggingShape, x: newX, y: newY };

        const positionAdjustedShape = this.findNewPosition(newShape);

        this.draggingShape.x = positionAdjustedShape.x;
        this.draggingShape.y = positionAdjustedShape.y;
      }
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
    const type = event.dataTransfer?.getData('text/plain');

    if (type) {
      const canvasRect = (event.target as HTMLElement).getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;

      const newShape: Shape = {
        id: this.nextId++,
        type,
        x,
        y,
        text: ''
      };

      // Находим новую позицию для формы
      const positionAdjustedShape = this.findNewPosition(newShape);
      this.shapes.push(positionAdjustedShape);
    }
  }

  onDragStart(event: DragEvent, type: string) {
    event.dataTransfer?.setData('text/plain', type); // Передаем тип формы
  }

  private checkCollision(newShape: Shape): boolean {
    return this.shapes.some(existingShape => {
      return !(newShape.x > existingShape.x + 100 ||
        newShape.x + 100 < existingShape.x ||
        newShape.y > existingShape.y + 100 ||
        newShape.y + 100 < existingShape.y);
    });
  }

  private findNewPosition(shape: Shape): Shape {
    while (this.checkCollision(shape)) {
      shape.x += 110;
      if (shape.x > window.innerWidth - 100) {
        shape.x = 0;
        shape.y += 110;
      }
    }
    return shape;
  }
}
