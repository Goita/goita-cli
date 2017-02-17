import * as program from "commander";
import {RandomAI} from "goita-ai-sample";
import * as goita from "goita-core";
import { commanderex } from "./commander.ex";

const command = program.version("0.0.1")
.option("-i, --initial-state [state]", "initial state historyString", null)
.option("-s, --initial-score [score]", "initial scores for each team",
        (v) => v.split(",").map(Number), [0, 0])
.option("-p, --player-no [no]", "your player no.", 1)
.parse(process.argv) as commanderex.IGameCommand;

// process.stdout.write(command.initialState + "\n");
// process.stdout.write(command.playerNo + "\n");

const ai = new RandomAI() as goita.AI;

const game = goita.Factory.createGame();
game.startNewGame();
while (!game.isEnd) {
    game.startNewDeal();
    process.stdout.write("round: " + game.roundCount + "\n");
    while (!game.board.isEndOfDeal){
        if(game.board.turnPlayer.no === command.playerNo){

        } else {
            const m = ai.chooseMove(game.board.toThinkingInfo());
            game.board.playMove(m);
        }
    }
}
process.exit(0);
