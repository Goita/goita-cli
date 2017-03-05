import * as clicolor from "cli-color";
export interface IErase{
    screen: string;
    screenLeft: string;
    screenRight: string;
    line: string;
    lineLeft: string;
    lineRight: string;
}

export interface IExFormat extends clicolor.Format {
    [key: string]: any;
    erase: IErase;
}
