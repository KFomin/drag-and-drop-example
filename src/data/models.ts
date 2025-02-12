import {Point} from "@angular/cdk/drag-drop";
import {BehaviorSubject} from "rxjs";

export type CardKind = 'Input' | 'ToImageUrl' | 'SuggestAge' | 'Output' | 'ToMorse';

export interface Card {
  id: number;
  kind: CardKind;
  position: Point;
  title: string;
  value: BehaviorSubject<string>;
  parent?: number;
  connections: Set<number>;
}
