import * as commander from "commander";

export declare namespace commanderex{
    interface IGameCommand extends commander.ICommand {
        Command: commander.ICommandStatic;
        Option: commander.IOptionStatic;
        [key: string]: any;
        initialState?: string;
        playerNo?: number;
        inisitalScore?: number[];
    }
}
