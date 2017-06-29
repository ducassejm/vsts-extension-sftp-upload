import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import th = require("./helpers");

let taskPath = path.join(__dirname,'..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("host","")
tmr.setInput("username","user");
tmr.setInput('password', 'password');
tmr.setInput('contents', '**/*');
tmr.setInput('sourceFolder', '/user/build');

tmr.setAnswers(th.Helpers.getAnswersSourcePathIsDectory());
tmr.registerMock("./ssh-common",require("./mock-ssh-common"));

tmr.run();