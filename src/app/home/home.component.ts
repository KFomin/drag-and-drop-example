import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from "@angular/material/sidenav";
import {NgForOf} from "@angular/common";
import {DragDropModule, Point} from "@angular/cdk/drag-drop";
import {BehaviorSubject, debounceTime} from "rxjs";
import {CardKind, Card} from "../../data/models";
import {CardService} from "../../service/card.service";
import {CardComponent} from "../card/card.component";


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    NgForOf,
    DragDropModule,
    CardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  ctx: BehaviorSubject<CanvasRenderingContext2D | null> = new BehaviorSubject<CanvasRenderingContext2D | null>(null);
  cards: Card[] = [];
  nextId = 1;
  creatingArrow = false;
  startArrowId: number | null = null;

  constructor(private cardService: CardService) {
  }

  ngOnInit() {
    this.cardService.cards.subscribe(cards => {
      this.cards = cards;
      this.drawArrows();
    })
    this.cardService.creatingArrow.subscribe(value => this.creatingArrow = value)
    this.cardService.startArrowId.subscribe(value => this.startArrowId = value)
  }

  ngAfterViewInit() {
    this.ctx.next(this.canvas.nativeElement.getContext('2d'));
    this.canvas.nativeElement.width = window.innerWidth;
    this.canvas.nativeElement.height = window.innerHeight;
    this.drawArrows();
  }


  onCardClick(event: MouseEvent, card: Card) {
    event.preventDefault();
    event.stopPropagation();
    console.log(card.kind);
    if (this.creatingArrow && !card.parent) {
      console.log(this.startArrowId)
      console.log(card.id)
      switch (card.kind) {
        case 'ToImageUrl':
          if (this.startArrowId !== card.id) {
            this.finishArrowCreation(card.id);
          }
          break;
        case 'SuggestAge':
          if (this.startArrowId !== card.id) {
            this.finishArrowCreation(card.id);
          }
          break;
        case 'ToMorse':
          if (this.startArrowId !== card.id) {
            this.finishArrowCreation(card.id);
          }
          break;
        case 'Output':
          if (!card.parent) {
            this.finishArrowCreation(card.id);
          }
          break;
        default:
          break;
      }
    }
  }

  finishArrowCreation(cardId: number) {
    const parent = this.cards.find(s => s.id === this.startArrowId);
    if (this.cardService.creatingArrow.value && parent) {
      this.cards.map(card => {
          if (card.id === parent.id) {
            card.connections.add(cardId);
          }
          if (card.id === cardId) {
            card.parent = parent.id;

            parent.value.pipe(debounceTime(1000)).subscribe(value => {
              if (card.kind === 'SuggestAge') {
                this.cardService.suggestAge(value).then(ageResponse => {
                    card.value.next(ageResponse)
                  }
                )
              } else if (card.kind === 'ToMorse') {
                this.cardService.translateIntoMorse(value).then(morseResponse => {
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
      this.cardService.cards.next(this.cards);
      this.startArrowId = null;
      this.cardService.creatingArrow.next(false);
      this.drawArrows();
    }
  }

  drawArrows() {
    let ctx = this.ctx.getValue();
    if (ctx !== null) {
      ctx.canvas.width = ctx.canvas.clientWidth;
      ctx.canvas.height = ctx.canvas.clientHeight;
      ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

      this.cards.map(card => {
        for (const connectionId of card.connections) {
          this.ctx.next(this.drawArrow(ctx, card, connectionId))
        }
      })
    }
  }

  drawArrow(ctx: CanvasRenderingContext2D, card: Card, connectionId: number): CanvasRenderingContext2D {
    const fromCard = document.getElementById(card.id + '-card-on-board') as HTMLElement;
    const toCard = document.getElementById(connectionId + '-card-on-board') as HTMLElement;
    if (fromCard && toCard) {
      let fromCardRect = fromCard.getBoundingClientRect();
      let toCardRect = toCard.getBoundingClientRect();

      const [startX, startY] = card.kind === 'Input'
        ? [fromCardRect.x, (fromCardRect.y + window.scrollY)]
        : [(fromCardRect.x - fromCardRect.width / 2), (fromCardRect.y + window.scrollY)];


      const endX = card.kind === 'Output'
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
        kind: action,
        position,
        title: this.cardService.translateCardTitle(action),
        value: new BehaviorSubject<string>(''),
        connections: new Set<number>(),
      };
      this.cards.push(newCard);
      this.cardService.cards.next(this.cards);
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

  boardClicked() {
    this.cardService.creatingArrow.next(false);
    this.startArrowId = null;
  }

  getParentCardKind(card: Card): CardKind | null {
    const parentCard = this.cardService.cards.getValue().find(s => s.id === card.parent);
    if (parentCard) {
      return parentCard.kind
    }
    return null;
  }
}

