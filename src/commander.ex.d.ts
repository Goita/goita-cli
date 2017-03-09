import * as commander from "commander";

export interface IGameCommand extends commander.ICommand {
    Command: commander.ICommandStatic;
    Option: commander.IOptionStatic;
    [key: string]: any;
    initialState?: string;
    playerNo?: number;
    initialScore?: number[];
}
