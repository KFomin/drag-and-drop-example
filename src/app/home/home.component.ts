import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from "@angular/material/sidenav";
import {NgForOf, NgStyle} from "@angular/common";
import {DragDropModule, Point} from "@angular/cdk/drag-drop";

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
export class HomeComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D | null = null;
  shapes: Shape[] = [];
  nextId = 1;
  arrows: { from: number, to: number }[] = [];
  creatingArrow: boolean = false;
  startArrowId: number | null = null;

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.canvas.nativeElement.width = window.innerWidth;
    this.canvas.nativeElement.height = window.innerHeight;
    this.drawArrows();
  }

  startArrowCreation(shapeId: number) {
    this.startArrowId = shapeId;
    this.creatingArrow = true;
  }

  finishArrowCreation(shapeId: number | null) {
    if (this.startArrowId && shapeId) {
      this.arrows.push({from: this.startArrowId, to: shapeId});
    }
    this.startArrowId = null;
    this.creatingArrow = false;
    this.drawArrows();
  }

  drawArrows() {
    if (!this.ctx) {
      return;
    }

    const ctx = this.ctx;

    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;
    ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.arrows.forEach(arrow => {
      const fromShape = document.getElementById(arrow.from + '-shape-on-board') as HTMLElement;
      const toShape = document.getElementById(arrow.to + '-shape-on-board') as HTMLElement;
      if (fromShape && toShape) {
        let fromShapeRect = fromShape.getBoundingClientRect();
        let toShapeRect = toShape.getBoundingClientRect();
        const startX = fromShapeRect.x - fromShapeRect.width;
        const startY = fromShapeRect.y;
        const endX = toShapeRect.x - toShapeRect.width;
        const endY = toShapeRect.y;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      this.ctx = ctx;
    })
  }

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
      const x = event.offsetX;
      const y = event.offsetY;
      const position = this.toPoint(x, y);

      const newShape: Shape = {
        id: this.nextId++,
        type,
        position,
        text: ''
      };

      this.shapes.push(newShape);
    }
  }

  onDragStart(event: DragEvent, type: string) {
    event.dataTransfer?.setData('text/plain', type);
  }

  toPoint(x: number, y: number): Point {
    return {x: x, y: y};
  }

  @HostListener('window:resize')
  onResize() {
    this.drawArrows();
  }
}

