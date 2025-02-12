import {Injectable} from '@angular/core';
import {Card, CardKind} from "../data/models";
import {BehaviorSubject, lastValueFrom, Subject} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})
export class CardService {
    cards: BehaviorSubject<Card[]> = new BehaviorSubject<Card[]>([]);
    creatingArrow: BehaviorSubject<boolean> = new BehaviorSubject(false);
    startArrowId: Subject<number> = new Subject();

    constructor(private http: HttpClient) {
    }

    translateCardTitle(action: CardKind): string {
        switch (action) {
            case "Output":
                return "Result";
            case "ToMorse":
                return "To Morse";
            case 'Input':
                return 'Input';
            case 'ToImageUrl':
                return 'To Image';
            case 'SuggestAge':
                return 'Get Age';
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
}
