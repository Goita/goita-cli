import * as program from "commander";
import * as fs from "fs";
import * as goita from "goita-core";
const packageJson = JSON.parse(fs.readFileSync(__dirname + "/../package.json").toString());

const command = program.version(packageJson.version)
    .option("-l, --limit [limit]", "search limit(leaves)", 10000)
    .parse(process.argv);

const solver = new goita.Solver();

for (const a of command.args) {
    const evalMoves = solver.solve(a);
    if (evalMoves.length > 0) {
        process.stdout.write("Solve result for:\n");
        process.stdout.write(a + "\n");
        for (const m of evalMoves) {
            // tslint:disable-next-line:max-line-length
            const result = m.move.toOpenString() + "(" + m.move.block.Text + m.move.attack.Text + "), score:" + m.score + ", trailing moves: " + m.history.replace(a + ",", "");
            process.stdout.write(result + "\n");
        }
    } else {
        process.stdout.write("cannot evaluate moves\n");
    }
}

process.exit(0);
