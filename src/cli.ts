import * as program from "commander";

program.version("0.0.1")
.command("solve [history]", "evaluate score for each moves").alias("s")
.command("game", "start a game").alias("g")
.parse(process.argv);
