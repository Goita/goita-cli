import * as clc from "cli-color";
import * as program from "commander";
import * as SampleAI from "goita-ai-sample";
import * as goita from "goita-core";
import * as readline from "readline";
import * as commanderex from "./commander.ex";
import { Cui } from "./cui";

import * as fs from "fs";
const packageJson = JSON.parse(fs.readFileSync(__dirname + "/../package.json").toString());

const command = program.version(packageJson.version)
    .option("-i, --initial-state [state]", "initial state historyString", null)
    .option("-s, --initial-score [score]", "initial scores for each team",
    (v: string) => v.split(",").map((s: string) => Number(s)), [0, 0])
    .option("-p, --player-no [no]", "your player No.", (p) => Number(p) - 1, 0)
    .option("-G, --noGoshi", "never deal goshi")
    // .option("-Y, --noYaku", "never deal 6-8 shi or 5-5 shi")
    .parse(process.argv) as commanderex.IGameCommand;

const ai = new SampleAI.SimpleAI();
const wait: number = 1000;
const msgs = new Array<string>();
const msgLines: number = 5;
const game = goita.Factory.createGame();
game.startNewGame();
const options = new goita.DealOptions();
options.noGoshi = command.noGoshi ? true : false;
// options.noYaku = command.noYaku ? true : false;
game.setDealOptions(options);
game.setInitialScore(command.initialScore);

function refreshUI(): void {
    Cui.clearScreen();
    Cui.showField(game, command.playerNo);
    Cui.showHand(game, command.playerNo, false);
    Cui.showMessages(msgs, msgLines);
}

function gameLoop(exitloop: () => void) {
    const exitRound = () => {
        if (game.isEnd) {
            exitloop();
        } else {
            gameLoop(exitloop);
        }
    };

    if (game.roundCount === 1 && command.initialState) {
        game.startNewDealWithInitialState("11112678,11345679,11112345,23452345,s1");
    } else {
        game.startNewDeal();
    }
    msgs.push("round: " + game.roundCount + " has started");
    if (game.board.turnPlayer.no === command.playerNo) {
        msgs.push("you are the dealer");
    } else {
        msgs.push("p" + game.board.turnPlayer.no + " is the dealer");
    }
    refreshUI();

    if (game.board.isGoshiSuspended) {
        const goshiP = game.board.goshiPlayerNo;
        for (const p of goshiP) {
            if (p === command.playerNo) {
                msgs.push("you have 5 shi");
                refreshUI();
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
                refreshUI();
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
    refreshUI();
    if (game.board.turnPlayer.no === command.playerNo) {
        Cui.selectMove(game, (m) => {
            game.board.playMove(m);
            if (m.pass) {
                msgs.push("you passed");
            } else {
                msgs.push("you played " + m.toTextString());
            }
            refreshUI();

            if (game.board.isEndOfDeal) {
                // TODO: must turn this move into finish move
                msgs.push("you have finished by score " + m.toScore());
                msgs.push("the history is ");
                msgs.push(game.board.toHistoryString());
                refreshUI();
                exitloop();
            } else {
                roundLoop(exitloop);
            }
        });
    } else {
        const p = "p" + (game.board.turnPlayer.no + 1);
        const m = ai.chooseMove(game.board.toThinkingInfo());
        game.board.playMove(m);
        if (m.pass) {
            msgs.push(p + " passed");
        } else {
            msgs.push(p + " played " + m.toTextString());
        }
        refreshUI();
        if (game.board.isEndOfDeal) {
            msgs.push(p + " has finished by score " + m.toScore());
            msgs.push("the history is ");
            msgs.push(game.board.toHistoryString());
            refreshUI();
            setTimeout(() => {
                exitloop();
            }, wait * 3);
        } else {
            setTimeout(() => {
                roundLoop(exitloop);
            }, wait);
        }
    }
};

function exitMessage(): void {
    let win: boolean;
    let m = "";
    win = game.scores[command.playerNo % 2] >= game.winScore;
    m += "you have ";
    if (win) {
        m += "won";
    } else {
        m += "lost";
    }
    m += " the game. the scores ware " + game.scores[0] + ", " + game.scores[1];
    m += "\n";
    msgs.push(m);
    refreshUI();
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
