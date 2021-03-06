import tmrm = require("vsts-task-lib/mock-run");
import path = require("path");
import th = require("./helpers");

let taskPath = path.join(__dirname, "..", "index.js");
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setAnswers(th.Helpers.getAnswersSourcePathIsDectory());
tmr.registerMock("./sftp-helper",require("./mock-sftp-helper"));

tmr.setInput("contents", "");
tmr.setInput("username","user");
tmr.setInput("password", "password");
tmr.setInput("sourceFolder", "/user/build");
tmr.setInput("host", "host");
tmr.setInput("targetFolder", "/home/user");

tmr.run();