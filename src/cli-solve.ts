import * as program from "commander";
import * as goita from "goita-core";
program.version("0.0.1")
.option("-l, --limit [limit]", "search limit(leaves)")
.parse(process.argv);

const solver = new goita.Solver();

for (const a of program.args){
    const evalMoves = solver.solve(a);
    if (evalMoves.length > 0) {
        process.stdout.write("Solve result for:\n");
        process.stdout.write(a + "\n");
        for (const m of evalMoves){
            // tslint:disable-next-line:max-line-length
            const result = m.move.toOpenString() + "(" + m.move.block.Text + m.move.attack.Text + "), score:" + m.score + ", trailing moves: " + m.history.replace(a + ",", "");
            process.stdout.write(result + "\n");
        }
    }else {
        process.stdout.write("cannot evaluate moves\n");
    }
}

process.exit(0);
