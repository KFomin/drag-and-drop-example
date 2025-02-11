import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from "@angular/material/sidenav";
import {NgClass, NgForOf, NgStyle} from "@angular/common";
import {DragDropModule, Point} from "@angular/cdk/drag-drop";
import {BehaviorSubject, debounceTime} from "rxjs";
import {CardKind, Card} from "../../data/models";
import {CardService} from "../../service/card.service";


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
  cards: Card[] = [];
  nextId = 1;
  creatingArrow: boolean = false;
  startArrowId: number | null = null;
  loadingCardId: number | null = null;

  constructor(private card: CardService) {
  }

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.canvas.nativeElement.width = window.innerWidth;
    this.canvas.nativeElement.height = window.innerHeight;
    this.drawArrows();
  }

  startArrowCreation(cardId: number) {
    this.startArrowId = cardId;
    this.creatingArrow = true;
  }

  onCardClick(event: MouseEvent, card: Card) {
    event.preventDefault();
    event.stopPropagation();
    switch (card.action) {
      case 'ToImageUrl':
        if (this.creatingArrow && this.startArrowId !== card.id && !card.parent) {
          this.finishArrowCreation(card.id);
        }
        break;
      case 'SuggestAge':
        if (this.creatingArrow && this.startArrowId !== card.id && !card.parent) {
          this.finishArrowCreation(card.id);
        }
        break;
      case "ToMorse":
        if (this.creatingArrow && this.startArrowId !== card.id && !card.parent) {
          this.finishArrowCreation(card.id);
        }
        break;
      case 'Output':
        if (this.creatingArrow && !card.parent) {
          this.finishArrowCreation(card.id);
        }
        break;
      case 'Input':
        break;
      default:
        break;
    }
  }

  finishArrowCreation(cardId: number) {
    const parent = this.cards.find(s => s.id === this.startArrowId);
    if (this.creatingArrow && parent) {
      this.cards.map(card => {
          if (card.id === parent.id) {
            card.connections.add(cardId);
          }
          if (card.id === cardId) {
            card.parent = parent.id;

            parent.value.pipe(debounceTime(1000)).subscribe(value => {
              if (card.action === 'SuggestAge') {
                this.card.suggestAge(value).then(ageResponse => {
                    this.loadingCardId = null;
                    card.value.next(ageResponse)
                  }
                )
              } else if (card.action === 'ToMorse') {
                this.card.translateIntoMorse(value).then(morseResponse => {
                    this.loadingCardId = null;
                    card.value.next(morseResponse)
                  }
                )
              } else {
                card.value.next(value);
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


  drawArrows() {
    if (!this.ctx) {
      return;
    }
    let ctx = this.ctx;

    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;
    ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    this.cards.map(card => {
      for (const connectionId of card.connections) {
        ctx = this.drawArrow(ctx, card, connectionId);
      }
    })
    this.ctx = ctx;
  }

  drawArrow(ctx: CanvasRenderingContext2D, card: Card, connectionId: number): CanvasRenderingContext2D {
    const fromCard = document.getElementById(card.id + '-card-on-board') as HTMLElement;
    const toCard = document.getElementById(connectionId + '-card-on-board') as HTMLElement;
    if (fromCard && toCard) {
      let fromCardRect = fromCard.getBoundingClientRect();
      let toCardRect = toCard.getBoundingClientRect();

      const [startX, startY] = card.action === 'Input'
        ? [fromCardRect.x, (fromCardRect.y + window.scrollY)]
        : [(fromCardRect.x - fromCardRect.width / 2), (fromCardRect.y + window.scrollY)];


      const endX = card.action === 'Output'
        ? toCardRect.x
        : (toCardRect.x - toCardRect.width / 2);

      const endY = toCardRect.top + window.scrollY;

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

  cardTextChanged(cardId: number, event: Event) {
    const card = this.cards.find(s => s.id === cardId);
    if (card && event.target) {
      card.title = (event.target as HTMLInputElement).value;
    }
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    const data = event.dataTransfer?.getData('text/plain');

    let action: CardKind | undefined;
    switch (data) {
      case 'Input':
        action = 'Input';
        break;
      case 'ToImageUrl':
        action = 'ToImageUrl';
        break;
      case 'SuggestAge':
        action = 'SuggestAge';
        break;
      case 'ToMorse':
        action = 'ToMorse';
        break;
      case 'Output':
        action = 'Output';
        break;
      default:
        break;
    }
    if (action) {
      const x = event.offsetX;
      const y = event.offsetY;
      const position = this.toPoint(x, y);

      const newCard: Card = {
        id: this.nextId++,
        action: action,
        position,
        title: this.card.translateCardTitle(action),
        value: new BehaviorSubject<string>(''),
        connections: new Set<number>(),
      };

      this.cards.push(newCard);
    }
  }

  onDragStart(event: DragEvent, action: CardKind) {
    event.dataTransfer?.setData('text/plain', action);
  }

  toPoint(x: number, y: number): Point {
    return {x: x, y: y};
  }

  @HostListener('window:resize')
  onResize() {
    this.drawArrows();
  }

  inputValueChanged(cardId: number, $event: Event) {
    const card = this.cards.find(s => s.id === cardId);
    const value = ($event.target as HTMLInputElement).value;
    if (card && $event.target) {
      card.value.next(value);
    }
  }

  canConnect(card: Card): boolean {
    return (
      card.action !== 'Output'
      && ((card.action === 'Input' && !this.creatingArrow)
        || this.cards.some(s => s.connections.has(card.id)))
    );
  }

  boardClicked() {
    this.creatingArrow = false;
    this.startArrowId = null;
  }

  getParentAction(card: Card): CardKind | undefined {
    return this.cards.find(s => s.id === card.parent)?.action;
  }

  deleteCard(id: number) {
    this.cards = this.cards
      .filter(s => (s.id !== id))
      .map(s => {
          if (s.parent === id) {
            delete s.parent;
          }
          s.connections.delete(id)
          return s;
        }
      );
    this.drawArrows();
  }
}

