import * as clc from "cli-color";
import * as program from "commander";
import * as SampleAI from "goita-ai-sample";
import * as goita from "goita-core";
import * as readline from "readline";
import { commanderex } from "./commander.ex";
import {Cui} from "./cui";

import * as fs from "fs";
const packageJson = JSON.parse(fs.readFileSync(__dirname + "/../package.json").toString());

const command = program.version(packageJson.version)
.option("-i, --initial-state [state]", "initial state historyString", null)
.option("-s, --initial-score [score]", "initial scores for each team",
        (v: string) => v.split(",").map((s: string) => Number(s)), [0, 0])
.option("-p, --player-no [no]", "your player no.", (p) => Number(p) - 1 , 0)
.parse(process.argv) as commanderex.IGameCommand;

const ai = new SampleAI.SimpleAI();
const wait: number = 1000;
const msgs = new Array<string>();
const msgLines: number = 5;
const game = goita.Factory.createGame();
game.startNewGame();
game.setInitialScore(command.initialScore);

function gameLoop(exitloop: () => void) {
    const exitRound = () => {
        if (game.isEnd) {
            exitloop();
        }else {
            gameLoop(exitloop);
        }
    };

    game.startNewDeal();
    // game.startNewDealWithInitialState("11112678,11345679,11112345,23452345,s1");

    if (game.board.isGoshiSuspended) {
        const goshiP = game.board.goshiPlayerNo;
        for (const p of goshiP) {
            Cui.clearScreen();
            Cui.showField(game, command.playerNo);

            if (p === command.playerNo) {
                Cui.showHand(game, p, false);
                msgs.push("you have 5 shi");
                Cui.showMessages(msgs, msgLines);
                process.stdout.write("do you wish to play?\n");
                Cui.askYesNo((yes) => {
                    if (yes) {
                        msgs.push("you decided to play");
                        game.board.continueGoshi();
                        roundLoop(exitRound);
                    } else {
                        msgs.push("you decided to redeal");
                        game.board.redeal();
                        exitRound();
                    }
                });
            } else {
                const pName = "p" + (p + 1);
                msgs.push(pName + " have 5 shi");
                Cui.showHand(game, p, true);
                Cui.showMessages(msgs, msgLines);
                const ret = ai.continueGoshi(game.board.toThinkingInfo());
                setTimeout(() => {
                    if (ret) {
                        msgs.push(pName + " decided to play");
                        game.board.continueGoshi();
                        roundLoop(exitRound);
                    } else {
                        msgs.push(pName + " decided to redeal");
                        game.board.redeal();
                        exitRound();
                    }
                }, wait);
            }
        }
    } else {
        roundLoop(exitRound);
    }
};

function roundLoop(exitloop: () => void) {
    Cui.clearScreen();
    Cui.showField(game, command.playerNo);
    if (game.board.turnPlayer.no === command.playerNo) {
        Cui.showHand(game, game.board.turnPlayer.no, false);
        Cui.showMessages(msgs, msgLines);
        Cui.selectMove(game, (m) => {
            game.board.playMove(m);
            if (m.pass) {
                msgs.push("you passed");
            } else {
                msgs.push("you played " + m.toTextString());
            }

            if (game.board.isEndOfDeal) {
                msgs.push("you have finished by score " + m.toScore());
                msgs.push("the history is ");
                msgs.push(game.board.toHistoryString());
                exitloop();
            }else {
                roundLoop(exitloop);
            }
        });
    } else {
        Cui.showHand(game, game.board.turnPlayer.no, true);
        Cui.showMessages(msgs, msgLines);
        const p = "p" + (game.board.turnPlayer.no + 1);
        const m = ai.chooseMove(game.board.toThinkingInfo());
        game.board.playMove(m);
        if (m.pass) {
            msgs.push(p + " passed");
        } else {
            msgs.push(p + " played " + m.toTextString());
        }

        if (game.board.isEndOfDeal) {
            msgs.push(p + " has finished by score " + m.toScore());
            msgs.push("the history is ");
            msgs.push(game.board.toHistoryString());
            exitloop();
        }else {
            setTimeout(() => {
                roundLoop(exitloop);
            }, wait);
        }
    }
};

function exitMessage(): void {
    let win: boolean;
    win = game.scores[command.playerNo % 2] >= game.winScore;
    process.stdout.write("you have ");
    if (win) {
        process.stdout.write("won");
    } else {
        process.stdout.write("lost");
    }
    process.stdout.write(" the game. the scores ware " + game.scores[0] + ", " + game.scores[1]);
    process.stdout.write("\n");
};

if (game.isEnd) {
    exitMessage();
    process.exit(0);
} else {
    gameLoop(() => {
        exitMessage();
        process.exit(0);
    });
}
