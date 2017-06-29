import assert = require("assert");
import * as ttm from "vsts-task-lib/mock-test";
import path = require("path");
import os = require("os");

describe("sftpupload Test Suite", function () {
    this.timeout(20000);


    before((done) => {
        // init here

        done();
    });

    after(function () {

    });
    it("fails when the username is not set", () => {
        let tp = path.join(__dirname, "failsIfUsernameNotset.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(!tr.succeeded, "should have failed");
        assert(tr.invokedToolCount == 0, "should not have run any tools");
        assert.equal(tr.warningIssues, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have 1 error issue");
        let errorIssues = tr.errorIssues.join(os.EOL);
        assert(errorIssues.indexOf("Input required: username") >= 0, `wrong error message: ${errorIssues}`);
    })
    it("should not generate error for empty password/passphrase", () => {
        let tp = path.join(__dirname, "noErrorIfPassowordNotSet.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.invokedToolCount == 0, "should not have run any tools");
        assert(tr.stderr.indexOf("Input required: password") < 0, "task should not require password");
    })
    it("fails when host is not provided", () => {

        let tp = path.join(__dirname, "failsIfHostNotSet.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(!tr.succeeded, "task should have failed");
        assert(tr.invokedToolCount == 0, "should not have run any tools");
        assert(tr.errorIssues.length > 0, "should have written to stderr");
        let errorIssues = tr.errorIssues.join(os.EOL);
        assert(errorIssues.indexOf("Input required: host") >= 0, `wrong error message: ${errorIssues}`);
    })

    it("should uses 22 as the default port when the port number is not set", () => {
        let tp = path.join(__dirname, "defaultPortIs22IfNotSet.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.invokedToolCount == 0, "should not have run any tools");
        assert(tr.stdout.indexOf("UseDefaultPort") >= 0, "default port 22 was not used");
        assert(tr.succeeded, "task should have succeeded");

    })
    it("fails if source is a file", () => {
        let tp = path.join(__dirname, "failsIfSourceIsFile.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.invokedToolCount == 0, "should not have run any tools");
        assert(tr.failed, "task should have failed");
        let errorIssues = tr.errorIssues.join(os.EOL);
        assert(errorIssues.indexOf("loc_mock_SourceNotFolder") >= 0, `wrong error message:  ${errorIssues}` );
    })

    it("fails for missing contents", () => {
        let tp = path.join(__dirname, "failsIfMissingContent.js");
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(tr.invokedToolCount == 0, "should not have run any tools");
        assert(tr.failed, "task should have failed");
        let errorIssues = tr.errorIssues.join(os.EOL);
        assert(errorIssues.indexOf("Input required: contents") >= 0, `wrong error message:  ${errorIssues}`);
    })
});