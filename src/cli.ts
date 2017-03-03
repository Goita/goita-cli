import * as program from "commander";

import * as fs from "fs";

const packageJson = JSON.parse(fs.readFileSync(__dirname + "/../package.json").toString());
program.version(packageJson.version)
.command("solve [history]", "evaluate score for each moves").alias("s")
.command("game", "start a game").alias("g")
.parse(process.argv);
