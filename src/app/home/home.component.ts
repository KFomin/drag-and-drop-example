import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from "@angular/material/sidenav";
import {NgClass, NgForOf, NgStyle} from "@angular/common";
import {DragDropModule, Point} from "@angular/cdk/drag-drop";
import {BehaviorSubject, debounceTime, lastValueFrom} from "rxjs";
import {HttpClient} from '@angular/common/http';

type Action = 'GetInput' | 'ToImageUrl' | 'SuggestAge' | 'OutPut' | 'TranslateIntoMorse';

interface Shape {
  id: number;
  action: Action;
  position: Point;
  title: string;
  value: BehaviorSubject<string>;
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

  constructor(private http: HttpClient) {
  }

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
      case 'ToImageUrl':
        if (this.creatingArrow && this.startArrowId !== shape.id && !shape.parent) {
          this.finishArrowCreation(shape.id);
        }
        break;
      case 'SuggestAge':
        if (this.creatingArrow && this.startArrowId !== shape.id && !shape.parent) {
          this.finishArrowCreation(shape.id);
        }
        break;
      case "TranslateIntoMorse":
        if (this.creatingArrow && this.startArrowId !== shape.id && !shape.parent) {
          this.finishArrowCreation(shape.id);
        }
        break;
      case 'OutPut':
        if (this.creatingArrow && !shape.parent) {
          this.finishArrowCreation(shape.id);
        }
        break;
      case 'GetInput':
        break;
      default:
        break;
    }
  }

  finishArrowCreation(shapeId: number) {
    const parent = this.shapes.find(s => s.id === this.startArrowId);
    if (this.creatingArrow && parent) {
      this.shapes.map(shape => {
          if (shape.id === parent.id) {
            shape.connections.add(shapeId);
          }
          if (shape.id === shapeId) {
            shape.parent = parent.id;

            parent.value.pipe(debounceTime(1000)).subscribe(value => {
              if (shape.action === 'SuggestAge') {
                this.suggestAge(value).then(ageResponse => {
                    shape.value.next(ageResponse)
                  }
                )
              } else if (shape.action === 'TranslateIntoMorse') {
                this.translateIntoMorse(value).then(morseResponse => {
                    shape.value.next(morseResponse)
                  }
                )

              } else {
                shape.value.next(value);
              }
            })
          }
        }
      )
      this.startArrowId = null;
      this.creatingArrow = false;
      this.drawArrows();
    }
  }

  async suggestAge(value: string): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.http.get<{ age: number }>(`https://api.agify.io?name=${encodeURIComponent(value)}`)
      );
      if (response.age === null) {
        return "Sorry, I can't guess your age";
      }
      return (value + ' age is estimately ' + response.age);

    } catch
      (error) {
      return "Failed to get age, sorry!"
    }
  }

  async translateIntoMorse(value: string): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.http.get<{
          contents: { translated: string }
        }>(`https://api.funtranslations.com/translate/morse.json?text=${encodeURIComponent(value)}`)
      );
      return response.contents.translated;
    } catch (error) {
      return "Failed to get morse code, sorry!"
    }
  }

  drawArrows() {
    if (!this.ctx) {
      return;
    }
    let ctx = this.ctx;

    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;
    ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    this.shapes.map(shape => {
      for (const connectionId of shape.connections) {
        ctx = this.drawArrow(ctx, shape, connectionId);
      }
    })
    this.ctx = ctx;
  }

  drawArrow(ctx: CanvasRenderingContext2D, shape: Shape, connectionId: number): CanvasRenderingContext2D {
    const fromShape = document.getElementById(shape.id + '-shape-on-board') as HTMLElement;
    const toShape = document.getElementById(connectionId + '-shape-on-board') as HTMLElement;
    if (fromShape && toShape) {
      let fromShapeRect = fromShape.getBoundingClientRect();
      let toShapeRect = toShape.getBoundingClientRect();

      const [startX, startY] = shape.action === 'GetInput'
        ? [fromShapeRect.x, (fromShapeRect.y + window.scrollY)]
        : [(fromShapeRect.x - fromShapeRect.width / 2), (fromShapeRect.y + window.scrollY)];


      const endX = shape.action === 'OutPut'
        ? toShapeRect.x
        : (toShapeRect.x - toShapeRect.width / 2);

      const endY = toShapeRect.top + window.scrollY;

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
    return ctx;
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

    let action: Action | undefined;
    switch (data) {
      case 'GetInput':
        action = 'GetInput';
        break;
      case 'ToImageUrl':
        action = 'ToImageUrl';
        break;
      case 'SuggestAge':
        action = 'SuggestAge';
        break;
      case 'TranslateIntoMorse':
        action = 'TranslateIntoMorse';
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
        title: this.translateShapeTitle(action),
        value: new BehaviorSubject<string>(''),
        connections: new Set<number>(),
      };

      this.shapes.push(newShape);
    }
  }

  onDragStart(event: DragEvent, action: Action) {
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
      shape.value.next(value);
    }
  }

  canConnect(shape: Shape): boolean {
    return (
      shape.action !== 'OutPut'
      && ((shape.action === 'GetInput' && !this.creatingArrow)
        || this.shapes.some(s => s.connections.has(shape.id)))
    );
  }

  boardClicked() {
    this.creatingArrow = false;
    this.startArrowId = null;
  }

  getParentAction(shape: Shape): Action | undefined {
    return this.shapes.find(s => s.id === shape.parent)?.action;
  }

  translateShapeTitle(action: Action): string {
    switch (action) {
      case "OutPut":
        return "Result";
      case "TranslateIntoMorse":
        return "To Morse";
      case 'GetInput':
        return 'Input';
      case 'ToImageUrl':
        return 'To Image';
      case 'SuggestAge':
        return 'Get Age';
    }
  }

  deleteShape(id: number) {
    this.shapes = this.shapes.filter(s => s.id !== id);
    this.drawArrows();
  }
}

