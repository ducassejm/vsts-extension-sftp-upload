import tmrm = require("vsts-task-lib/mock-run");
import path = require("path");
import th = require("./helpers");

let taskPath = path.join(__dirname, "..", "index.js");
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setAnswers(th.Helpers.getAnswersSourcePathIsFile());
tmr.registerMock("./ssh-common",require("./mock-ssh-common"));

tmr.setInput("username","");

tmr.setInput("password","password");
tmr.setInput("contents", "**/*");
tmr.setInput("sourceFolder", "/user/build");
tmr.setInput("host", "host");

tmr.run();