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
    .option("-Y, --noYaku", "never deal 6-8 shi or 5-5 shi")
    .parse(process.argv) as commanderex.IGameCommand;

const ai = new SampleAI.SimpleAI();
const wait: number = 1000;
const msgs = new Array<string>();
const msgLines: number = 8;
const game = goita.Factory.createGame();
game.startNewGame();
const options = new goita.DealOptions();
options.noGoshi = command.noGoshi ? true : false;
options.noYaku = command.noYaku ? true : false;
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
        setTimeout(() => {
            if (game.isEnd) {
                exitloop();
            } else {
                gameLoop(exitloop);
            }
        }, wait);
    };

    if (game.history.length === 0 && !game.board && command.initialState) {
        game.startNewDealWithInitialState(command.initialState);
    } else {
        game.startNewDeal();
    }
    msgs.push("round: " + game.roundCount + " has started");

    if (game.board.isEndOfDeal) {
        const f = game.board.getFinishState();
        const yaku = game.board.yakuInfo[0];
        let yakuName = "";
        switch (yaku.yaku) {
            case goita.Yaku.rokushi:
                yakuName = "6 shi";
                break;
            case goita.Yaku.nanashi:
                yakuName = "7 shi";
                break;
            case goita.Yaku.hachishi:
                yakuName = "8 shi";
                break;
            case goita.Yaku.goshigoshi_win:
                yakuName = "5-5 shi";
                break;
            default:
                break;
        }
        const player = f.nextDealerNo === command.playerNo ? "you" : "player" + f.nextDealerNo;
        msgs.push(player + " finished with " + yakuName + " by score " + f.wonScore);
        refreshUI();
        setTimeout(() => {
            exitRound();
        }, wait * 2);

        return;
    }

    if (game.board.turnPlayer.no === command.playerNo) {
        msgs.push("you are the dealer");
    } else {
        msgs.push("p" + game.board.turnPlayer.no + " is the dealer");
    }
    refreshUI();

    if (game.board.isGoshiSuspended) {
        const goshiP = game.board.goshiPlayerNo;
        let redealCount = 0;
        // ai choose first
        for (const p of goshiP.filter((gp) => goita.Util.shiftTurn(gp, 2) !== command.playerNo)) {
            const pName = "p" + (p + 1);
            msgs.push(pName + " has 5 shi");
            refreshUI();
            const decidePlayerName = "p" + (goita.Util.shiftTurn(p, 2) + 1);
            const ret = ai.continueGoshi(game.board.toThinkingInfo());
            if (ret) {
                msgs.push(decidePlayerName + " decided to play");
            } else {
                msgs.push(decidePlayerName + " decided to redeal");
                redealCount++;
            }
            refreshUI();
        }

        if (goshiP.some((gp) => goita.Util.shiftTurn(gp, 2) === command.playerNo)) {
            msgs.push("your partner has 5 shi");
            refreshUI();
            process.stdout.write("do you wish to play?\n");
            Cui.askYesNo((yes) => {
                if (yes) {
                    msgs.push("you decided to play");
                } else {
                    msgs.push("you decided to redeal");
                    redealCount++;
                }

                if (redealCount >= goshiP.length) {
                    game.board.redeal();
                    exitRound();
                } else {
                    game.board.continueGoshi();
                    roundLoop(exitRound);
                }
            });
        } else {
            if (redealCount >= goshiP.length) {
                game.board.redeal();
                exitRound();
            } else {
                game.board.continueGoshi();
                roundLoop(exitRound);
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
