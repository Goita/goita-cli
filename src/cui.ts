import * as clc from "cli-color";
import * as goita from "goita-core";
import * as readline from "readline";
import * as clcex from "./cli-color.ex";
const console = process.stdout;
const clc2 = clc as clcex.IExFormat;

export class Cui {

    public static clearScreen(): void {
        console.write(clc.reset);
    }
    public static showMessages(messages: string[], msgCount: number): void {
        const msgs = messages.slice(-msgCount);
        for (const m of msgs) {
            console.write(m + "\n");
        }
        if (msgs.length === 0) {
            console.write("no messages\n");
        }
        console.write("------------------------\n");
    }
    public static showHand(game: goita.Game, turn: number, hidden: boolean) {
        const player = game.board.players[turn];
        const p = "p" + (player.no + 1);
        console.write(p + " hand: ");
        if (hidden) {
            const len = player.hand.length;
            let str = "";
            for (const h of player.hand.sort()) {
                if (h.value !== goita.Define.empty) {
                    str += "☗";
                }
            }
            console.write(clc.yellow(str));
        } else {
            console.write(clc.yellow(goita.KomaArray.toTextString(player.hand.sort())));
        }
        console.write("\n");
        console.write("------------------------\n");
    }

    public static showField(game: goita.Game, turn: number) {
        const player = game.board.players[turn];
        if (player.no % 2 === 0) {
            console.write("your team:" + clc.green(game.scores[0]) + " opponent:" + clc.green(game.scores[1]) + "\n");
        }else {
            console.write("opponent:" + clc.green(game.scores[0]) + " your team:" + clc.green(game.scores[1]) + "\n");
        }
        console.write("round: " + game.roundCount + "\n");
        console.write("------------------------\n");

        const history = new Array<string>();
        history.push("p1 ", "p2 ", "p3 ", "p4 ");
        for (let i = 0; i < game.board.history.dealer; i++) {
            history[i] += "|     ";
        }
        for (let i = 0; i < game.board.history.moveStack.length; i++) {
            const m = game.board.history.moveStack[i];
            const p = goita.Util.shiftTurn(i % 4, game.board.history.dealer);
            let hs = "";
            if (m.pass) {
                hs = clc.blackBright("なし");
            } else if (m.faceDown) {
                hs = goita.Koma.hidden.Text + m.attack.Text;
                hs = clc.cyanBright(hs);
            } else {
                hs = m.block.Text + m.attack.Text;
                hs = clc.cyanBright(hs);
            }
            history[p] += "| " + hs;
        }
        for (const h of history) {
            console.write(h);
            console.write("\n");
        }
        console.write("------------------------\n");
        const pLabel = new Array<string>();
        const bLine = new Array<goita.Koma[]>();
        const aLine = new Array<goita.Koma[]>();
        const empty = "＿";

        for (const p of game.board.players) {
            const l = "p" + (p.no + 1) + ":";
            pLabel.push(l);
            const b = p.field.filter((k, i) => i % 2 === 0);
            bLine.push(b);
            const a = p.field.filter((k, i) => i % 2 !== 0);
            aLine.push(a);
        }

        const pNo = goita.Util.shiftTurn(player.no, 2);
        console.write("    ");
        console.write(pLabel[pNo]);
        for (const a of aLine[pNo].reverse()){
            console.write(clc.cyan(a === goita.Koma.empty ? empty : a.Text));
        }
        console.write("\n");
        console.write("       ");
        for (const b of bLine[pNo].reverse()){
            console.write(clc.cyan(b === goita.Koma.empty ? empty : b.Text));
        }
        console.write("\n");

        const lOpNo = goita.Util.shiftTurn(player.no, -1);
        const rOpNo = goita.Util.shiftTurn(player.no, 1);

        console.write(pLabel[lOpNo]);
        console.write("             ");
        console.write(pLabel[rOpNo]);
        console.write("\n");
        const laLine = aLine[lOpNo].map((k) => k === goita.Koma.empty ? empty : k.Text);
        const lbLine = bLine[lOpNo].map((k) => k === goita.Koma.empty ? empty : k.Text);
        const raLine = aLine[rOpNo].map((k) => k === goita.Koma.empty ? empty : k.Text);
        const rbLine = bLine[rOpNo].map((k) => k === goita.Koma.empty ? empty : k.Text);

        for (let i = 0; i < 4; i++) {
            let s = "";
            s += laLine[i];
            s += lbLine[i];
            s += "            ";
            s += rbLine[3 - i];
            s += raLine[3 - i];
            console.write(clc.cyan(s));
            console.write("\n");
        }

        console.write("    ");
        console.write(pLabel[player.no]);
        for (const b of bLine[player.no]){
            console.write(clc.cyan(b === goita.Koma.empty ? empty : b.Text));
        }
        console.write("\n");
        console.write("       ");
        for (const a of aLine[player.no]){
            console.write(clc.cyan(a === goita.Koma.empty ? empty : a.Text));
        }
        console.write("\n");

        console.write("------------------------\n");
    }

    public static selectMove(game: goita.Game, callback: (move: goita.Move) => void): void {
        const info = game.board.toThinkingInfo();
        const blocks = info.getBlockKomaList();
        const faceDown = !info.canPass;

        // ask block koma
        const komatype = faceDown ? "face down" : "block";
        Cui.askKoma(blocks, info.canPass, komatype, (block) => {
            if (block === "p") {
                const move = goita.Move.ofPass(game.board.turnPlayer.no);
                callback(move);
                return;
            }

            const attacks = info.getAttackKomaList(goita.Koma.fromStr(block));

            Cui.askKoma(attacks, false, "attack", (attack) => {
                const b = goita.Koma.fromStr(block);
                const a = goita.Koma.fromStr(attack);
                if (faceDown) {
                    const move = goita.Move.ofFaceDown(game.board.turnPlayer.no, b, a);
                    callback(move);
                }else {
                    const move = goita.Move.ofMatch(game.board.turnPlayer.no, b, a);
                    callback(move);
                }
            });
        });
    }

    public static askKoma(komas: goita.Koma[], pass: boolean, komaType: string, callback: (koma: string) => void): void {
        const list = new Array<string>();
        const validation = new Array<string>();
        for (const koma of komas) {
            list.push(" " + koma.value + ": " + koma.Text);
            validation.push(koma.value);
        }
        if (pass) {
            list.push(" 0: なし");
        }
        console.write(list.join(","));
        console.write("\n");

        const rl = readline.createInterface(
                    process.stdin,
                    process.stdout,
                );
        rl.question("select " + komaType + " koma>", (ans) => {
            rl.close();
            if (ans === "0" && pass) {
                callback("p");
            }else if (ans.length === 1 && validation.indexOf(ans) >= 0) {
                callback(ans);
            }else {
                // retry
                Cui.askKoma(komas, pass, komaType, callback);
            }
        });
    }

    public static askYesNo(callback: (answer: boolean) => void): void {
        const rl = readline.createInterface(
                    process.stdin,
                    process.stdout,
                );
        rl.question("yes/no>", (ans) => {
            rl.close();
            const lans = ans.toLowerCase();
            if (lans.indexOf("y") >= 0) {
                callback(true);
            }else {
                callback(false);
            }
        });
    }
}
