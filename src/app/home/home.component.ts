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
      const alreadyConnected =
        this.arrows.some(arrow => {
          return arrow.from === this.startArrowId && arrow.to === shapeId
        });

      if (!alreadyConnected) {
        this.arrows.push({from: this.startArrowId, to: shapeId});
      }
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

        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY); // Start of the line
        ctx.lineTo(endX, endY); // End of the line
        ctx.strokeStyle = '#007bff'; // Line color
        ctx.lineWidth = 2; // Line width
        ctx.stroke();

        // Calculate the midpoint for the arrow
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        // Offset the arrow by 12 pixels
        const headlen = 10; // Arrowhead length
        const angle = Math.atan2(endY - startY, endX - startX); // Arrow angle
        const offset = 12; // 12 pixels offset

        // New positions to draw the arrow
        const arrowMidX = midX + offset * Math.cos(angle);
        const arrowMidY = midY + offset * Math.sin(angle);

        // Draw the arrow at the offset center
        ctx.beginPath();
        ctx.moveTo(arrowMidX, arrowMidY); // Move to the offset midpoint of the line
        ctx.lineTo(arrowMidX - headlen * Math.cos(angle - Math.PI / 6), arrowMidY - headlen * Math.sin(angle - Math.PI / 6)); // Left side of the arrowhead
        ctx.lineTo(arrowMidX - headlen * Math.cos(angle + Math.PI / 6), arrowMidY - headlen * Math.sin(angle + Math.PI / 6)); // Right side of the arrowhead
        ctx.fillStyle = '#007bff'; // Arrow color
        ctx.fill();

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

