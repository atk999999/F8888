export type EventId = number | string;
export interface Life {
 name: string; year: number; month: number; unit: 'year'|'month'; day: number;
 stats: Record<string,number>; talents: string[]; pending: EventId|null;
 history: {year:number;id:EventId;choice:number|null}[];
 seen:Record<string,number>;last:Record<string,number>;queue:EventId[];removed:string[];ended:boolean; ending:string;
}
export interface OriginalEvent {id:EventId;name:string;explain?:string;action?:string[]}
export function createEngine(config:unknown,removeConfig?:unknown):{
 start(options:{name:string;stats:Record<string,number>;talents:string[]},rng?:()=>number):Life;
 advance(state:Life,rng?:()=>number):Life;choose(state:Life,index:number,rng?:()=>number):Life;
 current(state:Life):OriginalEvent|null;
};
