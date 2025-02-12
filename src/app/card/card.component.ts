import {Component, Input} from '@angular/core';
import {CdkDrag, CdkDragHandle} from "@angular/cdk/drag-drop";
import {NgClass, NgStyle} from "@angular/common";
import {Card, CardKind} from "../../data/models";
import {CardService} from "../../service/card.service";

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragHandle,
    NgClass,
    NgStyle
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() card!: Card;
  @Input() getParentKind!: (card: Card) => CardKind | null;
  @Input() dragCardHandler!: () => void;

  creatingArrow = false;

  constructor(private cardService: CardService) {
    this.cardService.creatingArrow.subscribe(value => this.creatingArrow = value);
  }


  inputValueChanged(cardId: number, $event: Event) {
    const card = this.cardService.cards.value.find(s => s.id === cardId);
    const value = ($event.target as HTMLInputElement).value;
    if (card && $event.target) {
      card.value.next(value);
    }
  }

  deleteCard(id: number) {
    const newCards = this.cardService.cards
      .getValue()
      .filter(s => (s.id !== id))
      .map(s => {
          if (s.parent === id) {
            delete s.parent;
          }
          s.connections.delete(id)
          return s;
        }
      );

    this.cardService.cards.next(newCards);
  }

  canConnect(card: Card): boolean {
    return (
      card.kind !== 'Output'
      && ((card.kind === 'Input' && !this.creatingArrow)
        || this.cardService.cards.value.some(s => s.connections.has(card.id)))
    );
  }

  cardTextChanged(cardId: number, event: Event) {
    const card = this.cardService.cards.value.find(s => s.id === cardId);
    if (card && event.target) {
      card.title = (event.target as HTMLInputElement).value;
    }
  }

  startArrowCreation(id: number) {
    this.cardService.startArrowId.next(id);
    this.cardService.creatingArrow.next(true);
  }
}
