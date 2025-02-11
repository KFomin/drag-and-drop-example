import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from "@angular/material/sidenav";
import {NgClass, NgForOf, NgStyle} from "@angular/common";
import {DragDropModule, Point} from "@angular/cdk/drag-drop";

interface Shape {
  id: number;
  action: 'GetInput' | 'ToImageUrl' | 'ToFunTranslation' | 'OutPut';
  position: Point;
  title: string;
  value: string;
  parent?: number;
  connections: Set<number>;
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
    NgClass,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D | null = null;
  shapes: Shape[] = [];
  nextId = 1;
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

  onShapeClick(event: MouseEvent, shape: Shape) {
    event.preventDefault();
    event.stopPropagation();
    switch (shape.action) {
      case 'GetInput':
        break;
      case 'ToImageUrl':
        if (this.creatingArrow && this.startArrowId !== shape.id && !shape.parent) {
          this.finishArrowCreation(shape.id);
        }
        break;
      case 'ToFunTranslation':
        if (this.creatingArrow && this.startArrowId !== shape.id && !shape.parent) {
          this.finishArrowCreation(shape.id);
        }
        break;
      case 'OutPut':
        if (this.creatingArrow && !shape.parent) {
          this.finishArrowCreation(shape.id);
        }
        break;
      default:
        break;
    }
  }

  finishArrowCreation(shapeId: number) {
    if (this.creatingArrow && this.startArrowId) {
      this.shapes.map(shape => {
        if (shape.id === this.startArrowId) {
          shape.connections.add(shapeId);
        }
        shape.parent = this.startArrowId || undefined;
      })
      this.startArrowId = null;
      this.creatingArrow = false;
      this.drawArrows();
    }
  }

  drawArrows() {
    if (!this.ctx) {
      return;
    }

    const ctx = this.ctx;

    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;
    ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.shapes.map(shape => {
      for (const connectionId of shape.connections) {
        const fromShape = document.getElementById(shape.id + '-shape-on-board') as HTMLElement;
        const toShape = document.getElementById(connectionId + '-shape-on-board') as HTMLElement;
        if (fromShape && toShape) {
          let fromShapeRect = fromShape.getBoundingClientRect();
          let toShapeRect = toShape.getBoundingClientRect();

          const startX = this.shapes.find(s => s.id === connectionId)?.action === 'GetInput'
            ? fromShapeRect.x
            : (fromShapeRect.x - fromShapeRect.width / 2);

          const startY = fromShapeRect.y;

          const endX = this.shapes.find(s => s.id === connectionId)?.action === 'OutPut'
            ? toShapeRect.x
            : (toShapeRect.x - toShapeRect.width / 2);

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
      }
    })
  }

  shapeTextChanged(shapeId: number, event: Event) {
    const shape = this.shapes.find(s => s.id === shapeId);
    if (shape && event.target) {
      shape.title = (event.target as HTMLInputElement).value;
    }
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    const data = event.dataTransfer?.getData('text/plain');

    let action: 'GetInput' | 'ToImageUrl' | 'ToFunTranslation' | 'OutPut' | undefined;
    switch (data) {
      case 'GetInput':
        action = 'GetInput';
        break;
      case 'ToImageUrl':
        action = 'ToImageUrl';
        break;
      case 'ToFunTranslation':
        action = 'ToFunTranslation';
        break;
      case 'OutPut':
        action = 'OutPut';
        break;
      default:
        break;
    }
    if (action) {
      const x = event.offsetX;
      const y = event.offsetY;
      const position = this.toPoint(x, y);

      const newShape: Shape = {
        id: this.nextId++,
        action: action,
        position,
        title: String(action),
        value: '',
        connections: new Set<number>(),
      };

      this.shapes.push(newShape);
    }
  }

  onDragStart(event: DragEvent, action: 'GetInput' | 'ToImageUrl' | 'ToFunTranslation' | 'OutPut') {
    event.dataTransfer?.setData('text/plain', action);
  }

  toPoint(x: number, y: number): Point {
    return {x: x, y: y};
  }

  @HostListener('window:resize')
  onResize() {
    this.drawArrows();
  }

  inputValueChanged(id: number, $event: Event) {
    const shape = this.shapes.find(s => s.id === id);
    const value = ($event.target as HTMLInputElement).value;
    if (shape && $event.target) {
      shape.value = ($event.target as HTMLInputElement).value;
    }
  }

  canConnect(shape: Shape): boolean {
    return (
      shape.action !== 'OutPut'
      && ((shape.action === 'GetInput' && !this.creatingArrow)
        || this.shapes.some(s => s.connections.has(shape.id)))
    );
  }

  protected readonly speechSynthesis = speechSynthesis;

  boardClicked() {
    this.creatingArrow = false;
    this.startArrowId = null;
  }
}

