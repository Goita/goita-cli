import * as clc from "cli-color";
import * as program from "commander";
import {RandomAI} from "goita-ai-sample";
import * as goita from "goita-core";
import * as readline from "readline";
import { commanderex } from "./commander.ex";
import {Cui} from "./cui";

const command = program.version("0.0.1")
.option("-i, --initial-state [state]", "initial state historyString", null)
.option("-s, --initial-score [score]", "initial scores for each team",
        (v) => v.split(",").map(Number), [0, 0])
.option("-p, --player-no [no]", "your player no.", (p) => Number(p) - 1 , 1)
.parse(process.argv) as commanderex.IGameCommand;

const ai = new RandomAI() as goita.AI;

const game = goita.Factory.createGame();
game.startNewGame();

function gameLoop(exitloop: () => void) {
    // game.startNewDeal();
    game.startNewDealWithInitialState("11111678,12345679,11112345,23452345,s1");
    process.stdout.write("round: " + game.roundCount + "\n");

    const loopFunc = () => {
        if (game.isEnd) {
            exitloop();
        }else {
            gameLoop(exitloop);
        }
    };

    if (game.board.isGoshiSuspended) {
        Cui.showField(game);

        const goshiP = game.board.goshiPlayerNo;
        if (goshiP === command.playerNo) {
            process.stdout.write("you have 5 shi, do you wish to play?\n");
            Cui.askYesNo((yes) => {
                if (yes) {
                    game.board.continueGoshi();
                    roundLoop(loopFunc);
                } else {
                    game.board.redeal();
                    loopFunc();
                }
            });
        } else {
            const pName = "p" + (goshiP + 1);
            process.stdout.write(pName + " have 5 shi\n");
            const ret = ai.continueGoshi(game.board.toThinkingInfo());
            setTimeout(() => {
                if (ret) {
                    game.board.continueGoshi();
                    roundLoop(loopFunc);
                } else {
                    game.board.redeal();
                    loopFunc();
                }
            }, 1000);
        }
    }
};

function roundLoop(exitloop: () => void) {

    if (game.board.turnPlayer.no === Number(command.playerNo)) {
        Cui.selectMove(game, (m) => {
            game.board.playMove(m);
            if (game.board.isEndOfDeal) {
                exitloop();
            }else {
                roundLoop(exitloop);
            }
        });
    } else {
        const m = ai.chooseMove(game.board.toThinkingInfo());
        game.board.playMove(m);
        if (game.board.isEndOfDeal) {
            exitloop();
        }else {
            roundLoop(exitloop);
        }
    }
};

gameLoop(() => {
    process.exit(0);
});
