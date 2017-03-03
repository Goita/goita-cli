import * as clicolor from "cli-color";
export interface Erase{
    screen: string;
    screenLeft: string;
    screenRight: string;
    line: string;
    lineLeft: string;
    lineRight: string;
}

export interface ExFormat extends clicolor.Format {
    [key: string]: any;
    erase: Erase;
}
